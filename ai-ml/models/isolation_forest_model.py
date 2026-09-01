from pathlib import Path
from datetime import date
import joblib, numpy as np
from sklearn.ensemble import IsolationForest
ARTIFACT = Path(__file__).resolve().parents[1] / "artifacts" / "isolation_forest.joblib"
def vector(project: dict, today=None) -> list[float]:
    today = today or date.today(); elapsed = (today - date.fromisoformat(str(project["sanction_date"]))).days
    return [float(project["utilized_amount"]) / max(float(project["sanctioned_amount"]), 1), float(project["physical_progress_percent"]), elapsed / 365, float(project.get("spend_spike_ratio", 0)), 1 / max(int(project.get("vendor_count", 1)), 1)]
def train(records: list[dict]):
    model = IsolationForest(contamination=.12, random_state=42, n_estimators=150).fit(np.array([vector(record) for record in records])); ARTIFACT.parent.mkdir(exist_ok=True); joblib.dump(model, ARTIFACT); return model
def predict(project: dict) -> dict | None:
    if not ARTIFACT.exists(): return None
    model = joblib.load(ARTIFACT); values = np.array([vector(project)]); score = float(-model.score_samples(values)[0])
    if model.predict(values)[0] != -1: return None
    return {"category": "progress_anomaly", "severity": "medium", "confidence": min(.95, round(score, 2)), "origin": "isolation_forest", "reason": "The combined utilization, delivery pace, spend velocity, and vendor pattern is unusual compared with synthetic peer projects."}
