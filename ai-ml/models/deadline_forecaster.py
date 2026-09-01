from pathlib import Path
from datetime import date
import joblib, numpy as np
from sklearn.linear_model import LogisticRegression
ARTIFACT = Path(__file__).resolve().parents[1] / "artifacts" / "deadline_forecaster.joblib"
def vector(project: dict, today=None):
    today = today or date.today(); elapsed = max(0, (today - date.fromisoformat(str(project["sanction_date"]))).days)
    return [elapsed / 365, float(project["physical_progress_percent"]) / 100, float(project["utilized_amount"]) / max(float(project["sanctioned_amount"]), 1), float(project.get("spend_spike_ratio", 0))]
def train(records: list[dict]):
    x = np.array([vector(record) for record in records]); y = np.array([record.get("synthetic_label") in {"deadline_risk", "anomaly"} for record in records]); model = LogisticRegression(random_state=42, max_iter=500).fit(x, y); ARTIFACT.parent.mkdir(exist_ok=True); joblib.dump(model, ARTIFACT); return model
def predict(project: dict) -> dict | None:
    if not ARTIFACT.exists(): return None
    probability = float(joblib.load(ARTIFACT).predict_proba(np.array([vector(project)]))[0][1])
    if probability < .35: return None
    return {"category": "deadline_risk", "severity": "high" if probability >= .70 else "medium", "confidence": round(probability, 2), "origin": "deadline_forecaster", "reason": f"The predictive deadline model estimates a {probability:.0%} probability of missing the mandatory one-year completion deadline."}
