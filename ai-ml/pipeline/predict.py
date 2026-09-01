from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from rule_engine.rules import evaluate
from models.isolation_forest_model import score
from models.deadline_forecaster import forecast

def predict(project: dict) -> dict:
    flags = evaluate(project)
    future = forecast(project)
    if future: flags.append(future)
    model_flag = score(project)
    if model_flag: flags.append(model_flag)
    return {"project_id": project.get("id"), "flags": flags, "human_review_required": bool(flags), "disclaimer": "These are explainable probabilistic review signals, not accusations."}
