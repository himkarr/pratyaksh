"""
MPLADS Risk Engine
==================

Purpose:
    Combine:
        1. Isolation Forest anomaly results
        2. Deterministic Rule Engine results

    into a single project-level risk and verification-priority result.

Inputs:
    - Isolation Forest prediction CSV
    - Rule Engine result CSV

Output:
    - Project-level MPLADS risk results CSV

IMPORTANT:
    Risk is a verification-prioritization signal.
    It does NOT prove fraud, corruption, or non-compliance.
"""

import argparse
from pathlib import Path

import numpy as np
import pandas as pd


# ============================================================
# DEFAULT PATHS
# ============================================================

DEFAULT_ML_FILE = Path(
    "mplads_isolation_forest_predictions.csv"
)

DEFAULT_RULE_FILE = Path(
    "data/processed/mplads_rule_results.csv"
)

DEFAULT_OUTPUT_FILE = Path(
    "data/processed/mplads_risk_results.csv"
)


# ============================================================
# REQUIRED COLUMNS
# ============================================================

ML_REQUIRED_COLUMNS = [
    "work_id",
    "iforest_anomaly_score",
    "iforest_percentile",
    "iforest_flag",
]

RULE_REQUIRED_COLUMNS = [
    "work_id",
    "status",
]


# ============================================================
# RISK THRESHOLDS
# ============================================================

# These thresholds are deliberately kept simple and explainable.

HIGH_RISK_SCORE = 80
MEDIUM_RISK_SCORE = 50

HIGH_PRIORITY = "PRIORITY_1"
MEDIUM_PRIORITY = "PRIORITY_2"
LOW_PRIORITY = "PRIORITY_3"


# ============================================================
# LOADERS
# ============================================================

def load_ml_results(path: Path) -> pd.DataFrame:
    """Load and validate Isolation Forest results."""

    if not path.exists():
        raise FileNotFoundError(
            f"ML results file not found:\n{path}"
        )

    df = pd.read_csv(path, low_memory=False)

    missing = [
        c for c in ML_REQUIRED_COLUMNS
        if c not in df.columns
    ]

    if missing:
        raise ValueError(
            "ML results are missing required columns:\n"
            + "\n".join(f"- {c}" for c in missing)
        )

    return df


def load_rule_results(path: Path) -> pd.DataFrame:
    """Load and validate Rule Engine results."""

    if not path.exists():
        raise FileNotFoundError(
            f"Rule Engine results file not found:\n{path}\n\n"
            "Run rule_engine/rules.py first."
        )

    df = pd.read_csv(path, low_memory=False)

    missing = [
        c for c in RULE_REQUIRED_COLUMNS
        if c not in df.columns
    ]

    if missing:
        raise ValueError(
            "Rule Engine results are missing required columns:\n"
            + "\n".join(f"- {c}" for c in missing)
        )

    return df


# ============================================================
# RULE AGGREGATION
# ============================================================

def aggregate_rules(rules: pd.DataFrame) -> pd.DataFrame:
    """
    Convert potentially multiple rule-result rows per project
    into one project-level summary.

    Rule Engine output can contain many rows for the same work_id.
    """

    rules = rules.copy()

    # Normalize status
    rules["status"] = (
        rules["status"]
        .astype(str)
        .str.upper()
        .str.strip()
    )

    # --------------------------------------------------------
    # Counts
    # --------------------------------------------------------

    summary = (
        rules.groupby("work_id")
        .agg(
            rule_total_count=("status", "size"),
            rule_review_count=(
                "status",
                lambda x: int((x == "REVIEW").sum())
            ),
            rule_pass_count=(
                "status",
                lambda x: int((x == "PASS").sum())
            ),
            rule_not_checkable_count=(
                "status",
                lambda x: int((x == "NOT_CHECKABLE").sum())
            ),
        )
        .reset_index()
    )

    # --------------------------------------------------------
    # Rule names / reasons
    # --------------------------------------------------------

    reason_column = None

    for candidate in [
        "rule_name",
        "rule",
        "rule_id",
        "name",
        "reason",
        "message",
    ]:
        if candidate in rules.columns:
            reason_column = candidate
            break

    if reason_column is not None:

        review_rules = rules[
            rules["status"] == "REVIEW"
        ].copy()

        if len(review_rules) > 0:

            review_reason_summary = (
                review_rules
                .groupby("work_id")[reason_column]
                .apply(
                    lambda x: "; ".join(
                        dict.fromkeys(
                            str(v)
                            for v in x
                            if pd.notna(v)
                            and str(v).strip()
                        )
                    )
                )
                .reset_index()
            )

            review_reason_summary = review_reason_summary.rename(
                columns={
                    reason_column: "rule_review_reasons"
                }
            )

            summary = summary.merge(
                review_reason_summary,
                on="work_id",
                how="left",
            )

    return summary


# ============================================================
# ML SCORE
# ============================================================

