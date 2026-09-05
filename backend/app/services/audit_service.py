import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from ..models import AuditLog

GENESIS_HASH = "0" * 64

def get_latest_audit_hash(db: Session) -> str:
    """Get the 'this_hash' of the most recent audit log, or GENESIS_HASH if none exists."""
    latest = db.execute(
        select(AuditLog).order_by(AuditLog.timestamp.desc(), AuditLog.log_id.desc()).limit(1)
    ).scalar_one_or_none()
    
    if latest and latest.new_value and isinstance(latest.new_value, dict):
        return latest.new_value.get("this_hash", GENESIS_HASH)
    return GENESIS_HASH

def compute_entry_hash(
    log_id: str,
    user_id: Optional[str],
    action: str,
    entity_type: str,
    entity_id: Optional[str],
    old_value: Optional[dict],
    user_data: Optional[dict],
    timestamp_str: str,
    prev_hash: str
) -> str:
    """Deterministic SHA-256 calculation for a single audit block."""
    block = {
        "log_id": log_id,
        "user_id": user_id or "",
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id or "",
        "old_value": old_value or {},
        "user_data": user_data or {},
        "timestamp": timestamp_str,
        "prev_hash": prev_hash
    }
    block_bytes = json.dumps(block, sort_keys=True).encode("utf-8")
    return hashlib.sha256(block_bytes).hexdigest()

def record_audit_event(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    ip_address: Optional[str] = "127.0.0.1"
) -> AuditLog:
    """
    Appends an immutable, hash-chained audit log entry to the audit_logs table.
    """
    log_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    
    prev_hash = get_latest_audit_hash(db)
    
    this_hash = compute_entry_hash(
        log_id=str(log_id),
        user_id=str(user_id) if user_id else None,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        old_value=old_value,
        user_data=new_value,
        timestamp_str=now_iso,
        prev_hash=prev_hash
    )
    
    chained_new_value = {
        "prev_hash": prev_hash,
        "this_hash": this_hash,
        "data": new_value or {}
    }
    
    entry = AuditLog(
        log_id=log_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=chained_new_value,
        ip_address=ip_address,
        timestamp=now
    )
    
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def verify_audit_chain(db: Session) -> Dict[str, Any]:
    """
    Verifies the cryptographic integrity of the entire audit log chain.
    Returns:
      {
        "verified": True/False,
        "total_records": int,
        "tampered_log_id": Optional[str],
        "message": str
      }
    """
    logs = db.execute(
        select(AuditLog).order_by(AuditLog.timestamp.asc(), AuditLog.log_id.asc())
    ).scalars().all()
    
    if not logs:
        return {
            "verified": True,
            "total_records": 0,
            "message": "Audit trail is empty (Genesis state verified)"
        }
    
    expected_prev_hash = GENESIS_HASH
    
    for log in logs:
        if not log.new_value or not isinstance(log.new_value, dict):
            return {
                "verified": False,
                "total_records": len(logs),
                "tampered_log_id": str(log.log_id),
                "message": f"Log entry {log.log_id} lacks valid cryptographic metadata"
            }
            
        stored_prev = log.new_value.get("prev_hash")
        stored_this = log.new_value.get("this_hash")
        user_data = log.new_value.get("data", {})
        
        # Check chain link
        if stored_prev != expected_prev_hash:
            return {
                "verified": False,
                "total_records": len(logs),
                "tampered_log_id": str(log.log_id),
                "message": f"Chain broken at entry {log.log_id}: prev_hash mismatch. Expected {expected_prev_hash[:12]}..., found {str(stored_prev)[:12]}..."
            }
            
        # Recompute hash
        timestamp_str = log.timestamp.isoformat()
        recomputed_hash = compute_entry_hash(
            log_id=str(log.log_id),
            user_id=str(log.user_id) if log.user_id else None,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=str(log.entity_id) if log.entity_id else None,
            old_value=log.old_value,
            user_data=user_data,
            timestamp_str=timestamp_str,
            prev_hash=stored_prev
        )
        
        if recomputed_hash != stored_this:
            return {
                "verified": False,
                "total_records": len(logs),
                "tampered_log_id": str(log.log_id),
                "message": f"Data tampering detected in log {log.log_id}! Recomputed hash does not match stored block hash."
            }
            
        expected_prev_hash = stored_this
        
    return {
        "verified": True,
        "total_records": len(logs),
        "latest_hash": expected_prev_hash,
        "message": f"All {len(logs)} audit entries verified intact with cryptographic SHA-256 hash chaining."
    }
