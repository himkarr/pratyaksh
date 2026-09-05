"""
MPLADS Deadline Forecaster
==========================

Purpose:
    Predict expected project completion duration and identify projects
    that may be delayed.

Training:
    Uses historically completed MPLADS projects where completion_date
    is available.

Inference:
    Uses the trained model to estimate completion duration for projects
    that may not yet be completed.

IMPORTANT
---------
This is a forecasting signal, not proof of delay or non-compliance.

The model predicts an estimated completion duration in days.

Training example:
    python models/deadline_forecaster.py train \
        data/processed/mplads_master_project_dataset.csv

Prediction example:
    python models/deadline_forecaster.py predict \
        data/processed/mplads_master_project_dataset.csv \
        data/processed/mplads_deadline_predictions.csv
"""

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

RANDOM_STATE = 42
N_ESTIMATORS = 300

MODEL_DIR = Path("models/artifacts")
MODEL_PATH = MODEL_DIR / "mplads_deadline_forecaster.joblib"

# A project taking longer than this relative to the predicted duration
# will receive an elevated delay signal.
DELAY_RATIO_MEDIUM = 1.25
DELAY_RATIO_HIGH = 1.50


# ---------------------------------------------------------------------
# Features
# ---------------------------------------------------------------------

NUMERIC_FEATURES = [
    "sanction_amount",
    "recommended_amount",
    "expenditure_records",
    "vendor_count",
    "expenditure_total",
    "expenditure_utilization_ratio",
]

CATEGORICAL_FEATURES = [
    "chamber",
    "state",
    "work_category",
]

FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


# ---------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------

REQUIRED_COLUMNS = [
    "work_id",
    "sanction_date",
    "completion_date",
    "sanction_to_completion_days",
] + FEATURES


def validate_columns(df: pd.DataFrame):
    missing = [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            "Dataset is missing required columns:\n- "
            + "\n- ".join(missing)
        )


# ---------------------------------------------------------------------
# Feature preparation
# ---------------------------------------------------------------------

def prepare_dataframe(df: pd.DataFrame) -> pd.DataFrame:

    data = df.copy()

    # Numeric conversion
    for column in NUMERIC_FEATURES:
        data[column] = pd.to_numeric(
            data[column],
            errors="coerce",
        )

    # Date conversion
    data["sanction_date"] = pd.to_datetime(
        data["sanction_date"],
        errors="coerce",
    )

    data["completion_date"] = pd.to_datetime(
        data["completion_date"],
        errors="coerce",
    )

    # Extract sanction-year/month information.
    # These can capture broad administrative/time effects.
    data["sanction_year"] = data["sanction_date"].dt.year
    data["sanction_month"] = data["sanction_date"].dt.month

    return data


# ---------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------

def train(input_csv: Path):

    print("\nMPLADS DEADLINE FORECASTER")
    print("==========================")
    print("\nLoading historical MPLADS data...")

    df = pd.read_csv(
        input_csv,
        low_memory=False,
    )

    print(f"Projects loaded: {len(df):,}")

    validate_columns(df)

    df = prepare_dataframe(df)

    # -------------------------------------------------------------
    # Only completed projects can provide historical completion
    # duration for supervised training.
    # -------------------------------------------------------------

    training_df = df[
        df["sanction_to_completion_days"].notna()
        & (df["sanction_to_completion_days"] >= 0)
    ].copy()

    print(
        f"Projects with usable completion duration: "
        f"{len(training_df):,}"
    )

    if len(training_df) < 100:
        raise ValueError(
            "Not enough completed projects to train the "
            "deadline forecaster."
        )

    X = training_df[FEATURES].copy()

    # Target = actual number of days from sanction to completion.
    y = pd.to_numeric(
        training_df["sanction_to_completion_days"],
        errors="coerce",
    )

    valid_target = y.notna() & (y >= 0)

    X = X.loc[valid_target]
    y = y.loc[valid_target]

    # -------------------------------------------------------------
    # Preprocessing
    # -------------------------------------------------------------

    numeric_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median"),
            ),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="most_frequent"),
            ),
            (
                "onehot",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
            ),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                numeric_pipeline,
                NUMERIC_FEATURES,
            ),
            (
                "categorical",
                categorical_pipeline,
                CATEGORICAL_FEATURES,
            ),
        ]
    )

    # -------------------------------------------------------------
    # Model
    # -------------------------------------------------------------

    model = RandomForestRegressor(
        n_estimators=N_ESTIMATORS,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        min_samples_leaf=5,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )

    print("\nTraining deadline forecaster...")
    print(f"Features: {len(FEATURES)}")
    print(f"Trees: {N_ESTIMATORS}")

    pipeline.fit(X, y)

    # -------------------------------------------------------------
    # Training evaluation
    # -------------------------------------------------------------

    predictions = pipeline.predict(X)

    mae = mean_absolute_error(y, predictions)
    rmse = np.sqrt(mean_squared_error(y, predictions))

    print("\nTraining evaluation")
    print("--------------------")
    print(f"MAE : {mae:.2f} days")
    print(f"RMSE: {rmse:.2f} days")

    # -------------------------------------------------------------
    # Save model artifact
    # -------------------------------------------------------------

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    artifact = {
        "model": pipeline,
        "features": FEATURES,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target": "sanction_to_completion_days",
        "training_rows": len(X),
        "mae_training_days": float(mae),
        "rmse_training_days": float(rmse),
        "random_state": RANDOM_STATE,
        "model_type": "RandomForestRegressor",
    }

    joblib.dump(
        artifact,
        MODEL_PATH,
    )

    print("\nMODEL SAVED")
    print("-----------")
    print(f"Model: {MODEL_PATH}")

    return artifact


