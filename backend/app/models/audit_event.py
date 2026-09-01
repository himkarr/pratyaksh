from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, DateTime
from datetime import datetime
from ..db.session import Base
class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[str] = mapped_column(String, primary_key=True); actor_id: Mapped[str] = mapped_column(String); action: Mapped[str] = mapped_column(String); entity_type: Mapped[str] = mapped_column(String); entity_id: Mapped[str] = mapped_column(String); created_at: Mapped[datetime] = mapped_column(DateTime); prev_hash: Mapped[str] = mapped_column(String); this_hash: Mapped[str] = mapped_column(String)
