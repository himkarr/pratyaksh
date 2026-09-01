from pathlib import Path
import json
import numpy as np
from sklearn.ensemble import IsolationForest

MODEL_PATH = Path(__file__).with_name("isolation_forest.joblib")
def vector(project): return [float(project["utilized_amount"])/max(float(project["sanctioned_amount"]),1), float(project["physical_progress_percent"]), float(project.get("days_elapsed", 0))]
def train(records: list[dict]):
    model = IsolationForest(contamination=.12, random_state=42).fit(np.array([vector(r) for r in records]))
    import joblib; joblib.dump(model, MODEL_PATH); return model
def score(project: dict) -> dict | None:
    if not MODEL_PATH.exists(): return None
    import joblib; model = joblib.load(MODEL_PATH)
    anomaly = model.predict(np.array([vector(project)]))[0] == -1
    if not anomaly: return None
    return {"category":"progress_anomaly", "severity":"medium", "confidence":round(float(-model.score_samples(np.array([vector(project)]))[0]), 2), "origin":"ml", "reason":"The record differs from the synthetic peer pattern and should be reviewed by an auditor."}
