from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String
from ..db.session import Base
class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True); email: Mapped[str] = mapped_column(String, unique=True); name: Mapped[str] = mapped_column(String); password_hash: Mapped[str] = mapped_column(String); role: Mapped[str] = mapped_column(String); state: Mapped[str | None] = mapped_column(String, nullable=True); district: Mapped[str | None] = mapped_column(String, nullable=True); constituency_code: Mapped[str | None] = mapped_column(String, nullable=True)
