# Repo Bootstrap Prompt (Phase 2) — SIH26102 (Team Aqua)

> Run this AFTER the Phase 1 scaffold prompt has been applied and the folder structure
> exists. This prompt turns the empty skeleton into a **working, end-to-end, seeded
> demo** — so each of the 3 members opens their folder to functioning code on day one,
> and spends their time on core differentiators instead of plumbing.
>
> Goal after this prompt: `docker-compose up` brings up Postgres + backend + ai-ml
> service + frontend, and the frontend already shows realistic (synthetic) flagged
> MPLAD projects across all 4 role dashboards, with a real JWT login and a real
> audit trail — before anyone has written a single custom rule or model tweak.

---

## Context reminder for the agent

Same project as before: SIH26102, MPLAD anomaly/fraud/inefficiency detection,
4 roles (MP / State Nodal Authority / District Authority / Ministry), hybrid
rule+ML approach, 1-year deadline rule, predictive + retrospective flagging,
hash-chained audit trail, synthetic data only (never real MP/constituency data).

---

## 1. `ai-ml/` — make it produce real output, not stub functions

- **`data/synthetic_data_generator.py`**: fully implement. Generate ~150–300 synthetic
  MPLAD project records across ~10 fake constituencies / 5 fake states, with realistic
  fields (sanction date, fund allocated, fund utilized, % complete, category, vendor
  count, last-updated date). Deliberately inject a labeled mix of:
  - normal on-track projects (~70%)
  - projects likely to breach the 1-year deadline (~15%) — for the forecaster to learn
  - flagrant anomalies (~10%) — fund utilized > 100%, sudden spend spikes, duplicate
    vendor payments, project marked complete with 0% fund utilization, etc.
  - borderline/ambiguous cases (~5%) — deliberately hard, for honest-limitation framing
    in the demo ("here's a case our model is unsure about, and here's why")
  Save output to `data/raw/synthetic_projects.csv` and also emit it in the shape defined
  by `contracts/schemas/project.schema.json` so it matches the API contract exactly.

- **`rule_engine/rules.py` + `rules_config.yaml`**: implement 4–6 real, named,
  explainable rules, e.g. `fund_utilization_mismatch`, `deadline_breach_risk`,
  `spend_spike_after_inactivity`, `completion_without_utilization`,
  `duplicate_vendor_payment`. Each rule returns a structured result: triggered
  (bool), severity, and a plain-language reason string. Thresholds live in the
  YAML config, not hardcoded.

- **`models/isolation_forest_model.py`**: full working train/predict cycle against
  the synthetic data — feature engineering (fund utilization %, days elapsed vs.
  deadline, spend velocity, vendor concentration), train an Isolation Forest, save
  the fitted model artifact to `ai-ml/artifacts/isolation_forest.joblib`.

- **`models/deadline_forecaster.py`**: a real (even if simple — logistic regression
  or gradient boosting) baseline model predicting probability of deadline breach
  given elapsed time and utilization trajectory. This is the "predictive, not just
  retrospective" differentiator — make sure it actually runs and outputs a probability.

- **`pipeline/predict.py`**: single function `predict(project) -> List[Flag]` that
  runs the rule engine AND both models, merges results into `Flag` objects matching
  `contracts/schemas/flag.schema.json` exactly (including the `origin` tag: `rule`
  / `isolation_forest` / `deadline_forecaster`, and a human-readable `reason`).

- **`service/ml_api.py`**: wrap `predict()` in a minimal FastAPI app with one
  working `POST /predict` endpoint and a `/health` endpoint. This is what the
  backend will call.

- Add `ai-ml/tests/test_rules.py` and `test_predict.py` with real pytest cases
  (feed known anomalous and known normal synthetic records, assert expected flags).

- Add `ai-ml/Dockerfile`.

---

## 2. `backend/` — make auth, RBAC, DB, and audit trail actually work

- **DB models + Alembic**: implement `Project`, `Flag`, `User`, `AuditEvent` models
  fully (not stubs), generate an initial Alembic migration, and add a
  `backend/app/db/seed.py` script that loads `contracts/sample-data/` (or the ai-ml
  synthetic output) into Postgres on first run.

- **`core/security.py`**: real JWT issue/verify with password hashing (passlib/bcrypt).
  Seed 4 demo users, one per role, with known demo credentials documented in
  `backend/README.md` (e.g. `mp_demo@aqua.test` / `demo1234`) — needed for a fast,
  reliable live demo.

- **`core/rbac.py`**: a real dependency/decorator that restricts each endpoint by
  role and, for MP/State/District roles, filters query results to only their
  constituency/state/district scope. Ministry role sees everything.

