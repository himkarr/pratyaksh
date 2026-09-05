"""
MPLADS Verification Outcome Manager
===================================

Purpose:
    Create and manage verification outcome records for projects that have
    entered the MPLADS verification queue.

Important:
    - This file does NOT decide whether a project is fraudulent.
    - This file does NOT generate synthetic verification outcomes.
    - Verification outcomes must come from an actual authorized verification
      process.
    - These outcomes can later become labels for supervised ML evaluation.

Input:
    data/processed/mplads_verification_queue.csv

Output:
    data/processed/mplads_verification_outcomes.csv

Usage:
    python verification/verification_outcome.py
"""

import argparse
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd


# ---------------------------------------------------------------------
# Allowed values
# ---------------------------------------------------------------------

VERIFICATION_STATUSES = {
    "PENDING",
    "IN_PROGRESS",
    "COMPLETED",
}

VERIFICATION_OUTCOMES = {
    "VERIFIED_OK",
    "ISSUE_FOUND",
    "FALSE_POSITIVE",
    "INSUFFICIENT_EVIDENCE",
}

ISSUE_TYPES = {
    "NONE",
    "DOCUMENT_MISMATCH",
    "FINANCIAL_MISMATCH",
    "TIMELINE_ISSUE",
    "PHYSICAL_PROGRESS_ISSUE",
    "MISSING_EVIDENCE",
    "OTHER",
}


# ---------------------------------------------------------------------
# Required queue columns
# ---------------------------------------------------------------------

REQUIRED_QUEUE_COLUMNS = [
    "work_id",
    "risk_level",
    "verification_priority",
]


# ---------------------------------------------------------------------
# Outcome schema
# ---------------------------------------------------------------------

OUTCOME_COLUMNS = [
    "work_id",

    # Current verification state
    "verification_status",

    # Actual result after verification
    "verification_outcome",

    # Person/authority who performed verification
    "verified_by",

    # Timestamp of verification
    "verification_date",

    # Supporting information
    "verification_notes",
    "evidence_available",
    "issue_type",
]


# ---------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------

def validate_queue(df: pd.DataFrame) -> None:
    """Validate that the verification queue has the required fields."""

    missing = [
        column
        for column in REQUIRED_QUEUE_COLUMNS
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            "Verification queue is missing required columns:\n- "
            + "\n- ".join(missing)
        )


def validate_outcomes(df: pd.DataFrame) -> None:
    """Validate verification outcome records."""

    missing = [
        column
        for column in OUTCOME_COLUMNS
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            "Verification outcome file is missing required columns:\n- "
            + "\n- ".join(missing)
        )

    invalid_status = (
        df["verification_status"]
        .dropna()
        .astype(str)
        .loc[
            lambda s: ~s.isin(VERIFICATION_STATUSES)
        ]
        .unique()
    )

    if len(invalid_status) > 0:
        raise ValueError(
            f"Invalid verification_status values: {list(invalid_status)}"
        )

    invalid_outcome = (
        df["verification_outcome"]
        .dropna()
        .astype(str)
        .loc[
            lambda s: ~s.isin(VERIFICATION_OUTCOMES)
        ]
        .unique()
    )

    if len(invalid_outcome) > 0:
        raise ValueError(
            f"Invalid verification_outcome values: {list(invalid_outcome)}"
        )

    invalid_issue = (
        df["issue_type"]
        .dropna()
        .astype(str)
        .loc[
            lambda s: ~s.isin(ISSUE_TYPES)
        ]
        .unique()
    )

    if len(invalid_issue) > 0:
        raise ValueError(
            f"Invalid issue_type values: {list(invalid_issue)}"
        )


# ---------------------------------------------------------------------
# Create initial verification records
# ---------------------------------------------------------------------

def create_initial_outcomes(queue_df: pd.DataFrame) -> pd.DataFrame:
    """
    Create PENDING verification records from the active verification queue.

    No verification result is invented here.
    """

    validate_queue(queue_df)

    records = queue_df[["work_id"]].copy()

    records["verification_status"] = "PENDING"

    # No result exists until an authorized person verifies the project.
    records["verification_outcome"] = pd.NA

    records["verified_by"] = pd.NA
    records["verification_date"] = pd.NA
    records["verification_notes"] = pd.NA
    records["evidence_available"] = pd.NA
    records["issue_type"] = pd.NA

    return records[OUTCOME_COLUMNS]


# ---------------------------------------------------------------------
# Update an individual verification
# ---------------------------------------------------------------------

