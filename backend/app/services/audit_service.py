"""Append-only, tamper-evident audit chain."""
from datetime import datetime, timezone
import hashlib, json, uuid
from sqlalchemy import select
from ..models.audit_event import AuditEvent
def append(db, actor_id, action, entity_type, entity_id):
    last = db.scalar(select(AuditEvent).order_by(AuditEvent.created_at.desc())); prev = last.this_hash if last else "GENESIS"; created = datetime.now(timezone.utc).replace(tzinfo=None)
    payload = {"actor_id":actor_id,"action":action,"entity_type":entity_type,"entity_id":entity_id,"created_at":created.isoformat()}; current = hashlib.sha256((json.dumps(payload, sort_keys=True)+prev).encode()).hexdigest()
    event = AuditEvent(id=f"AUD-{uuid.uuid4().hex[:12]}", prev_hash=prev, this_hash=current, **payload); db.add(event); db.commit(); return event
def verify_chain(db):
    previous = "GENESIS"
    for event in db.scalars(select(AuditEvent).order_by(AuditEvent.created_at)).all():
        payload = {"actor_id":event.actor_id,"action":event.action,"entity_type":event.entity_type,"entity_id":event.entity_id,"created_at":event.created_at.isoformat()}; expected = hashlib.sha256((json.dumps(payload, sort_keys=True)+previous).encode()).hexdigest()
        if event.prev_hash != previous or event.this_hash != expected: return {"valid":False,"broken_event_id":event.id}
        previous = event.this_hash
    return {"valid":True,"event_count":db.scalar(select(AuditEvent).count()) if False else len(db.scalars(select(AuditEvent)).all())}
