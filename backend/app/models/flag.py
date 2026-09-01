from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float, DateTime
from datetime import datetime
from ..db.session import Base
class Flag(Base):
    __tablename__ = "flags"
    id: Mapped[str] = mapped_column(String, primary_key=True); project_id: Mapped[str] = mapped_column(String, index=True); category: Mapped[str] = mapped_column(String); severity: Mapped[str] = mapped_column(String); confidence: Mapped[float] = mapped_column(Float); reason: Mapped[str] = mapped_column(String); origin: Mapped[str] = mapped_column(String); created_at: Mapped[datetime] = mapped_column(DateTime)
