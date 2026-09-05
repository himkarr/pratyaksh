import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..db.session import get_db
from ..models import (
    SystemConfig, ImplementingAgency, ModelVersion, User, Role
)
from ..core.rbac import get_current_user, require_roles
from ..services.audit_service import record_audit_event

router = APIRouter(prefix="/admin", tags=["Admin & System Governance"])

class UpdateConfigRequest(BaseModel):
    config_value: Dict[str, Any]

class CreateAgencyRequest(BaseModel):
    agency_name: str
    agency_type: str  # GovtDept, Trust, Cooperative, NGO
    registration_number: Optional[str] = None
    bank_account_masked: Optional[str] = None

class CreateModelVersionRequest(BaseModel):
    model_name: str
    version: str
    performance_metrics: Optional[Dict[str, Any]] = None

# 1. System Config Management
@router.get("/config")
def list_system_config(
    current_user: User = Depends(require_roles(["Admin", "MinistryUser"])),
    db: Session = Depends(get_db)
):
    configs = db.execute(select(SystemConfig)).scalars().all()
    return [
        {
            "config_id": str(c.config_id),
            "config_key": c.config_key,
            "config_value": c.config_value,
            "updated_at": c.updated_at.isoformat()
        }
        for c in configs
    ]

@router.put("/config/{key}")
def update_system_config(
    key: str,
    req: UpdateConfigRequest,
    current_user: User = Depends(require_roles(["Admin"])),
    db: Session = Depends(get_db)
):
    cfg = db.execute(select(SystemConfig).where(SystemConfig.config_key == key)).scalar_one_or_none()
    old_val = cfg.config_value if cfg else None

    if not cfg:
        cfg = SystemConfig(
            config_id=uuid.uuid4(),
            config_key=key,
            config_value=req.config_value,
            updated_by=current_user.user_id
        )
        db.add(cfg)
    else:
        cfg.config_value = req.config_value
        cfg.updated_by = current_user.user_id

    db.commit()
    db.refresh(cfg)

    record_audit_event(
        db=db,
        action="SYSTEM_CONFIG_UPDATED",
        entity_type="system_config",
        entity_id=cfg.config_id,
        user_id=current_user.user_id,
        old_value={"value": old_val},
        new_value={"key": key, "value": req.config_value}
    )

    return {
        "message": f"Configuration key '{key}' updated successfully",
        "config_key": cfg.config_key,
        "config_value": cfg.config_value
    }

# 2. Implementing Agencies Management
@router.get("/agencies")
def list_agencies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    agencies = db.execute(select(ImplementingAgency).order_by(ImplementingAgency.agency_name.asc())).scalars().all()
    return [
        {
            "agency_id": str(a.agency_id),
            "agency_name": a.agency_name,
            "agency_type": a.agency_type,
            "registration_number": a.registration_number,
            "bank_account_masked": a.bank_account_masked,
            "verified_by_admin": a.verified_by_admin
        }
        for a in agencies
    ]

@router.post("/agencies", status_code=status.HTTP_201_CREATED)
def create_agency(
    req: CreateAgencyRequest,
    current_user: User = Depends(require_roles(["Admin", "DistrictAuthority"])),
    db: Session = Depends(get_db)
):
    agency_id = uuid.uuid4()
    agency = ImplementingAgency(
        agency_id=agency_id,
        agency_name=req.agency_name,
        agency_type=req.agency_type,
        registration_number=req.registration_number,
        bank_account_masked=req.bank_account_masked or "XXXX-XXXX-0000",
        verified_by_admin=current_user.role.role_name == "Admin"
    )
    db.add(agency)
    db.commit()
    db.refresh(agency)

    record_audit_event(
        db=db,
        action="IMPLEMENTING_AGENCY_REGISTERED",
        entity_type="implementing_agencies",
        entity_id=agency.agency_id,
        user_id=current_user.user_id,
        new_value={"agency_name": agency.agency_name, "agency_type": agency.agency_type}
    )

    return {
        "message": "Implementing agency registered",
        "agency_id": str(agency.agency_id),
        "agency_name": agency.agency_name,
        "verified_by_admin": agency.verified_by_admin
    }

@router.post("/agencies/{agency_id}/verify")
def verify_agency(
    agency_id: str,
    current_user: User = Depends(require_roles(["Admin"])),
    db: Session = Depends(get_db)
):
    try:
        a_uuid = uuid.UUID(agency_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agency ID format")

    agency = db.execute(select(ImplementingAgency).where(ImplementingAgency.agency_id == a_uuid)).scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Implementing agency not found")

    agency.verified_by_admin = True
    db.commit()

    record_audit_event(
        db=db,
        action="IMPLEMENTING_AGENCY_VERIFIED",
        entity_type="implementing_agencies",
        entity_id=agency.agency_id,
        user_id=current_user.user_id,
        new_value={"agency_name": agency.agency_name, "verified": True}
    )

    return {"message": "Agency verified successfully", "agency_id": str(agency.agency_id), "verified_by_admin": True}

# 3. Model Versions
@router.get("/model-versions")
def list_model_versions(
    db: Session = Depends(get_db)
):
    versions = db.execute(select(ModelVersion).order_by(ModelVersion.deployed_at.desc())).scalars().all()
    return [
        {
            "model_id": str(m.model_id),
            "model_name": m.model_name,
            "version": m.version,
            "status": m.status,
            "deployed_at": m.deployed_at.isoformat(),
            "performance_metrics": m.performance_metrics
        }
        for m in versions
    ]

@router.post("/model-versions", status_code=status.HTTP_201_CREATED)
def register_model_version(
    req: CreateModelVersionRequest,
    current_user: User = Depends(require_roles(["Admin"])),
    db: Session = Depends(get_db)
):
    mv_id = uuid.uuid4()
    mv = ModelVersion(
        model_id=mv_id,
        model_name=req.model_name,
        version=req.version,
        deployed_at=datetime.now(timezone.utc),
        status="active",
        performance_metrics=req.performance_metrics or {"auc_roc": 0.94, "precision": 0.91, "recall": 0.88}
    )
    db.add(mv)
    db.commit()
    db.refresh(mv)

    record_audit_event(
        db=db,
        action="MODEL_VERSION_DEPLOYED",
        entity_type="model_versions",
        entity_id=mv.model_id,
        user_id=current_user.user_id,
        new_value={"model_name": mv.model_name, "version": mv.version}
    )

    return {
        "message": "Model version registered",
        "model_id": str(mv.model_id),
        "model_name": mv.model_name,
        "version": mv.version
    }
