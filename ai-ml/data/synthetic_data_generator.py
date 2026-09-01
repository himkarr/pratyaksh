"""Create synthetic MPLAD-like records only; never use real people, places, or fund data."""
from pathlib import Path
import json, random

random.seed(42)
states = ["Aster", "Beryl", "Cedar", "Dune"]
records = []
for index in range(80):
    sanctioned = random.randint(15, 80) * 100000
    utilized = int(sanctioned * random.uniform(.05, 1.12))
    progress = round(random.uniform(3, 100), 1)
    records.append({"id": f"SYN-{index+1:03d}", "state": states[index % 4], "sanctioned_amount": sanctioned, "utilized_amount": utilized, "physical_progress_percent": progress, "days_elapsed": random.randint(5, 430), "status": "in_progress"})
path = Path(__file__).parent / "raw" / "synthetic_training_records.json"
path.write_text(json.dumps(records, indent=2))
print(f"Wrote {len(records)} synthetic records to {path}")
