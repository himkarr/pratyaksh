"""Append-only hash-chain audit log; persist these records in the production DB."""
from datetime import datetime, timezone
import hashlib, json

events: list[dict] = []
def append(actor_id: str, action: str, entity_type: str, entity_id: str) -> dict:
    previous_hash = events[-1]["event_hash"] if events else "GENESIS"
    event = {"id": f"AUD-{len(events)+1:04d}", "actor_id": actor_id, "action": action, "entity_type": entity_type, "entity_id": entity_id, "created_at": datetime.now(timezone.utc).isoformat(), "previous_hash": previous_hash}
    event["event_hash"] = hashlib.sha256(json.dumps(event, sort_keys=True).encode()).hexdigest()
    events.append(event)
    return event
