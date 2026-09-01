"""Transparent predictive deadline risk, separate from retrospective breach detection."""
from datetime import date
from rule_engine.rules import COMPLETION_DEADLINE_DAYS

def forecast(project: dict, today: date | None = None) -> dict | None:
    today = today or date.today()
    if not project.get("sanction_date"): return None
    elapsed = (today - date.fromisoformat(project["sanction_date"])).days
    progress = float(project["physical_progress_percent"])
    if 180 <= elapsed < COMPLETION_DEADLINE_DAYS and progress < 50:
        return {"category":"deadline_risk", "severity":"high", "confidence":.78, "origin":"hybrid", "reason":"At the current physical-progress pace, this project may miss the mandatory one-year completion deadline."}
    return None
