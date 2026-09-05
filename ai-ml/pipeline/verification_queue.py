"""
MPLADS Verification Queue
=========================

Purpose:
    Convert Risk Engine results into a prioritized verification queue.

Input:
    data/processed/mplads_risk_results.csv

Output:
    data/processed/mplads_verification_queue.csv

Only projects with:
    PRIORITY_1
    PRIORITY_2

are placed into the active verification queue.

PRIORITY_1:
    Highest verification priority.

PRIORITY_2:
    Secondary verification priority.

PRIORITY_3:
    Not included in the active queue.

IMPORTANT:
    Risk level and verification priority are screening signals.
    They do NOT establish fraud or non-compliance.
"""

import argparse
from pathlib import Path

import numpy as np
import pandas as pd


DEFAULT_RISK_FILE = Path(
    "data/processed/mplads_risk_results.csv"
)

DEFAULT_OUTPUT_FILE = Path(
    "data/processed/mplads_verification_queue.csv"
)


REQUIRED_COLUMNS = [
    "work_id",
    "risk_level",
    "verification_priority",
]


PRIORITY_ORDER = {
    "PRIORITY_1": 1,
    "PRIORITY_2": 2,
    "PRIORITY_3": 3,
}


def load_risk_results(path: Path) -> pd.DataFrame:
    """Load and validate Risk Engine output."""

    if not path.exists():
        raise FileNotFoundError(
            f"Risk Engine output not found:\n{path}\n\n"
            "Run the Risk Engine first."
        )

    df = pd.read_csv(path, low_memory=False)

    missing = [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            "Risk Engine output is missing required columns:\n"
            + "\n".join(f"- {column}" for column in missing)
        )

    return df


def build_verification_queue(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create the active verification queue.

    Only PRIORITY_1 and PRIORITY_2 projects are included.
    """

    queue = df[
        df["verification_priority"].isin(
            ["PRIORITY_1", "PRIORITY_2"]
        )
    ].copy()

    # ---------------------------------------------------------
    # Priority number
    # ---------------------------------------------------------

    queue["priority_rank"] = (
        queue["verification_priority"]
        .map(PRIORITY_ORDER)
        .fillna(99)
        .astype(int)
    )

    # ---------------------------------------------------------
    # Verification status
    # ---------------------------------------------------------

    queue["verification_status"] = "PENDING"

    # ---------------------------------------------------------
    # Queue ordering
    #
    # First:
    #   PRIORITY_1
    #
    # Then:
    #   PRIORITY_2
    #
    # Within the same priority, higher anomaly score comes first.
    # ---------------------------------------------------------

    if "iforest_anomaly_score" in queue.columns:
        queue["sort_anomaly_score"] = pd.to_numeric(
            queue["iforest_anomaly_score"],
            errors="coerce"
        ).fillna(-np.inf)
    else:
        queue["sort_anomaly_score"] = -np.inf

    if "iforest_percentile" in queue.columns:
        queue["sort_percentile"] = pd.to_numeric(
            queue["iforest_percentile"],
            errors="coerce"
        ).fillna(-np.inf)
    else:
        queue["sort_percentile"] = -np.inf

    queue = queue.sort_values(
        by=[
            "priority_rank",
            "sort_anomaly_score",
            "sort_percentile",
        ],
        ascending=[
            True,
            False,
            False,
        ],
    ).reset_index(drop=True)

    # ---------------------------------------------------------
    # Queue position
    # ---------------------------------------------------------

    queue["queue_position"] = np.arange(
        1,
        len(queue) + 1
    )

    # ---------------------------------------------------------
    # Recommended action
    # ---------------------------------------------------------

    queue["recommended_action"] = np.where(
        queue["verification_priority"] == "PRIORITY_1",
        "URGENT_OFFICIAL_VERIFICATION",
        "OFFICIAL_VERIFICATION",
    )

    # ---------------------------------------------------------
    # Verification outcome
    #
    # Empty initially.
    # This gets filled later by the official verification workflow.
    # ---------------------------------------------------------

    queue["verification_outcome"] = ""

    queue["verification_notes"] = ""

    # ---------------------------------------------------------
    # Remove temporary sorting columns
    # ---------------------------------------------------------

    queue = queue.drop(
        columns=[
            "sort_anomaly_score",
            "sort_percentile",
        ],
        errors="ignore",
    )

    return queue


def print_summary(
    original: pd.DataFrame,
    queue: pd.DataFrame
):
    """Print verification queue statistics."""

    print("\nVERIFICATION QUEUE CREATED")
    print("--------------------------")

    print(
        f"Projects available: {len(original):,}"
    )

    print(
        f"Projects requiring active verification: "
        f"{len(queue):,}"
    )

    print("\nPriority breakdown:")

    if len(queue) > 0:
        print(
            queue["verification_priority"]
            .value_counts()
            .sort_index()
        )
    else:
        print("No projects require active verification.")

    print("\nRisk breakdown:")

    if len(queue) > 0 and "risk_level" in queue.columns:
        print(
            queue["risk_level"]
            .value_counts()
            .sort_index()
        )

    print("\nWorkflow:")
    print(
        "Risk Engine"
        "\n    ↓"
        "\nVerification Queue"
        "\n    ↓"
        "\nOfficial Verification"
        "\n    ↓"
        "\nVerified Outcome"
        "\n    ↓"
        "\nFeedback / Future Model Evaluation"
    )


def main(
    risk_file: Path,
    output_file: Path
):
    print("Loading Risk Engine results...")

    risk_results = load_risk_results(risk_file)

    print(
        f"Projects available: {len(risk_results):,}"
    )

    queue = build_verification_queue(risk_results)

    output_file.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    queue.to_csv(
        output_file,
        index=False,
        encoding="utf-8-sig"
    )

    print_summary(
        risk_results,
        queue
    )

    print(
        f"\nQueue: {output_file}"
    )

    print(
        "\nIMPORTANT:"
        "\nRisk level means verification priority, "
        "NOT proof of fraud or non-compliance."
    )


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="Create MPLADS verification queue from Risk Engine results."
    )

    parser.add_argument(
        "--risk",
        default=str(DEFAULT_RISK_FILE),
        help=(
            "Risk Engine CSV. "
            "Default: data/processed/mplads_risk_results.csv"
        ),
    )

    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT_FILE),
        help=(
            "Verification queue output CSV. "
            "Default: data/processed/mplads_verification_queue.csv"
        ),
    )

    args = parser.parse_args()

    main(
        risk_file=Path(args.risk),
        output_file=Path(args.output),
    )