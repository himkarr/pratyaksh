import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from ..db.session import get_db
from ..models import Evidence, Project, User, VerificationEvidenceLink
from ..models.schema_models import (
    EVIDENCE_CATEGORIES,
    normalize_evidence_category,
)
from ..core.rbac import get_current_user, require_roles
from ..services.storage_service import upload_evidence_file
from ..services.audit_service import record_audit_event

router = APIRouter(prefix="/evidence", tags=["Evidence"])

ALLOWED_EVIDENCE_TYPES = ("photo", "video", "document")

class VerifyEvidenceRequest(BaseModel):
    decision: str  # "Verified" or "Rejected"
    remarks: Optional[str] = None

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    project_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    evidence_type: str = Form("photo"),
    evidence_category: str = Form("site_photo"),
    remarks: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Multipart upload of progress/completion/citizen evidence directly to Supabase Storage.
    Mandatory geo-tagging validation: latitude and longitude are strictly required.
    evidence_category must satisfy the DB CHECK constraint; legacy aliases
    (e.g. WorkProgress -> site_photo, CitizenFeedback -> other) are normalized.
    """
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    project = db.execute(select(Project).where(Project.project_id == p_uuid)).scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate geo coordinates
    if latitude < -90 or latitude > 90 or longitude < -180 or longitude > 180:
        raise HTTPException(status_code=400, detail="Invalid GPS coordinates provided")

    # Validate + normalize enums against production DB constraints
    if evidence_type not in ALLOWED_EVIDENCE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid evidence_type '{evidence_type}'. Allowed: {list(ALLOWED_EVIDENCE_TYPES)}",
        )
    normalized_category = normalize_evidence_category(evidence_category)
    if normalized_category not in EVIDENCE_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid evidence_category '{evidence_category}'. Allowed: {list(EVIDENCE_CATEGORIES)}",
        )

    # Read and upload file to Supabase Storage
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    content_type = file.content_type or "image/jpeg"
    file_url, storage_path = upload_evidence_file(
        file_bytes=file_bytes,
        filename=file.filename or "evidence.jpg",
        content_type=content_type
    )

    evidence_id = uuid.uuid4()
    now = datetime.now(timezone.utc)

    # Check for potential duplicates (simple hash or same project & same GPS window)
    existing_dup = db.execute(
        select(Evidence).where(
            and_(
                Evidence.project_id == p_uuid,
                Evidence.latitude == latitude,
                Evidence.longitude == longitude
            )
        )
    ).scalars().first()

    dup_flag = existing_dup is not None
    dup_of = existing_dup.evidence_id if existing_dup else None

    evidence = Evidence(
        evidence_id=evidence_id,
        project_id=p_uuid,
        uploaded_by=current_user.user_id,
        evidence_type=evidence_type,
        evidence_category=normalized_category,
        file_url=file_url,
        thumbnail_url=file_url,
        latitude=latitude,
        longitude=longitude,
        captured_at=now,
        uploaded_at=now,
        remarks=remarks,
        is_geotagged=True,
        device_info={"uploader_role": current_user.role.role_name, "content_type": content_type},
        duplicate_flag=dup_flag,
        duplicate_of=dup_of,
        authenticity_score=0.95 if not dup_flag else 0.40,
        status="Pending"
    )

    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    # Hash-chained audit event
    record_audit_event(
        db=db,
        action="EVIDENCE_UPLOADED",
        entity_type="evidence",
        entity_id=evidence.evidence_id,
        user_id=current_user.user_id,
        new_value={
            "project_id": str(p_uuid),
            "evidence_id": str(evidence.evidence_id),
            "category": normalized_category,
            "latitude": latitude,
            "longitude": longitude,
            "file_url": file_url,
            "duplicate_flag": dup_flag
        }
    )

    return {
        "message": "Evidence uploaded successfully",
        "evidence_id": str(evidence.evidence_id),
        "evidence_category": normalized_category,
        "file_url": file_url,
        "is_geotagged": True,
        "duplicate_flag": dup_flag,
        "status": evidence.status
    }

@router.get("")
def list_evidence(
    project_id: Optional[str] = None,
    evidence_category: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List evidence scoped by requester.
    """
    query = select(Evidence).order_by(Evidence.uploaded_at.desc())

    if project_id:
        try:
            p_uuid = uuid.UUID(project_id)
            query = query.where(Evidence.project_id == p_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid project ID format")

    if evidence_category:
        query = query.where(Evidence.evidence_category == evidence_category)
    if status_filter:
        query = query.where(Evidence.status == status_filter)

    records = db.execute(query).scalars().all()

    output = []
    for e in records:
        uploader = db.execute(select(User).where(User.user_id == e.uploaded_by)).scalar_one_or_none()
        output.append({
            "evidence_id": str(e.evidence_id),
            "project_id": str(e.project_id),
            "uploaded_by": str(e.uploaded_by),
            "uploader_name": uploader.name if uploader else "Unknown",
            "uploader_role": uploader.role.role_name if uploader else "Citizen",
            "evidence_type": e.evidence_type,
            "evidence_category": e.evidence_category,
            "file_url": e.file_url,
            "thumbnail_url": e.thumbnail_url,
            "latitude": float(e.latitude) if e.latitude else None,
            "longitude": float(e.longitude) if e.longitude else None,
            "is_geotagged": e.is_geotagged,
            "duplicate_flag": e.duplicate_flag,
            "authenticity_score": float(e.authenticity_score) if e.authenticity_score is not None else 1.0,
            "status": e.status,
            "remarks": e.remarks,
            "uploaded_at": e.uploaded_at.isoformat()
        })
    return output

@router.post("/{evidence_id}/verify")
def verify_evidence(
    evidence_id: str,
    req: VerifyEvidenceRequest,
    current_user: User = Depends(require_roles(["DistrictAuthority", "FieldOfficer", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    District Authority or Field Officer verifies or rejects evidence.
    """
    try:
        e_uuid = uuid.UUID(evidence_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid evidence ID format")

    evidence = db.execute(select(Evidence).where(Evidence.evidence_id == e_uuid)).scalar_one_or_none()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    old_status = evidence.status
    evidence.status = req.decision
    if req.remarks:
        evidence.remarks = f"{evidence.remarks or ''} | [{current_user.role.role_name} Review]: {req.remarks}"

    db.commit()

    record_audit_event(
        db=db,
        action="EVIDENCE_VERIFIED" if req.decision == "Verified" else "EVIDENCE_REJECTED",
        entity_type="evidence",
        entity_id=evidence.evidence_id,
        user_id=current_user.user_id,
        old_value={"status": old_status},
        new_value={"status": req.decision, "remarks": req.remarks}
    )

    return {
        "message": f"Evidence marked as {req.decision}",
        "evidence_id": str(evidence.evidence_id),
        "status": evidence.status
    }
