"""
MPLADS Isolation Forest Prediction
==================================

Runs the already-trained Isolation Forest model on an ML feature CSV.

Input:
    mplads_ml_features.csv

Model:
    models/artifacts/mplads_isolation_forest.joblib

Output:
    mplads_isolation_forest_predictions.csv

Usage:
    python3 pipeline/predict.py \
        mplads_ml_features.csv \
        mplads_isolation_forest_predictions.csv
"""

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd


# -------------------------------------------------------------------
# Paths
# -------------------------------------------------------------------

DEFAULT_MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "models"
    / "artifacts"
    / "mplads_isolation_forest.joblib"
)


# -------------------------------------------------------------------
# Load trained model bundle
# -------------------------------------------------------------------

def load_model_bundle(model_path):
    model_path = Path(model_path)

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found:\n{model_path}"
        )

    artifact = joblib.load(model_path)

    required = [
        "model",
        "imputer",
        "scaler",
        "features",
    ]

    missing = [
        key for key in required
        if key not in artifact
    ]

    if missing:
        raise ValueError(
            "Model bundle is missing:\n"
            + "\n".join(missing)
        )

    return artifact


# -------------------------------------------------------------------
# Prediction
# -------------------------------------------------------------------

def run_prediction(feature_csv, output_csv, model_path):

    print("Loading ML features...")

    df = pd.read_csv(
        feature_csv,
        low_memory=False
    )

    print(f"Projects: {len(df):,}")

    print("Loading trained Isolation Forest...")

    artifact = load_model_bundle(model_path)

    model = artifact["model"]
    imputer = artifact["imputer"]
    scaler = artifact["scaler"]
    features = artifact["features"]

    print(f"Features expected: {len(features)}")

    # ---------------------------------------------------------------
    # Validate features
    # ---------------------------------------------------------------

    missing = [
        feature
        for feature in features
        if feature not in df.columns
    ]

    if missing:
        raise ValueError(
            "Missing ML features:\n"
            + "\n".join(missing)
        )

    # ---------------------------------------------------------------
    # Prepare exactly the same features used during training
    # ---------------------------------------------------------------

    X = df[features].copy()

    for column in features:
        X[column] = pd.to_numeric(
            X[column],
            errors="coerce"
        )

    X = X.replace(
        [np.inf, -np.inf],
        np.nan
    )

    # IMPORTANT:
    # Use the already-fitted preprocessing objects.
    # DO NOT fit them again.

    X_imputed = imputer.transform(X)

    X_scaled = scaler.transform(X_imputed)

    # ---------------------------------------------------------------
    # Isolation Forest
    # ---------------------------------------------------------------

    predictions = model.predict(X_scaled)

    # sklearn:
    # higher score = more normal
    #
    # We invert it:
    # higher score = more anomalous

    anomaly_scores = -model.score_samples(X_scaled)

    decision_scores = model.decision_function(X_scaled)

    # ---------------------------------------------------------------
    # Create result
    # ---------------------------------------------------------------

    result = pd.DataFrame()

    # Preserve project identity.
    identity_columns = [
        "work_id",
        "chamber",
        "mp",
        "state",
        "constituency",
        "ida",
        "work_category",
        "work_description",
    ]

    for column in identity_columns:
        if column in df.columns:
            result[column] = df[column]

    result["iforest_anomaly_score"] = anomaly_scores

    result["iforest_decision_function"] = decision_scores

    result["iforest_flag"] = np.where(
        predictions == -1,
        "ANOMALY",
        "NORMAL"
    )

    # Rank: 1 = most anomalous
    result["iforest_rank"] = (
        pd.Series(anomaly_scores)
        .rank(
            method="first",
            ascending=False
        )
        .astype(int)
    )

    # ---------------------------------------------------------------
    # Percentile
    # ---------------------------------------------------------------

    result["iforest_percentile"] = (
        pd.Series(anomaly_scores)
        .rank(
            method="average",
            pct=True
        )
        * 100
    ).round(4)

    # Presentation-only band.
    result["iforest_risk_band"] = np.select(
        [
            result["iforest_percentile"] >= 99,
            result["iforest_percentile"] >= 95,
            result["iforest_percentile"] >= 80,
        ],
        [
            "VERY_HIGH",
            "HIGH",
            "MEDIUM",
        ],
        default="LOW"
    )

    # Most anomalous first.
    result = result.sort_values(
        "iforest_anomaly_score",
        ascending=False
    ).reset_index(drop=True)

    # ---------------------------------------------------------------
    # Save
    # ---------------------------------------------------------------

    output_csv = Path(output_csv)

    output_csv.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    result.to_csv(
        output_csv,
        index=False,
        encoding="utf-8-sig"
    )

    # ---------------------------------------------------------------
    # Summary
    # ---------------------------------------------------------------

    anomalies = int(
        (
            result["iforest_flag"]
            == "ANOMALY"
        ).sum()
    )

    normal = len(result) - anomalies

    print()
    print("ISOLATION FOREST PREDICTION COMPLETE")
    print("-------------------------------------")
    print(f"Projects processed : {len(result):,}")
    print(f"Anomalies          : {anomalies:,}")
    print(f"Normal             : {normal:,}")
    print(f"Output             : {output_csv}")
    print()
    print(
        "Reminder: Isolation Forest detects "
        "statistical unusualness. It does not "
        "establish fraud or non-compliance."
    )


# -------------------------------------------------------------------
# CLI
# -------------------------------------------------------------------

def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "feature_csv",
        help="ML feature CSV generated by Feature Engine"
    )

    parser.add_argument(
        "output_csv",
        help="Output prediction CSV"
    )

    parser.add_argument(
        "--model",
        default=str(DEFAULT_MODEL_PATH),
        help="Path to trained Isolation Forest bundle"
    )

    args = parser.parse_args()

    run_prediction(
        feature_csv=args.feature_csv,
        output_csv=args.output_csv,
        model_path=args.model
    )


if __name__ == "__main__":
    main()