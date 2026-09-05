import uuid
from datetime import datetime, date, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func

from ..db.session import get_db
from ..models import (
    Project, ProjectStatusHistory, User, Role, ImplementingAgency,
    VerificationRequest, Evidence, RiskScore, CitizenTrustScore
)
from ..core.rbac import get_current_user, filter_projects_by_role, require_roles
from ..services.audit_service import record_audit_event
from ..services.analysis_service import analyze_project

router = APIRouter(prefix="/projects", tags=["Projects"])

class UpdateStatusRequest(BaseModel):
    new_status: str
    reason: str
    expected_resume_date: Optional[date] = None

class AssignAgencyRequest(BaseModel):
    agency_id: str

@router.get("/public")
def list_public_projects(
    state: Optional[str] = None,
    district: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Public read-only citizen view of projects.
    Returns a safe subset of fields only: NO financial amounts, NO internal flags, NO risk scores.
    """
    query = select(Project).order_by(Project.created_at.desc())

    if state:
        query = query.where(Project.state == state)
    if district:
        query = query.where(Project.district == district)
    if category:
        query = query.where(Project.category == category)
    if search:
        query = query.where(Project.project_name.ilike(f"%{search}%"))

    projects = db.execute(query.limit(limit).offset(offset)).scalars().all()

    public_list = []
    for p in projects:
        # Citizen crowdsourced reports: evidence uploaded by Citizen-role users.
        # (Legacy code filtered evidence_category == "CitizenFeedback", which is
        # not a valid DB CHECK value — valid values are site_photo/site_video/
        # purchase_invoice/completion_certificate/halt_justification/
        # utilization_proof/other. So scope by uploader role instead.)
        citizen_reports = db.execute(
            select(Evidence)
            .join(User, Evidence.uploaded_by == User.user_id)
            .join(Role, User.role_id == Role.role_id)
            .where(
                and_(
                    Evidence.project_id == p.project_id,
                    Role.role_name == "Citizen",
                )
            )
        ).scalars().all()

        confirmed_count = sum(1 for r in citizen_reports if r.status == "Verified")
        total_reports = len(citizen_reports)

        public_list.append({
            "project_id": str(p.project_id),
            "project_name": p.project_name,
            "description": p.description,
            "category": p.category,
            "status": p.status,
            "progress_percentage": p.progress_percentage,
            "district": p.district,
            "state": p.state,
            "latitude": float(p.latitude) if p.latitude else None,
            "longitude": float(p.longitude) if p.longitude else None,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "expected_completion_date": p.expected_completion_date.isoformat() if p.expected_completion_date else None,
            "citizen_reports_count": total_reports,
            "citizen_confirmed_count": confirmed_count
        })
    return public_list

@router.get("")
def list_projects(
    status_filter: Optional[str] = None,
    is_flagged: Optional[bool] = None,
    category: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Role-scoped project listing.
    Filters strictly by user role:
    - MPUser: only own constituency projects
    - DistrictAuthority: only district projects
    - StateNodalAuthority: only state projects
    - FieldOfficer: only projects assigned for field verification
    - Vendor: only projects belonging to vendor's implementing agency
    - MinistryUser / Admin: unrestricted system-wide access
    - Citizen: blocked (must use /projects/public)
    """
    base_query = select(Project).order_by(Project.created_at.desc())
    scoped_query = filter_projects_by_role(base_query, current_user, db)

    if status_filter:
        scoped_query = scoped_query.where(Project.status == status_filter)
    if is_flagged is not None:
        scoped_query = scoped_query.where(Project.is_flagged == is_flagged)
    if category:
        scoped_query = scoped_query.where(Project.category == category)

    projects = db.execute(scoped_query.limit(limit).offset(offset)).scalars().all()

    output = []
    for p in projects:
        mp = db.execute(select(User).where(User.user_id == p.mp_id)).scalar_one_or_none()
        agency = None
        if p.implementing_agency_id:
            agency = db.execute(select(ImplementingAgency).where(ImplementingAgency.agency_id == p.implementing_agency_id)).scalar_one_or_none()

        output.append({
            "project_id": str(p.project_id),
            "project_name": p.project_name,
            "description": p.description,
            "category": p.category,
            "recommendation_id": str(p.recommendation_id),
            "mp_id": str(p.mp_id),
            "mp_name": mp.name if mp else "N/A",
            "sanctioned_amount": float(p.sanctioned_amount),
            "released_amount": float(p.released_amount),
            "utilized_amount": float(p.utilized_amount),
            "tender_reference_no": p.tender_reference_no,
            "implementing_agency_id": str(p.implementing_agency_id) if p.implementing_agency_id else None,
            "implementing_agency_name": agency.agency_name if agency else "Unassigned",
            "sc_st_beneficiary_flag": p.sc_st_beneficiary_flag,
            "status": p.status,
            "progress_percentage": p.progress_percentage,
            "is_flagged": p.is_flagged,
            "latest_risk_score": float(p.latest_risk_score) if p.latest_risk_score is not None else 0.0,
            "district": p.district,
            "state": p.state,
            "latitude": float(p.latitude) if p.latitude else None,
            "longitude": float(p.longitude) if p.longitude else None,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "expected_completion_date": p.expected_completion_date.isoformat() if p.expected_completion_date else None,
            "actual_completion_date": p.actual_completion_date.isoformat() if p.actual_completion_date else None,
            "created_at": p.created_at.isoformat()
        })
    return output

@router.get("/{project_id}")
def get_project_detail(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Role-scoped project detail.
    """
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    base_query = select(Project).where(Project.project_id == p_uuid)
    scoped_query = filter_projects_by_role(base_query, current_user, db)
    p = db.execute(scoped_query).scalar_one_or_none()

    if not p:
        raise HTTPException(status_code=404, detail="Project not found or not within your role scope")

    mp = db.execute(select(User).where(User.user_id == p.mp_id)).scalar_one_or_none()
    agency = None
    if p.implementing_agency_id:
        agency = db.execute(select(ImplementingAgency).where(ImplementingAgency.agency_id == p.implementing_agency_id)).scalar_one_or_none()

    history = db.execute(
        select(ProjectStatusHistory).where(ProjectStatusHistory.project_id == p.project_id).order_by(ProjectStatusHistory.changed_at.desc())
    ).scalars().all()

    risk = db.execute(
        select(RiskScore).where(RiskScore.project_id == p.project_id).order_by(RiskScore.calculated_at.desc())
    ).scalars().first()

    return {
        "project_id": str(p.project_id),
        "project_name": p.project_name,
        "description": p.description,
        "category": p.category,
        "recommendation_id": str(p.recommendation_id),
        "mp_id": str(p.mp_id),
        "mp_name": mp.name if mp else "N/A",
        "sanctioned_amount": float(p.sanctioned_amount),
        "released_amount": float(p.released_amount),
        "utilized_amount": float(p.utilized_amount),
        "tender_reference_no": p.tender_reference_no,
        "implementing_agency_id": str(p.implementing_agency_id) if p.implementing_agency_id else None,
        "implementing_agency_name": agency.agency_name if agency else "Unassigned",
        "sc_st_beneficiary_flag": p.sc_st_beneficiary_flag,
        "status": p.status,
        "progress_percentage": p.progress_percentage,
        "is_flagged": p.is_flagged,
        "latest_risk_score": float(p.latest_risk_score) if p.latest_risk_score is not None else 0.0,
        "risk_details": risk.anomaly_reasons if risk else None,
        "district": p.district,
        "state": p.state,
        "latitude": float(p.latitude) if p.latitude else None,
        "longitude": float(p.longitude) if p.longitude else None,
        "start_date": p.start_date.isoformat() if p.start_date else None,
        "expected_completion_date": p.expected_completion_date.isoformat() if p.expected_completion_date else None,
        "actual_completion_date": p.actual_completion_date.isoformat() if p.actual_completion_date else None,
        "status_history": [
            {
                "previous_status": h.previous_status,
                "new_status": h.new_status,
                "reason": h.reason,
                "changed_at": h.changed_at.isoformat()
            } for h in history
        ]
    }

@router.post("/{project_id}/status")
def update_project_status(
    project_id: str,
    req: UpdateStatusRequest,
    current_user: User = Depends(require_roles(["DistrictAuthority", "StateNodalAuthority", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Updates project status.
    Mandate: atomically writes a project_status_history row in the same transaction;
    never updates status silently. Also appends to hash-chained audit_logs.
    """
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    p = db.execute(select(Project).where(Project.project_id == p_uuid)).scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    old_status = p.status
    new_status = req.new_status

    p.status = new_status
    if new_status == "Completed" and not p.actual_completion_date:
        p.actual_completion_date = date.today()
        p.progress_percentage = 100

    # Write project_status_history in SAME transaction
    history = ProjectStatusHistory(
        history_id=uuid.uuid4(),
        project_id=p.project_id,
        previous_status=old_status,
        new_status=new_status,
        reason=req.reason,
        changed_by=current_user.user_id,
        expected_resume_date=req.expected_resume_date
    )
    db.add(history)

    db.commit()
    db.refresh(p)

    # Hash-chained audit event
    record_audit_event(
        db=db,
        action="PROJECT_STATUS_UPDATED",
        entity_type="projects",
        entity_id=p.project_id,
        user_id=current_user.user_id,
        old_value={"status": old_status},
        new_value={"status": new_status, "reason": req.reason}
    )

    # Re-evaluate AI/Rule risk score after status transition
    try:
        analyze_project(db=db, project_id=p.project_id, actor_id=current_user.user_id)
    except Exception:
        pass

    return {
        "message": "Status updated successfully",
        "previous_status": old_status,
        "new_status": new_status,
        "changed_at": history.changed_at.isoformat()
    }

@router.post("/{project_id}/assign-agency")
def assign_agency(
    project_id: str,
    req: AssignAgencyRequest,
    current_user: User = Depends(require_roles(["DistrictAuthority", "Admin"])),
    db: Session = Depends(get_db)
):
    try:
        p_uuid = uuid.UUID(project_id)
        agency_uuid = uuid.UUID(req.agency_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    p = db.execute(select(Project).where(Project.project_id == p_uuid)).scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    agency = db.execute(select(ImplementingAgency).where(ImplementingAgency.agency_id == agency_uuid)).scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Implementing Agency not found")

    old_agency_id = str(p.implementing_agency_id) if p.implementing_agency_id else None
    p.implementing_agency_id = agency_uuid
    db.commit()

    record_audit_event(
        db=db,
        action="PROJECT_AGENCY_ASSIGNED",
        entity_type="projects",
        entity_id=p.project_id,
        user_id=current_user.user_id,
        old_value={"agency_id": old_agency_id},
        new_value={"agency_id": str(agency_uuid), "agency_name": agency.agency_name}
    )

    return {"message": "Agency assigned successfully", "agency_name": agency.agency_name}
