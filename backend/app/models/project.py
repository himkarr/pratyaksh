from pydantic import BaseModel
from datetime import date
class Project(BaseModel):
    id: str; title: str; state: str; district: str; constituency_code: str; sanction_date: date; expected_completion_date: date
    actual_completion_date: date | None = None; sanctioned_amount: float; utilized_amount: float; physical_progress_percent: float; status: str
