from pathlib import Path
import json, sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from models.isolation_forest_model import train

records = json.loads((Path(__file__).resolve().parents[1] / "data/raw/synthetic_training_records.json").read_text())
train(records)
print("Trained Isolation Forest on synthetic records.")
