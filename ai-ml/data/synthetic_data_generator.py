"""Generate deliberately varied, clearly synthetic MPLAD-style demo records."""
from __future__ import annotations
from datetime import date, timedelta
from pathlib import Path
import csv, json, random

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "raw"
STATES = ["Aster", "Beryl", "Cedar", "Dune", "Ember"]
CATEGORIES = ["water", "roads", "health", "education", "public_lighting"]

def make_record(index: int, label: str, today: date) -> dict:
    state = STATES[index % len(STATES)]; district = f"{state}-District-{index % 2 + 1}"; constituency = f"{state[:3].upper()}-{index % 10 + 1:02d}"
    allocated = random.randrange(18, 90) * 100_000
    if label == "normal": elapsed, progress, utilized_ratio, status = random.randint(30, 280), random.randint(25, 95), random.uniform(.15, .94), "in_progress"
    elif label == "deadline_risk": elapsed, progress, utilized_ratio, status = random.randint(205, 350), random.randint(8, 45), random.uniform(.15, .70), "in_progress"
    elif label == "anomaly": elapsed, progress, utilized_ratio, status = random.randint(40, 410), random.choice([0, random.randint(4, 35), 100]), random.choice([random.uniform(1.04, 1.25), 0.0, random.uniform(.75, 1.0)]), "in_progress"
    else: elapsed, progress, utilized_ratio, status = random.randint(160, 300), random.randint(40, 62), random.uniform(.45, .80), "in_progress"
    if label == "anomaly" and progress == 100: status = "completed"
    sanction = today - timedelta(days=elapsed); inactive = random.randint(0, 35) if label == "normal" else random.randint(45, 100)
    return {"id": f"SYN-{index:03d}", "title": f"Synthetic {CATEGORIES[index % len(CATEGORIES)].title()} Initiative {index}", "state": state, "district": district, "constituency_code": constituency, "sanction_date": sanction.isoformat(), "expected_completion_date": (sanction + timedelta(days=365)).isoformat(), "actual_completion_date": None, "sanctioned_amount": allocated, "utilized_amount": round(allocated * utilized_ratio, 2), "physical_progress_percent": progress, "status": status, "category": CATEGORIES[index % len(CATEGORIES)], "vendor_count": random.randint(1, 5) if label != "anomaly" else random.choice([1, 1, 2]), "duplicate_vendor_payments": random.randint(0, 1) if label != "anomaly" else random.randint(3, 6), "last_updated_date": (today - timedelta(days=inactive)).isoformat(), "spend_spike_ratio": round(random.uniform(.05, .28) if label == "normal" else random.uniform(.50, .90), 2), "days_inactive": inactive, "synthetic_label": label}

def generate(count: int = 220, seed: int = 42) -> list[dict]:
    random.seed(seed); labels = ["normal"] * round(count * .70) + ["deadline_risk"] * round(count * .15) + ["anomaly"] * round(count * .10); labels += ["ambiguous"] * (count - len(labels)); random.shuffle(labels)
    return [make_record(i + 1, label, date.today()) for i, label in enumerate(labels)]

def write(records: list[dict]) -> None:
    OUT.mkdir(parents=True, exist_ok=True); (OUT / "synthetic_projects.json").write_text(json.dumps(records, indent=2))
    with (OUT / "synthetic_projects.csv").open("w", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=records[0].keys()); writer.writeheader(); writer.writerows(records)

if __name__ == "__main__":
    records = generate(); write(records); print(f"Wrote {len(records)} synthetic contract-shaped records to {OUT}")
