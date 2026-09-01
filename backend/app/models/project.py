from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float, Date
from ..db.session import Base
class Project(Base):
    __tablename__ = "projects"
    id: Mapped[str] = mapped_column(String, primary_key=True); title: Mapped[str] = mapped_column(String); state: Mapped[str] = mapped_column(String); district: Mapped[str] = mapped_column(String); constituency_code: Mapped[str] = mapped_column(String); sanction_date: Mapped[Date] = mapped_column(Date); expected_completion_date: Mapped[Date] = mapped_column(Date); actual_completion_date: Mapped[Date | None] = mapped_column(Date, nullable=True); sanctioned_amount: Mapped[float] = mapped_column(Float); utilized_amount: Mapped[float] = mapped_column(Float); physical_progress_percent: Mapped[float] = mapped_column(Float); status: Mapped[str] = mapped_column(String)
