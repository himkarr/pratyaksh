from pathlib import Path
import json, sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from models.isolation_forest_model import train as train_isolation
from models.deadline_forecaster import train as train_deadline
path = Path(__file__).resolve().parents[1] / "data" / "raw" / "synthetic_projects.json"
if not path.exists():
    from data.synthetic_data_generator import generate, write
    write(generate())
records = json.loads(path.read_text()); train_isolation(records); train_deadline(records); print(f"Trained models on {len(records)} synthetic records.")
