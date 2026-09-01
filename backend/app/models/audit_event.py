from pydantic import BaseModel
from datetime import datetime
class AuditEvent(BaseModel):
    id: str; actor_id: str; action: str; entity_type: str; entity_id: str; created_at: datetime; previous_hash: str; event_hash: str
