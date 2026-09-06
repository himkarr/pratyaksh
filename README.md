# MPLAD Aqua — SIH26102

MPLAD Aqua is an explainable decision-support application for reviewing MPLADS works. It combines scheme-rule checks with an Isolation Forest anomaly signal. A flag is a **human-review priority**, not an accusation or a finding of fraud.

This guide is for the current non-Docker local setup. It uses the existing Supabase project and the small real-data sample already imported there.

## What runs locally

| Service | Address | Purpose |
| --- | --- | --- |
| ML service | `http://127.0.0.1:8001` | Isolation Forest inference |
| Backend API | `http://127.0.0.1:8000` | FastAPI, authentication, rules, Supabase access |
| Frontend | Vite address shown in terminal, normally `http://127.0.0.1:5173` | Web dashboards |

The database remains in Supabase. Do not run local PostgreSQL or Docker for this workflow.

## Prerequisites

- Python 3.11+ (use `python3`; some systems do not provide a `python` command)
- Node.js 18+ and npm
- A Supabase database that already contains this project's schema, roles, and demo users
- The local `.env` file containing the Supabase connection values. It is intentionally ignored by Git.

## 1. Prepare the Python environment

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
pip install -r backend/requirements.txt
pip install -r ai-ml/requirements.txt
```

Activate the virtual environment in every new terminal before starting a Python service:

```bash
source .venv/bin/activate
```

## 2. Load local environment variables

The root `.env` is local-only and must never be committed. The backend deliberately does not read it automatically, so export it in the shell that starts the backend:

```bash
set -a
source .env
set +a
export ML_SERVICE_URL=http://127.0.0.1:8001
```

Required variables are:

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
JWT_SECRET
ML_SERVICE_URL
```

Use `http://127.0.0.1:8001` for `ML_SERVICE_URL` when running without Docker. After credentials are rotated, update only `.env`, not source code.

## 3. Start the ML service

Open terminal 1:

```bash
source .venv/bin/activate
cd ai-ml
uvicorn service.ml_api:app --host 127.0.0.1 --port 8001 --reload
```

Confirm it is healthy:

```bash
curl http://127.0.0.1:8001/health
```

Expected result includes `"status":"ok"` and `"model_available":true`.

### Retrain the model (optional)

The checked-in model artifact is trained from the supplied public MPLADS CSV. Retrain only after replacing the dataset:

```bash
source .venv/bin/activate
cd ai-ml
python3 pipeline/train_real_data.py ../mplads_master_project_dataset.csv
```

This trains locally; it does not upload the CSV to Supabase.

## 4. Start the backend

Open terminal 2 at the repository root:

```bash
source .venv/bin/activate
set -a
source .env
set +a
export ML_SERVICE_URL=http://127.0.0.1:8001
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Check the API:

```bash
curl http://127.0.0.1:8000/health
```

Open API documentation at `http://127.0.0.1:8000/docs`.

The backend connects to Supabase through `DATABASE_URL`. It expects the application schema to already exist; it does not create the 29-table Supabase schema on startup.

## 5. Start the frontend

Open terminal 3:

```bash
cd frontend
npm install
VITE_API_URL=http://127.0.0.1:8000 VITE_ML_API_URL=http://127.0.0.1:8001 npm run dev
```

Open the address printed by Vite, normally `http://127.0.0.1:5173`.

For the demo-user list, call `GET http://127.0.0.1:8000/auth/demo-users`. Demo accounts use password `demo1234`.

## 6. Real-data sample in Supabase

The current Supabase instance contains the pre-existing demo records plus 100 imported public MPLADS works. The imported sample spans four states and five work statuses; this is deliberately small for demonstration.

Do not rerun the importer unless you want to add data. If needed, it is safe to rerun because IDs are deterministic:

```bash
source .venv/bin/activate
set -a
source .env
set +a
python3 load_mplads_data.py --limit 100
```

`load_mplads_data.py` needs `DATABASE_URL` and the master CSV in the repository root. It skips source records missing a recommendation date or amount because the database schema requires a recommendation for every project.

## Repository and data policy

- Commit `load_mplads_data.py` and `ai-ml/pipeline/train_real_data.py`: they are reproducible tooling and contain no secrets.
- Do **not** commit `.env`, Supabase keys, database passwords, or JWT secrets.
- Do **not** commit `mplads_master_project_dataset.csv`. It is ignored; retain it locally or in private storage along with its official source URL and checksum.
- The model artifact may be committed only through the repository's configured Git LFS workflow. Verify that it is a real binary, not an LFS pointer, after cloning.

## Known limitations

- The official source data has no GPS coordinates, tender IDs, item-level prices, or reliable vendor-procurement links. Map views, GeM comparisons, and collusion claims cannot be derived from it alone.
- The ML signal is statistical and must be reviewed alongside the displayed rule explanations.
- The legacy AI test `ai-ml/tests/test_predict.py` currently depends on a missing synthetic-data generator and needs repair before it can be used in CI.
- A fresh Supabase project needs an explicit schema/migration deployment before the backend can run against it.
