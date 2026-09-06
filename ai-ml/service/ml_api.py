"""HTTP adapter for the real Isolation Forest artifact."""
from pathlib import Path
import sys

import pandas as pd
from fastapi import FastAPI, HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pipeline.feature_engineering import build_features
from pipeline.predict import load_model_bundle, predict

app = FastAPI(title="MPLADS ML Service")
MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "artifacts" / "mplads_isolation_forest.joblib"


@app.get("/health")
def health():
    return {"status": "ok", "model_available": MODEL_PATH.exists()}


@app.post("/predict")
def prediction(project: dict):
    """Return a statistical review signal, never a fraud determination."""
    try:
        features, _ = build_features(pd.DataFrame([project]))
        result = predict(features, load_model_bundle(MODEL_PATH)).iloc[0]
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {
        "model": "mplads_isolation_forest",
        "anomaly_score": float(result["iforest_anomaly_score"]),
        "decision_function": float(result["iforest_decision_function"]),
        "is_anomaly": bool(result["iforest_flag"] == "ANOMALY"),
        "interpretation": "Statistical outlier for human review; not a finding of fraud.",
    }
