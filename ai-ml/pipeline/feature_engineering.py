"""
MPLADS Feature Engine
=====================

Purpose:
    Convert the project-level MPLADS master dataset into an ML-ready feature
    dataset for anomaly detection.

Input:
    CSV containing one row per MPLADS Work ID.

Output:
    1. ML feature CSV
    2. Feature dictionary CSV

Usage:
    python mplads_feature_engine.py input.csv output_features.csv

Example:
    python mplads_feature_engine.py mplads_master_project_dataset.csv mplads_ml_features.csv
"""

import sys
from pathlib import Path
import numpy as np
import pandas as pd


REQUIRED_COLUMNS = [
    "work_id",
    "sanction_amount",
    "expenditure_total",
    "recommended_amount",
    "recommendation_to_sanction_days",
    "sanction_to_first_expenditure_days",
    "sanction_to_completion_days",
    "vendor_count",
    "expenditure_records",
    "has_expenditure",
    "has_completion_record",
    "has_completion_image_reference",
    "completion_date",
]


def safe_ratio(numerator, denominator):
    """Calculate a ratio without divide-by-zero/infinite values."""
    numerator = pd.to_numeric(numerator, errors="coerce")
    denominator = pd.to_numeric(denominator, errors="coerce")
    result = numerator / denominator.replace(0, np.nan)
    return result.replace([np.inf, -np.inf], np.nan)


def build_features(df):
    """Create anomaly-detection features from the MPLADS master dataset."""
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(
            "Missing required columns: " + ", ".join(missing)
        )

    out = df.copy()

    # ---------- Financial features ----------
    out["f_sanction_amount"] = pd.to_numeric(
        out["sanction_amount"], errors="coerce"
    )
    out["f_recommended_amount"] = pd.to_numeric(
        out["recommended_amount"], errors="coerce"
    )
    out["f_expenditure_amount"] = pd.to_numeric(
        out["expenditure_total"], errors="coerce"
    )

    # Ratios are generally more useful than raw rupee values for anomaly detection.
    out["f_expenditure_to_sanction"] = safe_ratio(
        out["expenditure_total"], out["sanction_amount"]
    )
    out["f_recommendation_to_sanction"] = safe_ratio(
        out["sanction_amount"], out["recommended_amount"]
    )

    # Explicit rule signals. These are NOT fraud labels.
    out["f_expenditure_above_sanction"] = (
        (out["expenditure_total"] > out["sanction_amount"])
        & out["expenditure_total"].notna()
        & out["sanction_amount"].notna()
    ).astype(int)

    # ---------- Timeline features ----------
    for source, target in [
        ("recommendation_to_sanction_days", "f_recommendation_to_sanction_days"),
        ("sanction_to_first_expenditure_days", "f_sanction_to_first_expenditure_days"),
        ("sanction_to_completion_days", "f_sanction_to_completion_days"),
    ]:
        out[target] = pd.to_numeric(out[source], errors="coerce")

    # Explicit impossible-date signals.
    out["f_negative_recommendation_to_sanction"] = (
        out["f_recommendation_to_sanction_days"] < 0
    ).fillna(False).astype(int)

    out["f_negative_sanction_to_expenditure"] = (
        out["f_sanction_to_first_expenditure_days"] < 0
    ).fillna(False).astype(int)

    out["f_negative_sanction_to_completion"] = (
        out["f_sanction_to_completion_days"] < 0
    ).fillna(False).astype(int)

    # ---------- Execution features ----------
    out["f_vendor_count"] = pd.to_numeric(
        out["vendor_count"], errors="coerce"
    )
    out["f_expenditure_records"] = pd.to_numeric(
        out["expenditure_records"], errors="coerce"
    )

    out["f_multiple_vendors"] = (
        out["f_vendor_count"] >= 2
    ).fillna(False).astype(int)

    out["f_multiple_expenditure_records"] = (
        out["f_expenditure_records"] >= 2
    ).fillna(False).astype(int)

    # ---------- Lifecycle / evidence features ----------
    for source, target in [
        ("has_expenditure", "f_has_expenditure"),
        ("has_completion_record", "f_has_completion_record"),
        ("has_completion_image_reference", "f_has_completion_image_reference"),
    ]:
        out[target] = out[source].fillna(False).astype(int)

    # Missingness is itself useful because "no evidence" and "zero" are different.
    out["f_expenditure_missing"] = out["expenditure_total"].isna().astype(int)
    out["f_completion_date_missing"] = out["completion_date"].isna().astype(int)
    out["f_completion_evidence_missing"] = (
        out["has_completion_image_reference"].isna()
        | (~out["has_completion_image_reference"].fillna(False))
    ).astype(int)

    # ---------- Skew-resistant versions of amount/count features ----------
    out["f_log_sanction_amount"] = np.log1p(
        out["f_sanction_amount"].clip(lower=0)
    )
    out["f_log_expenditure_amount"] = np.log1p(
        out["f_expenditure_amount"].clip(lower=0)
    )
    out["f_log_vendor_count"] = np.log1p(
        out["f_vendor_count"].clip(lower=0)
    )
    out["f_log_expenditure_records"] = np.log1p(
        out["f_expenditure_records"].clip(lower=0)
    )

    # ---------- Data quality / consistency signals ----------
    # Completion should normally not precede sanction. This is a review signal,
    # not a fraud conclusion.
    out["f_completion_before_sanction"] = (
        out["sanction_to_completion_days"] < 0
    ).fillna(False).astype(int)

    out["f_expenditure_start_before_sanction"] = (
        out["sanction_to_first_expenditure_days"] < 0
    ).fillna(False).astype(int)

    # ---------- Model-ready feature list ----------
    feature_columns = [
        "f_log_sanction_amount",
        "f_log_expenditure_amount",
        "f_expenditure_to_sanction",
        "f_recommendation_to_sanction",
        "f_recommendation_to_sanction_days",
        "f_sanction_to_first_expenditure_days",
        "f_sanction_to_completion_days",
        "f_vendor_count",
        "f_expenditure_records",
        "f_has_expenditure",
        "f_has_completion_record",
        "f_has_completion_image_reference",
        "f_expenditure_missing",
        "f_completion_date_missing",
        "f_completion_evidence_missing",
        "f_expenditure_above_sanction",
        "f_multiple_vendors",
        "f_multiple_expenditure_records",
        "f_completion_before_sanction",
        "f_expenditure_start_before_sanction",
    ]

    # Keep original project-identification fields for traceability.
    id_columns = [
        c for c in [
            "work_id", "chamber", "mp", "state", "constituency",
            "ida", "work_category", "work_description"
        ] if c in out.columns
    ]

    result = out[id_columns + feature_columns].copy()

    # Never leave infinities in an ML input file.
    result = result.replace([np.inf, -np.inf], np.nan)

    return result, feature_columns