# ---------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------

def predict(input_csv: Path, output_csv: Path):

    print("\nMPLADS DEADLINE FORECASTER")
    print("==========================")

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Trained deadline model not found:\n{MODEL_PATH}\n\n"
            "Train it first."
        )

    print("\nLoading trained deadline model...")

    artifact = joblib.load(
        MODEL_PATH
    )

    model = artifact["model"]

    df = pd.read_csv(
        input_csv,
        low_memory=False,
    )

    validate_columns(df)

    df = prepare_dataframe(df)

    X = df[FEATURES].copy()

    print(f"Projects: {len(df):,}")

    # -------------------------------------------------------------
    # Predict duration
    # -------------------------------------------------------------

    predicted_days = model.predict(X)

    predicted_days = np.maximum(
        predicted_days,
        0,
    )

    out = df[
        [
            c
            for c in [
                "work_id",
                "chamber",
                "mp",
                "state",
                "constituency",
                "ida",
                "work_category",
                "work_description",
                "sanction_date",
                "completion_date",
                "work_status",
            ]
            if c in df.columns
        ]
    ].copy()

    out["predicted_completion_days"] = np.round(
        predicted_days,
        2,
    )

    # -------------------------------------------------------------
    # Predicted completion date
    # -------------------------------------------------------------

    out["predicted_completion_date"] = (
        pd.to_datetime(out["sanction_date"], errors="coerce")
        + pd.to_timedelta(
            out["predicted_completion_days"],
            unit="D",
        )
    )

    # -------------------------------------------------------------
    # Compare actual progress where possible
    # -------------------------------------------------------------

    today = pd.Timestamp.now().normalize()

    out["elapsed_days"] = np.nan

    sanction_dates = pd.to_datetime(
        out["sanction_date"],
        errors="coerce",
    )

    completion_dates = pd.to_datetime(
        out["completion_date"],
        errors="coerce",
    )

    # Completed project:
    completed_mask = completion_dates.notna()

    out.loc[completed_mask, "elapsed_days"] = (
        completion_dates[completed_mask]
        - sanction_dates[completed_mask]
    ).dt.days

    # Still ongoing:
    ongoing_mask = (
        sanction_dates.notna()
        & completion_dates.isna()
    )

    out.loc[ongoing_mask, "elapsed_days"] = (
        today
        - sanction_dates[ongoing_mask]
    ).dt.days

    # -------------------------------------------------------------
    # Delay ratio
    # -------------------------------------------------------------

    out["delay_ratio"] = np.where(
        out["predicted_completion_days"] > 0,
        out["elapsed_days"]
        / out["predicted_completion_days"],
        np.nan,
    )

    # -------------------------------------------------------------
    # Delay risk
    # -------------------------------------------------------------

    out["deadline_risk"] = "LOW"

    medium_mask = (
        out["delay_ratio"] >= DELAY_RATIO_MEDIUM
    )

    high_mask = (
        out["delay_ratio"] >= DELAY_RATIO_HIGH
    )

    out.loc[medium_mask, "deadline_risk"] = "MEDIUM"
    out.loc[high_mask, "deadline_risk"] = "HIGH"

    # -------------------------------------------------------------
    # Forecast status
    # -------------------------------------------------------------

    out["deadline_status"] = "ON_TRACK"

    out.loc[
        out["deadline_risk"] == "MEDIUM",
        "deadline_status",
    ] = "POSSIBLE_DELAY"

    out.loc[
        out["deadline_risk"] == "HIGH",
        "deadline_status",
    ] = "LIKELY_DELAY"

    # Projects with missing sanction dates cannot be forecast reliably.
    missing_sanction = sanction_dates.isna()

    out.loc[
        missing_sanction,
        "deadline_status",
    ] = "INSUFFICIENT_DATA"

    out.loc[
        missing_sanction,
        "deadline_risk",
    ] = "UNKNOWN"

    # -------------------------------------------------------------
    # Output
    # -------------------------------------------------------------

    output_csv.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    out.to_csv(
        output_csv,
        index=False,
        encoding="utf-8-sig",
    )

    print("\nPREDICTION COMPLETE")
    print("-------------------")
    print(f"Projects processed: {len(out):,}")

    print("\nDeadline risk:")
    print(
        out["deadline_risk"]
        .value_counts(dropna=False)
    )

    print(f"\nOutput: {output_csv}")


# ---------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------

def main():

    parser = argparse.ArgumentParser(
        description="MPLADS Deadline Forecaster"
    )

    subparsers = parser.add_subparsers(
        dest="command",
        required=True,
    )

    # -------------------------------------------------------------
    # Train
    # -------------------------------------------------------------

    train_parser = subparsers.add_parser(
        "train",
        help="Train deadline forecasting model.",
    )

    train_parser.add_argument(
        "input_csv",
        help="MPLADS master project dataset.",
    )

    # -------------------------------------------------------------
    # Predict
    # -------------------------------------------------------------

    predict_parser = subparsers.add_parser(
        "predict",
        help="Generate deadline predictions.",
    )

    predict_parser.add_argument(
        "input_csv",
        help="MPLADS master project dataset.",
    )

    predict_parser.add_argument(
        "output_csv",
        help="Output deadline predictions CSV.",
    )

    args = parser.parse_args()

    if args.command == "train":

        train(
            Path(args.input_csv)
        )

    elif args.command == "predict":

        predict(
            Path(args.input_csv),
            Path(args.output_csv),
        )


if __name__ == "__main__":
    main()