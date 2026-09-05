import uuid
from datetime import datetime, date, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from ..db.session import get_db
from ..models import (
    Recommendation, Project, ProjectStatusHistory, User, 
    ImplementingAgency, MPConstituencyMapping, Notification,
    ProhibitedCategory
)
from ..core.rbac import get_current_user, require_roles
from ..services.audit_service import record_audit_event
from ..services.analysis_service import analyze_project

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

class CreateRecommendationRequest(BaseModel):
    project_name: str
    description: str
    category: str
    recommended_amount: float
    district: Optional[str] = None
    state: Optional[str] = None
    is_outside_constituency: bool = False
    outside_limit_category: Optional[str] = "within_limit"
    sc_st_beneficiary_flag: bool = False
    recommendation_letter_url: Optional[str] = None

class ActionRecommendationRequest(BaseModel):
    action: str  # "Accepted" or "Rejected"
    remarks: Optional[str] = None
    sanctioned_amount: Optional[float] = None
    tender_reference_no: Optional[str] = None
    implementing_agency_id: Optional[str] = None

@router.post("", status_code=status.HTTP_201_CREATED)
def create_recommendation(
    req: CreateRecommendationRequest,
    current_user: User = Depends(require_roles(["MPUser", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    MP creates a project recommendation.
    """
    # Validate against prohibited categories (Clause 5.1 of MPLADS Guidelines)
    prohibited_list = db.execute(
        select(ProhibitedCategory).where(ProhibitedCategory.is_active == True)
    ).scalars().all()
    for pc in prohibited_list:
        if pc.category_name.lower() in req.category.lower() or req.category.lower() in pc.category_name.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Work category '{req.category}' is non-permissible under MPLADS guidelines: Prohibited Category '{pc.category_name}' ({pc.guideline_reference or 'Clause 5.1'})."
            )

    rec_id = uuid.uuid4()
    target_state = req.state or current_user.state or "Uttar Pradesh"
    target_district = req.district or current_user.district or "Varanasi"

    # Store project metadata inside letter_url / details structure or recommendation
    rec = Recommendation(
        recommendation_id=rec_id,
        mp_id=current_user.user_id,
        project_id=None,
        recommendation_letter_url=req.recommendation_letter_url or f"https://docs.saphire.gov.in/recs/{rec_id}.pdf",
        recommended_amount=req.recommended_amount,
        recommendation_date=date.today(),
        status="Pending"
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    # Save details into audit log
    record_audit_event(
        db=db,
        action="RECOMMENDATION_CREATED",
        entity_type="recommendations",
        entity_id=rec.recommendation_id,
        user_id=current_user.user_id,
        new_value={
            "project_name": req.project_name,
            "description": req.description,
            "category": req.category,
            "recommended_amount": req.recommended_amount,
            "district": target_district,
            "state": target_state,
            "is_outside_constituency": req.is_outside_constituency,
            "outside_limit_category": req.outside_limit_category,
            "sc_st_beneficiary_flag": req.sc_st_beneficiary_flag
        }
    )

    # Notify District Authority
    district_users = db.execute(
        select(User).join(User.role).where(
            and_(User.district == target_district, User.role.has(role_name="DistrictAuthority"))
        )
    ).scalars().all()

    for da in district_users:
        notif = Notification(
            notification_id=uuid.uuid4(),
            user_id=da.user_id,
            channel="in-app",
            title="New MP Recommendation Received",
            message=f"MP {current_user.name} recommended '{req.project_name}' (₹{req.recommended_amount:,.2f}) for review.",
            related_entity_type="recommendation",
            related_entity_id=rec.recommendation_id,
            is_read=False
        )
        db.add(notif)
    db.commit()

    return {
        "message": "Recommendation submitted successfully",
        "recommendation_id": str(rec.recommendation_id),
        "status": rec.status,
        "recommended_amount": float(rec.recommended_amount)
    }

@router.get("")
def list_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List recommendations scoped by requester's role.
    """
    query = select(Recommendation).order_by(Recommendation.recommendation_date.desc())
    role = current_user.role.role_name

    if role == "MPUser":
        query = query.where(Recommendation.mp_id == current_user.user_id)
    elif role in ("MinistryUser", "Admin"):
        pass
    # For District/State users, return all recommendations or filter by state/district
    recs = db.execute(query).scalars().all()

    output = []
    for r in recs:
        mp = db.execute(select(User).where(User.user_id == r.mp_id)).scalar_one_or_none()
        proj = None
        if r.project_id:
            proj = db.execute(select(Project).where(Project.project_id == r.project_id)).scalar_one_or_none()

        output.append({
            "recommendation_id": str(r.recommendation_id),
            "mp_id": str(r.mp_id),
            "mp_name": mp.name if mp else "Unknown MP",
            "recommended_amount": float(r.recommended_amount),
            "recommendation_date": r.recommendation_date.isoformat(),
            "status": r.status,
            "project_id": str(r.project_id) if r.project_id else None,
            "project_name": proj.project_name if proj else None,
            "category": proj.category if proj else "Community Infrastructure",
            "recommendation_letter_url": r.recommendation_letter_url
        })
    return output

@router.post("/{recommendation_id}/action")
def action_recommendation(
    recommendation_id: str,
    req: ActionRecommendationRequest,
    current_user: User = Depends(require_roles(["DistrictAuthority", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    District Authority acknowledges/rejects recommendation.
    Accepting it is the *only* path that creates a projects row — enforcing scheme integrity.
    """
    try:
        rec_uuid = uuid.UUID(recommendation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recommendation ID format")

    rec = db.execute(
        select(Recommendation).where(Recommendation.recommendation_id == rec_uuid)
    ).scalar_one_or_none()

    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    if rec.status != "Pending":
        raise HTTPException(status_code=400, detail=f"Recommendation is already {rec.status}")

    mp = db.execute(select(User).where(User.user_id == rec.mp_id)).scalar_one_or_none()
    rec.district_authority_ack_id = current_user.user_id

    if req.action == "Rejected":
        rec.status = "Rejected"
        db.commit()

        record_audit_event(
            db=db,
            action="RECOMMENDATION_REJECTED",
            entity_type="recommendations",
            entity_id=rec.recommendation_id,
            user_id=current_user.user_id,
            new_value={"remarks": req.remarks}
        )

        # Notify MP
        notif = Notification(
            notification_id=uuid.uuid4(),
            user_id=rec.mp_id,
            channel="in-app",
            title="Recommendation Rejected",
            message=f"Your recommendation was rejected by District Authority: {req.remarks or 'Not compliant with guidelines'}",
            related_entity_type="recommendation",
            related_entity_id=rec.recommendation_id,
            is_read=False
        )
        db.add(notif)
        db.commit()

        return {"message": "Recommendation rejected", "status": "Rejected"}

    elif req.action == "Accepted":
        rec.status = "Accepted"

        # Resolve Agency
        agency_id = None
        if req.implementing_agency_id:
            try:
                agency_id = uuid.UUID(req.implementing_agency_id)
            except ValueError:
                pass
        
        if not agency_id:
            first_agency = db.execute(select(ImplementingAgency)).scalars().first()
            if first_agency:
                agency_id = first_agency.agency_id

        # Enforce: Create project row directly linked to recommendation!
        proj_id = uuid.uuid4()
        sanction_amount = req.sanctioned_amount or float(rec.recommended_amount)
        start_d = date.today()
        # Statutory 1-year completion deadline
        expected_d = start_d + timedelta(days=365)

        proj = Project(
            project_id=proj_id,
            project_name=f"MPLADS Work: Constituency Infrastructure (Rec #{str(rec.recommendation_id)[:8]})",
            description=req.remarks or "Sanctioned public infrastructure development project",
            category="Roads & Bridges",  # Standard initial work category
            recommendation_id=rec.recommendation_id,
            mp_id=rec.mp_id,
            constituency_id=mp.constituency_id if mp else None,
            is_outside_constituency=False,
            outside_limit_category="within_limit",
            sanctioned_amount=sanction_amount,
            released_amount=0.0,
            utilized_amount=0.0,
            tender_reference_no=req.tender_reference_no or (f"TND-MOSPI-{date.today().year}-{str(proj_id)[:6].upper()}" if sanction_amount >= 5000000 else None),
            implementing_agency_id=agency_id,
            sc_st_beneficiary_flag=False,
            status="Sanctioned",
            progress_percentage=0,
            is_flagged=False,
            district=current_user.district or (mp.district if mp else "Varanasi"),
            state=current_user.state or (mp.state if mp else "Uttar Pradesh"),
            start_date=start_d,
            expected_completion_date=expected_d,
            created_by=current_user.user_id,
            latest_risk_score=0.0
        )
        db.add(proj)

        # Update recommendation to link project
        rec.project_id = proj.project_id

        # Atomic project status history
        history = ProjectStatusHistory(
            history_id=uuid.uuid4(),
            project_id=proj.project_id,
            previous_status="Proposed",
            new_status="Sanctioned",
            reason=f"Sanction granted by District Authority {current_user.name}: {req.remarks or 'Formal sanction order issued'}",
            changed_by=current_user.user_id,
            expected_resume_date=expected_d
        )
        db.add(history)

        db.commit()
        db.refresh(proj)

        # Audit log entry with hash chain
        record_audit_event(
            db=db,
            action="PROJECT_SANCTIONED_FROM_RECOMMENDATION",
            entity_type="projects",
            entity_id=proj.project_id,
            user_id=current_user.user_id,
            new_value={
                "project_id": str(proj.project_id),
                "project_name": proj.project_name,
                "sanctioned_amount": float(proj.sanctioned_amount),
                "recommendation_id": str(rec.recommendation_id),
                "district": proj.district,
                "state": proj.state
            }
        )

        # Notify MP
        notif = Notification(
            notification_id=uuid.uuid4(),
            user_id=rec.mp_id,
            channel="in-app",
            title="Recommendation Sanctioned & Project Created!",
            message=f"Your recommendation was approved! Project #{str(proj.project_id)[:8]} has been officially sanctioned.",
            related_entity_type="project",
            related_entity_id=proj.project_id,
            is_read=False
        )
        db.commit()

        # Auto-trigger baseline AI/Rule Engine analysis
        try:
            analyze_project(db=db, project_id=proj.project_id, actor_id=current_user.user_id)
        except Exception:
            pass

        return {
            "message": "Recommendation approved and project created successfully",
            "status": "Accepted",
            "project_id": str(proj.project_id),
            "sanctioned_amount": float(proj.sanctioned_amount)
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be Accepted or Rejected.")
