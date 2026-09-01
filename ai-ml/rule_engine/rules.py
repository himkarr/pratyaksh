"""Named explainable rules. Every output includes a reason and origin tag."""
from datetime import date
from pathlib import Path
import yaml

CONFIG = yaml.safe_load((Path(__file__).with_name("rules_config.yaml")).read_text())
COMPLETION_DEADLINE_DAYS = CONFIG["completion_deadline_days"]

def evaluate(project: dict, today: date | None = None) -> list[dict]:
    today = today or date.today(); flags = []
    sanctioned, utilized = float(project["sanctioned_amount"]), float(project["utilized_amount"])
    progress = float(project["physical_progress_percent"])
    sanction_date = date.fromisoformat(str(project["sanction_date"])) if project.get("sanction_date") else None
    elapsed = (today - sanction_date).days if sanction_date else int(project.get("days_elapsed", 0))
    if utilized > sanctioned * (1 + CONFIG["utilization_overrun_tolerance"]):
        flags.append({"category":"cost_anomaly", "severity":"high", "confidence":.94, "origin":"rule", "reason":"Reported utilization exceeds the sanctioned amount beyond the configured tolerance."})
    if elapsed > COMPLETION_DEADLINE_DAYS and progress < 100:
        flags.append({"category":"deadline_risk", "severity":"critical", "confidence":.98, "origin":"rule", "reason":"The project has exceeded the mandatory one-year completion deadline from sanction."})
    if utilized / max(sanctioned, 1) >= CONFIG["high_utilization_low_progress_ratio"] and progress < CONFIG["low_progress_threshold"]:
        flags.append({"category":"progress_anomaly", "severity":"high", "confidence":.87, "origin":"rule", "reason":"High fund utilization with low physical progress warrants human review."})
    return flags
