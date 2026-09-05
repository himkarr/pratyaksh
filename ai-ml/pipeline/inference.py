"""
MPLADS AI Inference Pipeline
=============================

Current pipeline:

    Master Dataset
          ↓
    Feature Engineering
          ↓
    ML Feature Data
          ↓
    Isolation Forest
          ↓
    ML Predictions

This file is the orchestration layer.

It does NOT:
    - train the model
    - contain Isolation Forest logic
    - contain Rule Engine logic
    - calculate the final risk level

Those responsibilities belong to their respective modules.

Usage:
    python3 pipeline/inference.py \
        data/raw/mplads_master_project_dataset.csv \
        data/processed/mplads_ml_features.csv \
        data/processed/mplads_isolation_forest_predictions.csv
"""

import argparse
import subprocess
import sys
from pathlib import Path


# ------------------------------------------------------------
# Project paths
# ------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]

FEATURE_ENGINE = (
    PROJECT_ROOT
    / "pipeline"
    / "feature_engineering.py"
)

PREDICT_SCRIPT = (
    PROJECT_ROOT
    / "pipeline"
    / "predict.py"
)


# ------------------------------------------------------------
# Run a Python script
# ------------------------------------------------------------

def run_command(command):
    """
    Run another Python module/script and stop immediately
    if it fails.
    """

    print()
    print("=" * 60)
    print("RUNNING")
    print("=" * 60)

    print(" ".join(str(x) for x in command))
    print()

    result = subprocess.run(command)

    if result.returncode != 0:
        raise RuntimeError(
            f"Pipeline step failed with exit code "
            f"{result.returncode}"
        )


# ------------------------------------------------------------
# Main inference pipeline
# ------------------------------------------------------------

def main():

    parser = argparse.ArgumentParser(
        description="Run the MPLADS AI inference pipeline."
    )

    parser.add_argument(
        "master_csv",
        help="Path to the MPLADS master project dataset."
    )

    parser.add_argument(
        "features_csv",
        help="Where the generated ML feature CSV should be saved."
    )

    parser.add_argument(
        "predictions_csv",
        help="Where Isolation Forest predictions should be saved."
    )

    args = parser.parse_args()

    master_csv = Path(args.master_csv)
    features_csv = Path(args.features_csv)
    predictions_csv = Path(args.predictions_csv)

    # --------------------------------------------------------
    # Validate master dataset
    # --------------------------------------------------------

    if not master_csv.exists():
        raise FileNotFoundError(
            f"Master dataset not found:\n{master_csv}"
        )

    if not FEATURE_ENGINE.exists():
        raise FileNotFoundError(
            f"Feature Engine not found:\n{FEATURE_ENGINE}"
        )

    if not PREDICT_SCRIPT.exists():
        raise FileNotFoundError(
            f"Prediction script not found:\n{PREDICT_SCRIPT}"
        )

    # --------------------------------------------------------
    # Create output directories
    # --------------------------------------------------------

    features_csv.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    predictions_csv.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    # --------------------------------------------------------
    # STEP 1
    #
    # Master Dataset
    #       ↓
    # Feature Engine
    #       ↓
    # ML Features
    # --------------------------------------------------------

    print()
    print("MPLADS AI INFERENCE PIPELINE")
    print("============================")

    print()
    print("STEP 1: Feature Engineering")

    run_command([
        sys.executable,
        str(FEATURE_ENGINE),
        str(master_csv),
        str(features_csv),
    ])

    if not features_csv.exists():
        raise RuntimeError(
            "Feature Engine completed but the ML feature "
            "file was not created."
        )

    # --------------------------------------------------------
    # STEP 2
    #
    # ML Features
    #       ↓
    # Isolation Forest
    #       ↓
    # Predictions
    # --------------------------------------------------------

    print()
    print("STEP 2: Isolation Forest Prediction")

    run_command([
        sys.executable,
        str(PREDICT_SCRIPT),
        str(features_csv),
        str(predictions_csv),
    ])

    if not predictions_csv.exists():
        raise RuntimeError(
            "Prediction step completed but the prediction "
            "file was not created."
        )

    # --------------------------------------------------------
    # COMPLETE
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("MPLADS AI INFERENCE COMPLETE")
    print("=" * 60)

    print(f"Master dataset : {master_csv}")
    print(f"ML features    : {features_csv}")
    print(f"Predictions    : {predictions_csv}")

    print()
    print("Current flow:")
    print("Master Dataset")
    print("      ↓")
    print("Feature Engine")
    print("      ↓")
    print("ML Features")
    print("      ↓")
    print("Isolation Forest")
    print("      ↓")
    print("ML Predictions")


if __name__ == "__main__":
    main()