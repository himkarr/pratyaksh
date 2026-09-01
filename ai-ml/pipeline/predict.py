from pathlib import Path
from datetime import datetime, timezone
import sys, uuid
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from rule_engine.rules import evaluate
from models.isolation_forest_model import predict as isolation_predict
from models.deadline_forecaster import predict as deadline_predict
def predict(project: dict) -> list[dict]:
    raw = evaluate(project) + [result for result in (isolation_predict(project), deadline_predict(project)) if result]
    return [{"id": f"ML-{uuid.uuid4().hex[:10]}", "project_id": project["id"], "category": item["category"], "severity": item["severity"], "confidence": item["confidence"], "reason": item["reason"], "origin": item["origin"], "created_at": datetime.now(timezone.utc).isoformat()} for item in raw]