def calculate_ml_risk_score(row: pd.Series) -> float:
    """
    Convert Isolation Forest percentile into a 0-100
    presentation-oriented ML risk contribution.

    This does NOT represent probability of fraud.
    """

    percentile = pd.to_numeric(
        row["iforest_percentile"],
        errors="coerce"
    )

    if pd.isna(percentile):
        return 0.0

    return float(np.clip(percentile, 0, 100))


# ============================================================
# RULE RISK CONTRIBUTION
# ============================================================

def calculate_rule_risk_score(row: pd.Series) -> float:
    """
    Convert rule-review signals into a bounded 0-100
    rule contribution.

    This is intentionally capped so that a large number
    of rule rows cannot dominate the model signal.
    """

    review_count = int(
        row.get("rule_review_count", 0)
    )

    if review_count <= 0:
        return 0.0

    # First few review signals contribute most strongly.
    score = min(review_count * 15.0, 60.0)

    return score


# ============================================================
# FINAL RISK SCORE
# ============================================================

def calculate_final_risk_score(row: pd.Series) -> float:
    """
    Combine ML anomaly and rule-review signals.

    Weighting:
        60% Isolation Forest
        40% Rule Engine

    The resulting value is a screening score, not a
    probability of fraud.
    """

    ml_score = calculate_ml_risk_score(row)

    rule_score = calculate_rule_risk_score(row)

    final_score = (
        0.60 * ml_score
        + 0.40 * rule_score
    )

    return round(
        float(np.clip(final_score, 0, 100)),
        4
    )


# ============================================================
# RISK LEVEL
# ============================================================

def determine_risk_level(score: float) -> str:

    if score >= HIGH_RISK_SCORE:
        return "HIGH"

    if score >= MEDIUM_RISK_SCORE:
        return "MEDIUM"

    return "LOW"


# ============================================================
# VERIFICATION PRIORITY
# ============================================================

def determine_priority(risk_level: str) -> str:

    if risk_level == "HIGH":
        return HIGH_PRIORITY

    if risk_level == "MEDIUM":
        return MEDIUM_PRIORITY

    return LOW_PRIORITY


# ============================================================
# EXPLANATION GENERATION
# ============================================================

def build_reasons(row: pd.Series) -> list[str]:
    """
    Generate human-readable explanations for the risk result.

    These are screening explanations, not allegations.
    """

    reasons = []

    # --------------------------------------------------------
    # Isolation Forest
    # --------------------------------------------------------

    percentile = pd.to_numeric(
        row.get("iforest_percentile"),
        errors="coerce"
    )

    if pd.notna(percentile):

        if percentile >= 99:
            reasons.append(
                f"Isolation Forest detected a highly unusual "
                f"project pattern (anomaly percentile "
                f"{percentile:.2f})."
            )

        elif percentile >= 95:
            reasons.append(
                f"Isolation Forest detected an unusual "
                f"project pattern (anomaly percentile "
                f"{percentile:.2f})."
            )

        elif percentile >= 80:
            reasons.append(
                f"Isolation Forest identified moderate "
                f"statistical unusualness "
                f"(percentile {percentile:.2f})."
            )

    # --------------------------------------------------------
    # Rule Engine
    # --------------------------------------------------------

    review_count = int(
        row.get("rule_review_count", 0)
    )

    if review_count > 0:

        reasons.append(
            f"{review_count} Rule Engine check(s) "
            f"require review."
        )

    # --------------------------------------------------------
    # Specific rule reasons if available
    # --------------------------------------------------------

    rule_reasons = row.get(
        "rule_review_reasons"
    )

    if pd.notna(rule_reasons):

        rule_reasons = str(
            rule_reasons
        ).strip()

        if rule_reasons:
            reasons.append(
                f"Rule signals: {rule_reasons}"
            )

    # --------------------------------------------------------
    # Fallback
    # --------------------------------------------------------

    if not reasons:
        reasons.append(
            "No significant anomaly or rule-review "
            "signal identified."
        )

    return reasons


# ============================================================
# BUILD RISK RESULTS
# ============================================================

