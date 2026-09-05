"""
MPLADS Isolation Forest Prediction
==================================

Purpose:
    Run the trained MPLADS Isolation Forest model on new project data.

The trained model bundle contains:
    - Isolation Forest model
    - Median imputer
    - RobustScaler
    - Exact feature list used during training

Input:
    MPLADS master project CSV

Output:
    CSV containing project IDs, anomaly scores, flags and risk bands.

Usage:
    python predict.py input.csv output.csv

Example:
    python predict.py \
        mplads_master_project_dataset.csv \
        mplads_isolation_forest_predictions.csv
"""

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd


# ---------------------------------------------------------------------
# MODEL
# ---------------------------------------------------------------------

DEFAULT_MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "models"
    / "artifacts"
    / "mplads_isolation_forest.joblib"
)


# ---------------------------------------------------------------------
# IDENTIFICATION COLUMNS
# ---------------------------------------------------------------------

ID_COLUMNS = [
    "work_id",
    "chamber",
    "mp",
    "state",
    "constituency",
    "ida",
    "work_category",
    "work_description",
]


# ---------------------------------------------------------------------
# MODEL LOADING
# ---------------------------------------------------------------------

def load_model_bundle(model_path: Path):
    """
    Load the trained Isolation Forest bundle.
    """

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model bundle not found:\n{model_path}\n\n"
            "Make sure mplads_isolation_forest.joblib exists "
            "inside models/artifacts/."
        )

    artifact = joblib.load(model_path)

    required_keys = [
        "model",
        "imputer",
        "scaler",
        "features",
    ]

    missing = [key for key in required_keys if key not in artifact]

    if missing:
        raise ValueError(
            "The model bundle is missing required components: "
            + ", ".join(missing)
        )

    return artifact


# ---------------------------------------------------------------------
# FEATURE VALIDATION
# ---------------------------------------------------------------------

def validate_features(df: pd.DataFrame, feature_columns):
    """
    Verify that the input contains every feature expected by the
    trained model.
    """

    missing = [
        column
        for column in feature_columns
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            "Input feature data is missing required columns:\n- "
            + "\n- ".join(missing)
            + "\n\n"
            "The Feature Engine must produce the same features "
            "used during model training."
        )


# ---------------------------------------------------------------------
# PREDICTION
# ---------------------------------------------------------------------

def predict(df: pd.DataFrame, artifact):
    """
    Run Isolation Forest prediction.

    IMPORTANT:
        The Feature Engine must already have generated the ML features.

    The preprocessing stored inside the trained artifact is then applied:

        Features
            ↓
        Imputer
            ↓
        RobustScaler
            ↓
        Isolation Forest
    """

    model = artifact["model"]
    imputer = artifact["imputer"]
    scaler = artifact["scaler"]
    feature_columns = artifact["features"]

    validate_features(df, feature_columns)

    # Extract exactly the features used during training.
    X = df[feature_columns].copy()

    # Make sure everything is numeric.
    for column in feature_columns:
        X[column] = pd.to_numeric(
            X[column],
            errors="coerce"
        )

    # Remove infinities.
    X = X.replace(
        [np.inf, -np.inf],
        np.nan
    )

    # IMPORTANT:
    # Do NOT fit the imputer/scaler again.
    #
    # We use the objects stored inside the trained model bundle.
    X_imputed = imputer.transform(X)

    X_scaled = scaler.transform(X_imputed)

    # -------------------------------------------------------------
    # Isolation Forest prediction
    # -------------------------------------------------------------

    prediction = model.predict(X_scaled)

    # sklearn score:
    # higher = more normal
    #
    # We invert it:
    # higher = more anomalous
    anomaly_score = -model.score_samples(X_scaled)

    # sklearn decision function:
    # negative generally corresponds to the anomaly side
    decision = model.decision_function(X_scaled)

    # -------------------------------------------------------------
    # Result
    # -------------------------------------------------------------

    result_columns = [
        column
        for column in ID_COLUMNS
        if column in df.columns
    ]

    result = df[result_columns].copy()

    result["iforest_anomaly_score"] = anomaly_score
    result["iforest_decision_function"] = decision

    result["iforest_flag"] = np.where(
        prediction == -1,
        "ANOMALY",
        "NORMAL",
    )

    return result


# ---------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------

def main():

    parser = argparse.ArgumentParser(
        description="Run MPLADS Isolation Forest prediction."
    )

    parser.add_argument(
        "input_csv",
        help="ML feature CSV generated by the Feature Engine.",
    )

    parser.add_argument(
        "output_csv",
        help="Where to save prediction results.",
    )

    parser.add_argument(
        "--model",
        default=str(DEFAULT_MODEL_PATH),
        help="Path to the trained model bundle.",
    )

    args = parser.parse_args()

    input_path = Path(args.input_csv)
    output_path = Path(args.output_csv)
    model_path = Path(args.model)

    if not input_path.exists():
        raise FileNotFoundError(
            f"Input file not found:\n{input_path}"
        )

    print("Loading ML feature data...")

    df = pd.read_csv(
        input_path,
        low_memory=False
    )

    print(f"Projects: {len(df):,}")

    print("\nLoading trained Isolation Forest...")

    artifact = load_model_bundle(model_path)

    print(
        f"Features expected: "
        f"{len(artifact['features'])}"
    )

    print(
        f"Training rows: "
        f"{artifact.get('training_rows', 'unknown'):,}"
        if isinstance(
            artifact.get("training_rows"),
            int
        )
        else
        f"Training rows: "
        f"{artifact.get('training_rows', 'unknown')}"
    )

    # Run prediction.
    result = predict(
        df,
        artifact
    )

    # -------------------------------------------------------------
    # Add anomaly percentile for this prediction population.
    # -------------------------------------------------------------

    result["iforest_percentile"] = (
        result["iforest_anomaly_score"]
        .rank(
            method="average",
            pct=True
        )
        * 100.0
    ).round(4)

    # Presentation-only risk bands.
    result["iforest_risk_band"] = pd.cut(
        result["iforest_percentile"],
        bins=[
            -np.inf,
            80,
            95,
            99,
            np.inf,
        ],
        labels=[
            "LOW",
            "MEDIUM",
            "HIGH",
            "VERY_HIGH",
        ],
    ).astype(str)

    # Highest anomaly first.
    sort_columns = ["iforest_anomaly_score"]

    if "work_id" in result.columns:
        sort_columns.append("work_id")

    result = result.sort_values(
        sort_columns,
        ascending=[
            False
        ] * len(sort_columns)
    ).reset_index(drop=True)

    # Save.
    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    result.to_csv(
        output_path,
        index=False,
        encoding="utf-8-sig"
    )

    flagged = int(
        (
            result["iforest_flag"]
            == "ANOMALY"
        ).sum()
    )

    print("\nPREDICTION COMPLETE")
    print("-------------------")
    print(
        f"Projects processed: {len(result):,}"
    )
    print(
        f"Anomalies flagged: {flagged:,}"
    )
    print(
        f"Normal projects: "
        f"{len(result) - flagged:,}"
    )
    print(
        f"Output: {output_path}"
    )

    print(
        "\nReminder: Isolation Forest detects "
        "statistical unusualness. It does not "
        "establish fraud or non-compliance."
    )


if __name__ == "__main__":
    main()