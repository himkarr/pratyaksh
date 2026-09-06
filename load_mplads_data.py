"""Idempotently import official MPLADS works into the Supabase application schema.

Set DATABASE_URL explicitly; no credential is stored in this script.

    DATABASE_URL='postgresql+psycopg://...' python3 load_mplads_data.py --limit 100
    DATABASE_URL='postgresql+psycopg://...' python3 load_mplads_data.py

It intentionally skips source records without a recommendation date/amount,
because the database requires a recommendation for every project. It does not
turn vendor names into procurement records: the source has no item, quantity,
or unit-price data.
"""
import argparse
import os
import uuid
from datetime import timedelta

import pandas as pd
from sqlalchemy import MetaData, Table, bindparam, create_engine, select
from sqlalchemy.dialects.postgresql import insert

CSV_PATH = "mplads_master_project_dataset.csv"
NAMESPACE = uuid.UUID("e62ce09b-0a70-4e1a-aa3f-215d0c4c9472")
STATUS_MAP = {"Time Estimation": "Proposed", "Sanction": "Sanctioned", "Vendor Identification": "Sanctioned", "Physical Inspection": "InProgress", "Work partially Completed": "InProgress", "Work Completed": "Completed"}
PROGRESS_MAP = {"Proposed": 0, "Sanctioned": 15, "InProgress": 60, "Completed": 100}


def stable_id(kind, value):
    return uuid.uuid5(NAMESPACE, f"{kind}:{value.strip()}")


def clean_text(value, fallback=None):
    if pd.isna(value):
        return fallback
    value = str(value).strip()
    return value or fallback


def limited_text(value, limit, fallback=None):
    value = clean_text(value, fallback)
    return value[:limit] if value else value


def clean_number(value, default=0):
    value = pd.to_numeric(value, errors="coerce")
    return default if pd.isna(value) else float(value)


def clean_date(value):
    value = pd.to_datetime(value, errors="coerce")
    return None if pd.isna(value) else value.date()