def record_verification(
    outcome_file: Path,
    work_id: str,
    verification_outcome: str,
    verified_by: str,
    verification_notes: str = "",
    evidence_available: bool = True,
    issue_type: str = "NONE",
) -> None:
    """
    Record the actual result of an official verification.

    Example:

        record_verification(
            outcome_file,
            work_id="WS/MP134/2025-2026/239327",
            verification_outcome="ISSUE_FOUND",
            verified_by="DISTRICT_AUTHORITY",
            verification_notes="Completion evidence does not match record.",
            evidence_available=True,
            issue_type="DOCUMENT_MISMATCH",
        )
    """

    if verification_outcome not in VERIFICATION_OUTCOMES:
        raise ValueError(
            f"Invalid verification_outcome: {verification_outcome}"
        )

    if issue_type not in ISSUE_TYPES:
        raise ValueError(
            f"Invalid issue_type: {issue_type}"
        )

    if not verified_by:
        raise ValueError("verified_by cannot be empty.")

    df = pd.read_csv(outcome_file, low_memory=False)

    validate_outcomes(df)

    matches = df["work_id"].astype(str) == str(work_id)

    if not matches.any():
        raise ValueError(
            f"work_id not found in verification queue: {work_id}"
        )

    # Update the selected project.
    df.loc[matches, "verification_status"] = "COMPLETED"
    df.loc[matches, "verification_outcome"] = verification_outcome
    df.loc[matches, "verified_by"] = verified_by
    df.loc[matches, "verification_date"] = (
        datetime.now(timezone.utc).isoformat()
    )
    df.loc[matches, "verification_notes"] = verification_notes
    df.loc[matches, "evidence_available"] = evidence_available
    df.loc[matches, "issue_type"] = issue_type

    validate_outcomes(df)

    df.to_csv(
        outcome_file,
        index=False,
        encoding="utf-8-sig",
    )

    print("Verification recorded")
    print("---------------------")
    print(f"Work ID: {work_id}")
    print(f"Outcome: {verification_outcome}")
    print(f"Verified by: {verified_by}")
    print(f"Issue type: {issue_type}")


# ---------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------

def main():

    parser = argparse.ArgumentParser(
        description="Create/manage MPLADS verification outcome records."
    )

    parser.add_argument(
        "--queue",
        default="data/processed/mplads_verification_queue.csv",
        help="Verification queue CSV.",
    )

    parser.add_argument(
        "--output",
        default="data/processed/mplads_verification_outcomes.csv",
        help="Verification outcome CSV.",
    )

    args = parser.parse_args()

    queue_path = Path(args.queue)
    output_path = Path(args.output)

    if not queue_path.exists():
        raise FileNotFoundError(
            f"Verification queue not found:\n{queue_path}"
        )

    print("MPLADS VERIFICATION OUTCOME MANAGER")
    print("===================================")

    print("\nLoading verification queue...")

    queue = pd.read_csv(
        queue_path,
        low_memory=False,
    )

    print(f"Projects in queue: {len(queue):,}")

    # Do not overwrite an existing outcome file.
    if output_path.exists():

        print("\nExisting verification outcome file found.")

        outcomes = pd.read_csv(
            output_path,
            low_memory=False,
        )

        validate_outcomes(outcomes)

        print(f"Existing outcome records: {len(outcomes):,}")

        existing_ids = set(
            outcomes["work_id"].astype(str)
        )

        new_queue = queue[
            ~queue["work_id"].astype(str).isin(existing_ids)
        ].copy()

        if len(new_queue) > 0:

            new_records = create_initial_outcomes(new_queue)

            outcomes = pd.concat(
                [outcomes, new_records],
                ignore_index=True,
            )

            outcomes.to_csv(
                output_path,
                index=False,
                encoding="utf-8-sig",
            )

            print(
                f"Added new PENDING records: {len(new_records):,}"
            )

        else:
            print("No new projects to add.")

    else:

        print("\nCreating verification outcome file...")

        outcomes = create_initial_outcomes(queue)

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        outcomes.to_csv(
            output_path,
            index=False,
            encoding="utf-8-sig",
        )

        print(
            f"Created PENDING records: {len(outcomes):,}"
        )

    print("\nVERIFICATION OUTCOME FILE")
    print("-------------------------")
    print(f"Output: {output_path}")

    print("\nStatus:")
    print(
        outcomes["verification_status"]
        .value_counts(dropna=False)
    )

    print("\nImportant:")
    print(
        "Verification outcomes must come from actual "
        "authorized verification. Do not use risk labels "
        "as ground-truth ML labels."
    )


if __name__ == "__main__":
    main()