"""
MPLADS Risk Engine
==================

Combines:
    1. Isolation Forest anomaly score
    2. Deterministic Rule Engine results
    3. Deadline Forecaster risk

Output:
    data/processed/mplads_risk_results.csv

IMPORTANT:
    Risk level represents verification priority.
    It is NOT proof of fraud or non-compliance.
"""

import argparse
from pathlib import Path

import numpy as np
import pandas as pd


# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

ML_WEIGHT = 0.50
RULE_WEIGHT = 0.30
DEADLINE_WEIGHT = 0.20

MAX_RULE_SCORE = 100

PRIORITY_ORDER = {
    "HIGH": 1,
    "MEDIUM": 2,
    "LOW": 3,
}


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------

def normalize_ml_score(series):
    """
    Isolation Forest percentile is already on a 0-100 scale.
    """
    return (
        pd.to_numeric(series, errors="coerce")
        .fillna(0)
        .clip(0, 100)
    )


def deadline_score(series):
    """
    Convert deadline risk into a numeric risk score.

    HIGH   = 100
    MEDIUM = 60
    LOW    = 0
    """
    mapping = {
        "HIGH": 100,
        "MEDIUM": 60,
        "LOW": 0,
    }

    return (
        series.astype(str)
        .str.upper()
        .map(mapping)
        .fillna(0)
    )


def verification_priority(risk_level):
    if risk_level == "HIGH":
        return "PRIORITY_1"

    if risk_level == "MEDIUM":
        return "PRIORITY_2"

    return "PRIORITY_3"


def calculate_risk_level(row):
    """
    Determine final verification risk level.

    HIGH:
        Strong combined risk OR very strong ML/rule signal.

    MEDIUM:
        Moderate combined risk.

    LOW:
        Otherwise.

    These are verification priorities, not fraud labels.
    """

    score = row["combined_risk_score"]

    if score >= 60:
        return "HIGH"

    if score >= 30:
        return "MEDIUM"

    return "LOW"


def build_risk_reason(row):
    """
    Generate a human-readable explanation for the final risk level.
    """

    reasons = []

    # Isolation Forest
    if row["ml_risk_score"] >= 99:
        reasons.append(
            "Extremely unusual ML pattern"
        )
    elif row["ml_risk_score"] >= 95:
        reasons.append(
            "Highly unusual ML pattern"
        )
    elif row["ml_risk_score"] >= 80:
        reasons.append(
            "Moderately unusual ML pattern"
        )

    # Rule Engine
    fail_count = int(row["rule_fail_count"])
    review_count = int(row["rule_review_count"])

    if fail_count > 0:
        reasons.append(
            f"{fail_count} rule failure(s)"
        )

    if review_count > 0:
        reasons.append(
            f"{review_count} rule(s) require review"
        )

    # Deadline Forecaster
    deadline_risk = row["deadline_risk"]

    if deadline_risk == "HIGH":
        reasons.append(
            "High predicted deadline risk"
        )
    elif deadline_risk == "MEDIUM":
        reasons.append(
            "Moderate predicted deadline risk"
        )

    if not reasons:
        reasons.append(
            "No major statistical, rule, or deadline risk signal"
        )

    return "; ".join(reasons)


# ---------------------------------------------------------------------
# Main Risk Engine
# ---------------------------------------------------------------------