def build_risk_results(
    ml: pd.DataFrame,
    rules: pd.DataFrame,
) -> pd.DataFrame:

    # --------------------------------------------------------
    # Aggregate rule results
    # --------------------------------------------------------

    rule_summary = aggregate_rules(rules)

    # --------------------------------------------------------
    # Merge ML + rules
    # --------------------------------------------------------

    result = ml.merge(
        rule_summary,
        on="work_id",
        how="left",
    )

    # Projects without rule results get zero counts.
    count_columns = [
        "rule_total_count",
        "rule_review_count",
        "rule_pass_count",
        "rule_not_checkable_count",
    ]

    for column in count_columns:
        if column not in result.columns:
            result[column] = 0

        result[column] = (
            pd.to_numeric(
                result[column],
                errors="coerce"
            )
            .fillna(0)
            .astype(int)
        )

    if "rule_review_reasons" not in result.columns:
        result["rule_review_reasons"] = ""

    # --------------------------------------------------------
    # Scores
    # --------------------------------------------------------

    result["ml_risk_score"] = result.apply(
        calculate_ml_risk_score,
        axis=1,
    ).round(4)

    result["rule_risk_score"] = result.apply(
        calculate_rule_risk_score,
        axis=1,
    ).round(4)

    result["risk_score"] = result.apply(
        calculate_final_risk_score,
        axis=1,
    )

    # --------------------------------------------------------
    # Risk classification
    # --------------------------------------------------------

    result["risk_level"] = result[
        "risk_score"
    ].apply(determine_risk_level)

    result["verification_priority"] = result[
        "risk_level"
    ].apply(determine_priority)

    # --------------------------------------------------------
    # Explanation
    # --------------------------------------------------------

    result["risk_reasons"] = result.apply(
        lambda row: " | ".join(
            build_reasons(row)
        ),
        axis=1,
    )

    # --------------------------------------------------------
    # Recommended action
    # --------------------------------------------------------

    result["recommended_action"] = np.select(
        [
            result["risk_level"] == "HIGH",
            result["risk_level"] == "MEDIUM",
        ],
        [
            "URGENT_OFFICIAL_VERIFICATION",
            "OFFICIAL_VERIFICATION",
        ],
        default="ROUTINE_MONITORING",
    )

    # --------------------------------------------------------
    # Keep useful project identity fields
    # --------------------------------------------------------

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

    identity_columns = [
        c for c in identity_columns
        if c in result.columns
    ]

    output_columns = identity_columns + [
        "iforest_anomaly_score",
        "iforest_decision_function",
        "iforest_percentile",
        "iforest_flag",
        "iforest_risk_band",

        "rule_total_count",
        "rule_review_count",
        "rule_pass_count",
        "rule_not_checkable_count",
        "rule_review_reasons",

        "ml_risk_score",
        "rule_risk_score",
        "risk_score",

        "risk_level",
        "verification_priority",

        "risk_reasons",
        "recommended_action",
    ]

    output_columns = [
        c for c in output_columns
        if c in result.columns
    ]

    result = result[output_columns].copy()

    # --------------------------------------------------------
    # Risk rank
    # --------------------------------------------------------

    result["risk_rank"] = (
        result["risk_score"]
        .rank(
            method="first",
            ascending=False
        )
        .astype(int)
    )

    # --------------------------------------------------------
    # Sort
    # --------------------------------------------------------

    result = result.sort_values(
        by=[
            "verification_priority",
            "risk_score",
        ],
        ascending=[
            True,
            False,
        ],
    ).reset_index(drop=True)

    return result


# ============================================================
# MAIN
# ============================================================

def main(
    ml_file: Path,
    rule_file: Path,
    output_file: Path,
):

    print("Loading ML results...")

    ml = load_ml_results(
        ml_file
    )

    print("Loading Rule Engine results...")

    rules = load_rule_results(
        rule_file
    )

    print(
        f"ML projects: {len(ml):,}"
    )

    print(
        f"Rule-result rows: {len(rules):,}"
    )

    # --------------------------------------------------------
    # Build
    # --------------------------------------------------------

    result = build_risk_results(
        ml,
        rules,
    )

    # --------------------------------------------------------
    # Output
    # --------------------------------------------------------

    output_file.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    result.to_csv(
        output_file,
        index=False,
        encoding="utf-8-sig",
    )

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    print("\nRISK ENGINE COMPLETE")
    print("--------------------")

    print(
        f"Projects: {len(result):,}"
    )

    print(
        f"Output: {output_file}"
    )

    print("\nRisk levels:")

    print(
        result["risk_level"]
        .value_counts()
    )

    print("\nVerification priorities:")

    print(
        result["verification_priority"]
        .value_counts()
    )

    print("\nRecommended actions:")

    print(
        result["recommended_action"]
        .value_counts()
    )

    print("\nIMPORTANT:")
    print(
        "Risk level means verification priority, "
        "NOT proof of fraud or non-compliance."
    )


# ============================================================
# CLI
# ============================================================

if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="MPLADS Risk Engine"
    )

    parser.add_argument(
        "--ml",
        default=str(
            DEFAULT_ML_FILE
        ),
        help=(
            "Isolation Forest prediction CSV."
        ),
    )

    parser.add_argument(
        "--rules",
        default=str(
            DEFAULT_RULE_FILE
        ),
        help=(
            "Rule Engine result CSV."
        ),
    )

    parser.add_argument(
        "--output",
        default=str(
            DEFAULT_OUTPUT_FILE
        ),
        help=(
            "Output Risk Engine CSV."
        ),
    )

    args = parser.parse_args()

    main(
        ml_file=Path(args.ml),
        rule_file=Path(args.rules),
        output_file=Path(args.output),
    )