import uuid
from datetime import datetime, date, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from ..db.session import get_db
from ..models import (
    VerificationRequest, Project, User, VerificationEvidenceLink,
    Evidence, Notification
)
from ..core.rbac import get_current_user, require_roles
from ..services.audit_service import record_audit_event

router = APIRouter(prefix="/verifications", tags=["Field Verifications"])

class CreateVerificationRequest(BaseModel):
    project_id: str
    assigned_officer_id: Optional[str] = None
    priority_level: Optional[str] = "Medium"
    site_visit_date: Optional[date] = None
    instructions: Optional[str] = None

class CompleteVerificationRequest(BaseModel):
    verification_report: str
    gps_lat: float
    gps_long: float
    site_visit_date: Optional[date] = None
    checklist: Optional[Dict[str, Any]] = None
    evidence_ids: Optional[List[str]] = None

@router.get("")
def list_verifications(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List verification requests scoped by requester's role.
    """
    query = select(VerificationRequest).order_by(VerificationRequest.assigned_at.desc())
    role = current_user.role.role_name

    if role == "FieldOfficer":
        query = query.where(VerificationRequest.assigned_officer_id == current_user.user_id)
    elif role == "DistrictAuthority":
        # Projects in district
        query = query.join(Project).where(Project.district == current_user.district)
    elif role == "StateNodalAuthority":
        query = query.join(Project).where(Project.state == current_user.state)
    elif role in ("MinistryUser", "Admin"):
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view verification requests")

    if status_filter:
        query = query.where(VerificationRequest.status == status_filter)
    if priority_filter:
        query = query.where(VerificationRequest.priority_level == priority_filter)

    records = db.execute(query).scalars().all()

    output = []
    for v in records:
        proj = db.execute(select(Project).where(Project.project_id == v.project_id)).scalar_one_or_none()
        officer = None
        if v.assigned_officer_id:
            officer = db.execute(select(User).where(User.user_id == v.assigned_officer_id)).scalar_one_or_none()

        output.append({
            "verification_id": str(v.verification_id),
            "project_id": str(v.project_id),
            "project_name": proj.project_name if proj else "Unknown Project",
            "district": proj.district if proj else "N/A",
            "state": proj.state if proj else "N/A",
            "category": proj.category if proj else "N/A",
            "assigned_officer_id": str(v.assigned_officer_id) if v.assigned_officer_id else None,
            "assigned_officer_name": officer.name if officer else "Unassigned",
            "priority_level": v.priority_level,
            "status": v.status,
            "site_visit_date": v.site_visit_date.isoformat() if v.site_visit_date else None,
            "verification_report": v.verification_report,
            "gps_lat": float(v.gps_lat) if v.gps_lat else None,
            "gps_long": float(v.gps_long) if v.gps_long else None,
            "assigned_at": v.assigned_at.isoformat(),
            "completed_at": v.completed_at.isoformat() if v.completed_at else None
        })
    return output

@router.post("", status_code=status.HTTP_201_CREATED)
def create_verification_request(
    req: CreateVerificationRequest,
    current_user: User = Depends(require_roles(["DistrictAuthority", "StateNodalAuthority", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Manually creates a field verification request and assigns a field officer.
    """
    try:
        p_uuid = uuid.UUID(req.project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    proj = db.execute(select(Project).where(Project.project_id == p_uuid)).scalar_one_or_none()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")

    officer_uuid = None
    if req.assigned_officer_id:
        try:
            officer_uuid = uuid.UUID(req.assigned_officer_id)
        except ValueError:
            pass

    # If no officer provided, find a FieldOfficer in the same district/state
    if not officer_uuid:
        fo = db.execute(
            select(User).join(User.role).where(
                and_(User.district == proj.district, User.role.has(role_name="FieldOfficer"))
            )
        ).scalars().first()
        if fo:
            officer_uuid = fo.user_id

    ver_id = uuid.uuid4()
    now = datetime.now(timezone.utc)

    ver = VerificationRequest(
        verification_id=ver_id,
        project_id=p_uuid,
        assigned_officer_id=officer_uuid,
        assigned_by=current_user.user_id,
        priority_level=req.priority_level or "Medium",
        status="Assigned",
        site_visit_date=req.site_visit_date or (date.today()),
        verification_report=req.instructions,
        assigned_at=now
    )
    db.add(ver)
    db.commit()
    db.refresh(ver)

    # Hash-chained audit event
    record_audit_event(
        db=db,
        action="VERIFICATION_REQUEST_CREATED",
        entity_type="verification_requests",
        entity_id=ver.verification_id,
        user_id=current_user.user_id,
        new_value={
            "project_id": str(p_uuid),
            "priority": ver.priority_level,
            "officer_id": str(officer_uuid) if officer_uuid else None
        }
    )

    # Notify Field Officer if assigned
    if officer_uuid:
        notif = Notification(
            notification_id=uuid.uuid4(),
            user_id=officer_uuid,
            channel="in-app",
            title="New Field Verification Visit Assigned",
            message=f"You have been assigned to verify '{proj.project_name}' in {proj.district}.",
            related_entity_type="verification",
            related_entity_id=ver.verification_id,
            is_read=False
        )
        db.add(notif)
        db.commit()

    return {
        "message": "Verification request created successfully",
        "verification_id": str(ver.verification_id),
        "status": ver.status,
        "priority_level": ver.priority_level
    }

@router.post("/{verification_id}/start")
def start_verification_visit(
    verification_id: str,
    current_user: User = Depends(require_roles(["FieldOfficer", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Field officer marks that a site visit is in progress.
    """
    try:
        v_uuid = uuid.UUID(verification_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid verification ID format")

    ver = db.execute(select(VerificationRequest).where(VerificationRequest.verification_id == v_uuid)).scalar_one_or_none()
    if not ver:
        raise HTTPException(status_code=404, detail="Verification request not found")

    ver.status = "InProgress"
    ver.site_visit_date = date.today()
    db.commit()

    return {"message": "Verification visit started", "status": "InProgress"}

@router.post("/{verification_id}/complete")
def complete_verification_visit(
    verification_id: str,
    req: CompleteVerificationRequest,
    current_user: User = Depends(require_roles(["FieldOfficer", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Field officer completes a site visit, submitting inspection report, GPS coordinates,
    checklist evaluation, and linked evidence.
    """
    try:
        v_uuid = uuid.UUID(verification_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid verification ID format")

    ver = db.execute(select(VerificationRequest).where(VerificationRequest.verification_id == v_uuid)).scalar_one_or_none()
    if not ver:
        raise HTTPException(status_code=404, detail="Verification request not found")

    now = datetime.now(timezone.utc)
    ver.status = "Completed"
    ver.verification_report = req.verification_report
    ver.gps_lat = req.gps_lat
    ver.gps_long = req.gps_long
    ver.site_visit_date = req.site_visit_date or date.today()
    ver.completed_at = now
    ver.synced_at = now

    # Link evidence items if provided
    if req.evidence_ids:
        for eid_str in req.evidence_ids:
            try:
                eid_uuid = uuid.UUID(eid_str)
                link = VerificationEvidenceLink(
                    link_id=uuid.uuid4(),
                    verification_id=ver.verification_id,
                    evidence_id=eid_uuid
                )
                db.add(link)
            except ValueError:
                pass

    db.commit()
    db.refresh(ver)

    # Hash-chained audit event
    record_audit_event(
        db=db,
        action="VERIFICATION_COMPLETED",
        entity_type="verification_requests",
        entity_id=ver.verification_id,
        user_id=current_user.user_id,
        new_value={
            "report": req.verification_report,
            "gps_lat": req.gps_lat,
            "gps_long": req.gps_long,
            "completed_at": now.isoformat()
        }
    )

    return {
        "message": "Verification visit completed and submitted successfully",
        "verification_id": str(ver.verification_id),
        "status": "Completed"
    }
