"""Train the anomaly model reproducibly from the supplied public MPLADS CSV."""
import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import RobustScaler

from feature_engineering import build_features


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("csv")
    parser.add_argument("--output", default=str(Path(__file__).resolve().parents[1] / "models/artifacts/mplads_isolation_forest.joblib"))
    args = parser.parse_args()

    raw = pd.read_csv(args.csv, low_memory=False)
    features, columns = build_features(raw)
    values = features[columns].replace([np.inf, -np.inf], np.nan)
    imputer = SimpleImputer(strategy="median")
    scaler = RobustScaler()
    transformed = scaler.fit_transform(imputer.fit_transform(values))
    model = IsolationForest(n_estimators=200, contamination=0.05, random_state=42, n_jobs=-1)
    model.fit(transformed)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "imputer": imputer, "scaler": scaler, "features": columns, "training_rows": len(raw), "source": "official MPLADS public works dataset"}, output)
    print(f"Trained on {len(raw):,} records; model written to {output}")


if __name__ == "__main__":
    main()
