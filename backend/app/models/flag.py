from pydantic import BaseModel
from datetime import datetime
class Flag(BaseModel):
    id: str; project_id: str; category: str; severity: str; confidence: float; reason: str; origin: str; created_at: datetime