def main(
    ml_file,
    rule_file,
    deadline_file,
    output_file,
):

    print("Loading ML results...")
    ml = pd.read_csv(ml_file, low_memory=False)

    print("Loading Rule Engine results...")
    rules = pd.read_csv(rule_file, low_memory=False)

    print("Loading Deadline Forecast results...")
    deadline = pd.read_csv(deadline_file, low_memory=False)

    print()

    # -------------------------------------------------------------
    # Validate required columns
    # -------------------------------------------------------------

    required_ml = [
        "work_id",
        "iforest_percentile",
        "iforest_flag",
    ]

    required_rules = [
        "work_id",
        "status",
    ]

    required_deadline = [
        "work_id",
        "predicted_completion_days",
        "predicted_completion_date",
        "elapsed_days",
        "delay_ratio",
        "deadline_risk",
        "deadline_status",
    ]

    for column in required_ml:
        if column not in ml.columns:
            raise ValueError(
                f"ML results missing required column: {column}"
            )

    for column in required_rules:
        if column not in rules.columns:
            raise ValueError(
                f"Rule results missing required column: {column}"
            )

    for column in required_deadline:
        if column not in deadline.columns:
            raise ValueError(
                f"Deadline results missing required column: {column}"
            )

    # -------------------------------------------------------------
    # ML risk
    # -------------------------------------------------------------

    ml_data = ml.copy()

    ml_data["ml_risk_score"] = normalize_ml_score(
        ml_data["iforest_percentile"]
    )

    ml_data = ml_data[
        [
            c for c in [
                "work_id",
                "chamber",
                "mp",
                "state",
                "constituency",
                "ida",
                "work_category",
                "work_description",
                "iforest_anomaly_score",
                "iforest_decision_function",
                "iforest_flag",
                "iforest_percentile",
                "iforest_risk_band",
                "ml_risk_score",
            ]
            if c in ml_data.columns
        ]
    ]

    # -------------------------------------------------------------
    # Rule risk
    # -------------------------------------------------------------

    # Keep one row per project by aggregating rule results.
    rule_summary = (
        rules.groupby("work_id")
        .agg(
            rule_fail_count=(
                "status",
                lambda x: int((x == "FAIL").sum())
            ),
            rule_review_count=(
                "status",
                lambda x: int((x == "REVIEW").sum())
            ),
            rule_not_checkable_count=(
                "status",
                lambda x: int(
                    (x == "NOT_CHECKABLE").sum()
                )
            ),
        )
        .reset_index()
    )

    # Preserve useful rule explanations.
    if "rule_id" in rules.columns and "message" in rules.columns:

        rule_messages = (
            rules[
                rules["status"].isin(["FAIL", "REVIEW"])
            ]
            .assign(
                rule_text=lambda x:
                    x["rule_id"].astype(str)
                    + ": "
                    + x["message"].astype(str)
            )
            .groupby("work_id")["rule_text"]
            .apply(
                lambda x: " | ".join(x.astype(str))
            )
            .reset_index(name="rule_reasons")
        )

        rule_summary = rule_summary.merge(
            rule_messages,
            on="work_id",
            how="left",
        )

    else:
        rule_summary["rule_reasons"] = ""

    # Calculate rule risk score.
    #
    # FAIL = 20 points each
    # REVIEW = 10 points each
    #
    # Capped at 100.
    rule_summary["rule_risk_score"] = (
        rule_summary["rule_fail_count"] * 20
        + rule_summary["rule_review_count"] * 10
    ).clip(
        0,
        MAX_RULE_SCORE
    )

    # -------------------------------------------------------------
    # Deadline risk
    # -------------------------------------------------------------

    deadline_data = deadline[
        [
            "work_id",
            "predicted_completion_days",
            "predicted_completion_date",
            "elapsed_days",
            "delay_ratio",
            "deadline_risk",
            "deadline_status",
        ]
    ].copy()

    deadline_data["deadline_risk_score"] = deadline_score(
        deadline_data["deadline_risk"]
    )

    # -------------------------------------------------------------
    # Merge all three systems
    # -------------------------------------------------------------

    result = ml_data.merge(
        rule_summary,
        on="work_id",
        how="left",
    )

    result = result.merge(
        deadline_data,
        on="work_id",
        how="left",
    )

    # -------------------------------------------------------------
    # Fill missing values
    # -------------------------------------------------------------

    result["rule_fail_count"] = (
        result["rule_fail_count"]
        .fillna(0)
        .astype(int)
    )

    result["rule_review_count"] = (
        result["rule_review_count"]
        .fillna(0)
        .astype(int)
    )

    result["rule_not_checkable_count"] = (
        result["rule_not_checkable_count"]
        .fillna(0)
        .astype(int)
    )

    result["rule_reasons"] = (
        result["rule_reasons"]
        .fillna("")
    )

    result["rule_risk_score"] = (
        result["rule_risk_score"]
        .fillna(0)
        .clip(0, 100)
    )

    result["deadline_risk"] = (
        result["deadline_risk"]
        .fillna("LOW")
    )

    result["deadline_status"] = (
        result["deadline_status"]
        .fillna("ON_TRACK")
    )

    result["deadline_risk_score"] = (
        result["deadline_risk_score"]
        .fillna(0)
        .clip(0, 100)
    )

    # -------------------------------------------------------------
    # Combined risk score
    # -------------------------------------------------------------

    result["combined_risk_score"] = (
        ML_WEIGHT * result["ml_risk_score"]
        + RULE_WEIGHT * result["rule_risk_score"]
        + DEADLINE_WEIGHT * result["deadline_risk_score"]
    )

    result["combined_risk_score"] = (
        result["combined_risk_score"]
        .clip(0, 100)
        .round(2)
    )

    # -------------------------------------------------------------
    # Risk level
    # -------------------------------------------------------------

    result["risk_level"] = result.apply(
        calculate_risk_level,
        axis=1,
    )

    result["verification_priority"] = (
        result["risk_level"]
        .apply(verification_priority)
    )

    # -------------------------------------------------------------
    # Risk reason
    # -------------------------------------------------------------

    result["risk_reason"] = result.apply(
        build_risk_reason,
        axis=1,
    )

    # -------------------------------------------------------------
    # Sort by verification priority
    # -------------------------------------------------------------

    result["_risk_order"] = (
        result["risk_level"]
        .map(PRIORITY_ORDER)
    )

    result = (
        result.sort_values(
            [
                "_risk_order",
                "combined_risk_score",
            ],
            ascending=[True, False],
        )
        .drop(columns=["_risk_order"])
        .reset_index(drop=True)
    )

    # -------------------------------------------------------------
    # Output
    # -------------------------------------------------------------

    output_path = Path(output_file)
    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    result.to_csv(
        output_path,
        index=False,
        encoding="utf-8-sig",
    )

    # -------------------------------------------------------------
    # Console summary
    # -------------------------------------------------------------

    print()
    print("RISK ENGINE COMPLETE")
    print("--------------------")
    print(f"Projects: {len(result):,}")
    print(f"Output: {output_path.resolve()}")

    print()
    print("Risk levels:")
    print(result["risk_level"].value_counts())

    print()
    print("Verification priorities:")
    print(result["verification_priority"].value_counts())

    print()
    print("Deadline risk:")
    print(result["deadline_risk"].value_counts())

    print()
    print("IMPORTANT:")
    print(
        "Risk level means verification priority, "
        "NOT proof of fraud or non-compliance."
    )


# ---------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------

if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="MPLADS Risk Engine"
    )

    parser.add_argument(
        "--ml",
        required=True,
        help="Isolation Forest prediction CSV",
    )

    parser.add_argument(
        "--rules",
        required=True,
        help="Rule Engine results CSV",
    )

    parser.add_argument(
        "--deadline",
        required=True,
        help="Deadline Forecaster prediction CSV",
    )

    parser.add_argument(
        "--output",
        default="data/processed/mplads_risk_results.csv",
        help="Output risk results CSV",
    )

    args = parser.parse_args()

    main(
        ml_file=args.ml,
        rule_file=args.rules,
        deadline_file=args.deadline,
        output_file=args.output,
    )