def insert_ignore(connection, table, rows, batch_size=1000):
    """Primary-key upserts make interrupted imports safe to resume."""
    for start in range(0, len(rows), batch_size):
        batch = rows[start:start + batch_size]
        if batch:
            connection.execute(insert(table).values(batch).on_conflict_do_nothing())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="import the first N eligible source rows")
    parser.add_argument("--offset", type=int, default=0, help="skip this many eligible rows (for resumable batches)")
    parser.add_argument("--year", type=int, help="keep eligible rows whose latest source date falls in this year")
    parser.add_argument("--latest", action="store_true", help="sort filtered rows by latest source date, newest first")
    parser.add_argument("--csv", default=CSV_PATH)
    args = parser.parse_args()
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL is required; do not store database credentials in source code.")

    df = pd.read_csv(args.csv, low_memory=False)
    required = {"work_id", "mp", "state", "ida", "sanction_date", "sanction_amount", "recommended_date", "recommended_amount"}
    missing = required - set(df.columns)
    if missing:
        raise SystemExit(f"CSV is missing required columns: {', '.join(sorted(missing))}")
    valid = df[df.recommended_date.notna() & df.recommended_amount.notna()].copy()
    date_columns = [column for column in ("recommended_date", "sanction_date", "first_expenditure_date", "last_expenditure_date", "completion_date") if column in valid]
    parsed_dates = valid[date_columns].apply(pd.to_datetime, errors="coerce")
    valid["_latest_source_date"] = parsed_dates.max(axis=1)
    if args.year:
        valid = valid[valid["_latest_source_date"].dt.year == args.year].copy()
    if args.latest:
        valid = valid.sort_values(["_latest_source_date", "work_id"], ascending=[False, False])
    total_eligible = len(valid)
    if args.limit:
        valid = valid.iloc[args.offset:args.offset + args.limit].copy()
    elif args.offset:
        valid = valid.iloc[args.offset:].copy()
    print(f"Source rows: {len(df):,}; importing: {len(valid):,} (eligible offset {args.offset:,} of {total_eligible:,}); skipped without recommendation/filter: {len(df) - total_eligible:,}")

    engine = create_engine(database_url, pool_pre_ping=True, connect_args={"prepare_threshold": None})
    metadata = MetaData()
    tables = {name: Table(name, metadata, autoload_with=engine) for name in ("roles", "users", "mp_constituency_mapping", "implementing_agencies", "recommendations", "projects", "project_financials")}
    with engine.connect() as connection:
        role_ids = dict(connection.execute(select(tables["roles"].c.role_name, tables["roles"].c.role_id)).all())
    if "MPUser" not in role_ids:
        raise SystemExit("Supabase roles table does not contain MPUser.")

    mp_rows, mapping_rows, agency_rows, rec_rows, project_rows, financial_rows = [], [], [], [], [], []
    seen_mps, seen_mappings, seen_agencies = set(), set(), set()
    for _, source in valid.iterrows():
        work_id = clean_text(source.work_id)
        mp_name, state, agency_name = limited_text(source.mp, 255), limited_text(source.state, 100), limited_text(source.ida, 255)
        mp_id, agency_id = stable_id("mp", f"{mp_name}|{state}"), stable_id("agency", agency_name)
        constituency = limited_text(source.get("constituency"), 255)
        mapping_id = stable_id("constituency", f"{mp_id}|{constituency}") if constituency else None
        project_id, recommendation_id = stable_id("project", work_id), stable_id("recommendation", work_id)
        if mp_id not in seen_mps:
            seen_mps.add(mp_id)
            mp_rows.append({"user_id": mp_id, "name": mp_name, "email": f"mplads-mp-{mp_id.hex[:24]}@import.invalid", "password_hash": "!imported-public-record-not-a-login!", "role_id": role_ids["MPUser"], "status": "active", "state": state, "aadhaar_verified": False})
        if mapping_id and mapping_id not in seen_mappings:
            seen_mappings.add(mapping_id)
            mapping_rows.append({"mapping_id": mapping_id, "mp_id": mp_id, "constituency_name": constituency, "state": state})
        if agency_id not in seen_agencies:
            seen_agencies.add(agency_id)
            agency_rows.append({"agency_id": agency_id, "agency_name": agency_name, "agency_type": "GovtDept", "verified_by_admin": True})
        recommended_date, sanction_date = clean_date(source.recommended_date), clean_date(source.sanction_date)
        sanctioned, utilized = clean_number(source.sanction_amount), clean_number(source.get("expenditure_total"))
        status = STATUS_MAP.get(clean_text(source.get("work_status")), "Proposed")
        rec_rows.append({"recommendation_id": recommendation_id, "mp_id": mp_id, "recommended_amount": clean_number(source.recommended_amount), "recommendation_date": recommended_date, "status": "Accepted"})
        description = limited_text(source.get("work_description"), 250)
        project_rows.append({"project_id": project_id, "project_name": limited_text(source.get("work_description"), 250, work_id), "description": description, "category": limited_text(source.get("work_category"), 100, "Uncategorised"), "recommendation_id": recommendation_id, "mp_id": mp_id, "constituency_id": mapping_id, "sanctioned_amount": sanctioned, "released_amount": sanctioned, "utilized_amount": utilized, "implementing_agency_id": agency_id, "status": status, "progress_percentage": PROGRESS_MAP[status], "district": limited_text(constituency or agency_name, 100), "state": state, "start_date": clean_date(source.get("first_expenditure_date")) or sanction_date, "expected_completion_date": sanction_date + timedelta(days=365), "actual_completion_date": clean_date(source.get("completion_date")), "is_flagged": False, "latest_risk_score": 0})
        financial_rows.append({"financial_id": stable_id("financial", work_id), "project_id": project_id, "installment_no": 1, "amount_released": sanctioned, "release_date": sanction_date, "amount_utilized": utilized, "utilization_date": clean_date(source.get("last_expenditure_date")), "balance": sanctioned - utilized, "remarks": "Imported from official MPLADS public works dataset."})

    # recommendations.project_id and projects.recommendation_id are circular FKs.
    with engine.begin() as connection:
        insert_ignore(connection, tables["users"], mp_rows)
        insert_ignore(connection, tables["mp_constituency_mapping"], mapping_rows)
        insert_ignore(connection, tables["implementing_agencies"], agency_rows)
        insert_ignore(connection, tables["recommendations"], rec_rows)
        insert_ignore(connection, tables["projects"], project_rows)
        insert_ignore(connection, tables["project_financials"], financial_rows)
        update = tables["recommendations"].update().where(tables["recommendations"].c.recommendation_id == bindparam("rid")).values(project_id=bindparam("pid"))
        connection.execute(update, [{"rid": row["recommendation_id"], "pid": stable_id("project", clean_text(source.work_id))} for row, (_, source) in zip(rec_rows, valid.iterrows())])
    print(f"Import complete: {len(project_rows):,} projects. Re-running this command is safe.")


if __name__ == "__main__":
    main()