def make_dictionary(feature_columns):
    descriptions = {
        "f_log_sanction_amount": "Log-transformed sanctioned amount; reduces effect of extreme project sizes.",
        "f_log_expenditure_amount": "Log-transformed total expenditure.",
        "f_expenditure_to_sanction": "Total expenditure divided by sanctioned amount.",
        "f_recommendation_to_sanction": "Sanction amount divided by recommended amount.",
        "f_recommendation_to_sanction_days": "Days from recommendation to sanction.",
        "f_sanction_to_first_expenditure_days": "Days from sanction to first expenditure.",
        "f_sanction_to_completion_days": "Days from sanction to completion.",
        "f_vendor_count": "Number of distinct vendors associated with the project.",
        "f_expenditure_records": "Number of expenditure/payment records.",
        "f_has_expenditure": "Whether expenditure data exists.",
        "f_has_completion_record": "Whether an official completion record exists.",
        "f_has_completion_image_reference": "Whether the completion table contains an image/reference entry.",
        "f_expenditure_missing": "1 when expenditure is missing.",
        "f_completion_date_missing": "1 when completion date is missing.",
        "f_completion_evidence_missing": "1 when completion evidence/reference is absent.",
        "f_expenditure_above_sanction": "1 when recorded expenditure exceeds sanctioned amount; rule signal only.",
        "f_multiple_vendors": "1 when two or more vendors are associated with the project.",
        "f_multiple_expenditure_records": "1 when two or more expenditure records exist.",
        "f_completion_before_sanction": "1 when completion date precedes sanction date; review/data-quality signal.",
        "f_expenditure_start_before_sanction": "1 when expenditure begins before sanction; review/data-quality signal.",
    }
    rows = []
    for f in feature_columns:
        rows.append([f, descriptions.get(f, ""), "ML / anomaly detection"])
    return pd.DataFrame(rows, columns=["feature", "meaning", "use"])


def main():
    if len(sys.argv) != 3:
        print(
            "Usage: python mplads_feature_engine.py "
            "<master_dataset.csv> <output_features.csv>"
        )
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    df = pd.read_csv(input_path, low_memory=False)
    features, feature_columns = build_features(df)
    features.to_csv(output_path, index=False, encoding="utf-8-sig")

    dictionary_path = output_path.with_name(
        output_path.stem + "_dictionary.csv"
    )
    make_dictionary(feature_columns).to_csv(
        dictionary_path, index=False, encoding="utf-8-sig"
    )

    print(f"Input projects: {len(df):,}")
    print(f"Output rows: {len(features):,}")
    print(f"ML features: {len(feature_columns)}")
    print(f"Feature file: {output_path}")
    print(f"Dictionary: {dictionary_path}")


if __name__ == "__main__":
    main()