from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi import FastAPI
from pipeline.predict import predict
app = FastAPI(title="MPLAD Aqua ML Service")
@app.get("/health")
def health(): return {"status": "ok"}
@app.post("/predict")
def prediction(project: dict): return predict(project)