- **`services/audit_service.py`**: implement the actual hash chain — each
  `AuditEvent` row stores `prev_hash` and `this_hash = hash(payload + prev_hash)`,
  append-only, with a verification function `verify_chain()` that walks the chain
  and detects tampering. This should be genuinely runnable and testable, since
  "tamper-evident audit trail" is a claim you'll be asked to prove live to judges.

- **`services/ml_client.py`**: real HTTP client calling the `ai-ml` service's
  `/predict` endpoint (with a graceful fallback/mock mode if the ai-ml service is
  down, so backend dev isn't blocked if ai-ml isn't running yet).

- **`api/routes_*.py`**: implement real CRUD + list/filter endpoints for projects
  and flags, and the role-scoped `/dashboard/{role}` endpoint, matching
  `contracts/openapi.yaml` exactly.

- **`backend/tests/`**: pytest + httpx test client covering: login, RBAC scoping
  (a District user cannot see another district's projects), and audit chain
  verification.

- Add `backend/Dockerfile` and wire `alembic upgrade head && python -m app.db.seed`
  into the container startup for a one-command working demo DB.

---

## 3. `frontend/` — make it render something real, not empty pages

- **`api/mockData.ts`**: import directly from `contracts/sample-data/` so the
  frontend looks fully populated even with zero backend calls, until `client.ts`
  is swapped in.

- **`api/client.ts`**: a typed client (hand-written or generated via
  `openapi-typescript` from `contracts/openapi.yaml`) with a single flag
  (env var) to toggle between mock data and the live backend.

- **`auth/roleContext.tsx`**: working login flow against `/auth/login`, JWT stored
  in memory (not localStorage), plus a **role-switcher dropdown for demo purposes**
  so judges/teammates can flip between the 4 dashboards instantly without 4 logins.

- **Dashboards**: each of the 4 dashboard pages should render, from mock or live
  data: a project list/table, a flag count summary, and at least one chart
  (e.g. flags-by-severity bar chart, deadline-breach-risk distribution) — use
  Recharts or similar, already wired up, not placeholder `<div>TODO</div>`.

- **`components/FlagCard.tsx`**: renders severity, the plain-language reason, and
  a visible badge for `origin` (rule / ML / hybrid) — this directly supports the
  honest-AI-framing pitch, make sure the badge is visually prominent.

- **`components/AuditTrailViewer.tsx`**: renders a project's audit event chain and
  has a "Verify integrity" button that calls the backend's `verify_chain()` — this
  becomes the "live constraint-break" demo moment (tamper with a record, show the
  chain breaks, show it's detected).

- **`components/DeadlineForecastBadge.tsx`**: renders the forecaster's breach
  probability as a simple risk meter (low/medium/high), with the underlying
  probability number visible on hover for credibility.

- Add `frontend/Dockerfile` and basic Vitest tests for `FlagCard` and `roleContext`.

---

## 4. Cross-cutting — wire it all together

- **`docker-compose.yml`**: bring up Postgres, run backend migrations + seed,
  start the ai-ml service, start the backend, start the frontend — one command,
  fully working demo, no manual steps.

- **`.github/workflows/ci.yml`**: one workflow with 3 jobs (backend lint+test,
  ai-ml lint+test, frontend lint+test), triggered on PR, so bad code can't merge
  silently — useful given 3 people committing in parallel.

- **`CODEOWNERS`**: map `/backend/` → Member A, `/ai-ml/` → Member B,
  `/frontend/` → Member C, `/contracts/` → all three (require 2 approvals on
  contract changes since it's the shared dependency).

- **Pre-commit hooks**: black + isort for Python folders, eslint + prettier for
  frontend, run via `pre-commit` so style nits don't eat review time.

- **`docs/demo-script.md`**: fill in a concrete run-of-show using the seeded demo
  data — including the exact "live constraint-break" moment (tamper with an audit
  record live, show detection) and one deliberately-ambiguous flagged case to
  demonstrate honest limitation framing ("the model isn't certain here, and here's
  why — that's the point of a hybrid system").

---

## 5. Definition of done for this pass

Running `docker-compose up` from a clean clone should result in:
- 4 working demo logins, one per role
- Dashboards populated with realistic synthetic flags, not empty states
- At least one flag per origin type (`rule`, `isolation_forest`, `deadline_forecaster`)
  visible somewhere in the seeded data, so all three subsystems are demonstrably live
- A working "Verify integrity" button that passes on unmodified data
- CI green on a fresh PR

Everything past this point (tuning rules, improving model accuracy, refining UI,
stretch features like SHAP/GIS) is now each member's own focused work inside their
folder — no one is blocked waiting on someone else's stub.

*End of prompt.*