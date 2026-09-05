import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from ..db.session import get_db
from ..models import AuditLog, User
from ..core.rbac import get_current_user
from ..services.audit_service import verify_audit_chain

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("/logs")
def get_audit_logs(
    limit: int = Query(50, le=200),
    offset: int = 0,
    entity_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve chronological hash-chained audit logs.
    """
    query = select(AuditLog).order_by(AuditLog.timestamp.desc(), AuditLog.log_id.desc())

    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)

    logs = db.execute(query.limit(limit).offset(offset)).scalars().all()

    output = []
    for l in logs:
        user = db.execute(select(User).where(User.user_id == l.user_id)).scalar_one_or_none()
        stored_prev = None
        stored_this = None
        clean_data = None
        if l.new_value and isinstance(l.new_value, dict):
            stored_prev = l.new_value.get("prev_hash")
            stored_this = l.new_value.get("this_hash")
            clean_data = l.new_value.get("data")

        output.append({
            "log_id": str(l.log_id),
            "user_id": str(l.user_id) if l.user_id else None,
            "user_name": user.name if user else "System",
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": str(l.entity_id) if l.entity_id else None,
            "old_value": l.old_value,
            "new_value": clean_data or l.new_value,
            "prev_hash": stored_prev,
            "this_hash": stored_this,
            "ip_address": l.ip_address,
            "timestamp": l.timestamp.isoformat()
        })
    return output

@router.get("/verify")
def verify_integrity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cryptographically verifies the entire SHA-256 hash-chain of the audit trail.
    Returns verified: true if all hashes and block linkages hold, false if any record has been modified.
    """
    result = verify_audit_chain(db)
    return result

@router.post("/tamper-demo")
def simulate_tamper_demo(
    revert: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Judge demonstration endpoint:
    - If revert=False: intentionally modifies the action of the latest audit log entry, breaking the cryptographic hash chain.
    - If revert=True: restores the original action and recomputes the valid hash chain.
    """
    latest = db.execute(
        select(AuditLog).order_by(AuditLog.timestamp.desc(), AuditLog.log_id.desc()).limit(1)
    ).scalar_one_or_none()

    if not latest:
        raise HTTPException(status_code=400, detail="No audit logs available to tamper with.")

    if not revert:
        # Tamper with action
        original_action = latest.action
        latest.action = f"{original_action}_TAMPERED_BY_ATTACKER"
        db.commit()
        return {
            "message": "Audit record maliciously altered for demonstration.",
            "tampered_log_id": str(latest.log_id),
            "original_action": original_action,
            "tampered_action": latest.action,
            "note": "Now invoke GET /audit/verify — it will immediately return verified: false!"
        }
    else:
        # Revert tampering
        if "_TAMPERED_BY_ATTACKER" in latest.action:
            latest.action = latest.action.replace("_TAMPERED_BY_ATTACKER", "")
            db.commit()
            return {
                "message": "Audit record restored to original state.",
                "restored_log_id": str(latest.log_id),
                "action": latest.action,
                "note": "Now invoke GET /audit/verify — it will return verified: true!"
            }
        return {"message": "Audit record is already in clean state."}
