# Repo Scaffold Prompt — SIH26102 (Team Aqua)

> Paste this whole prompt into Claude Code (or another agentic coding tool) at the root
> of an empty repo. It will generate the initial monorepo structure, boilerplate, and
> a shared contract so three people can build `frontend/`, `backend/`, and `ai-ml/` in
> parallel without blocking on each other.

---

## Context for the agent

We are building a submission for **SIH 2026, Problem Statement SIH26102**:
**"AI-powered anomaly, fraud, and inefficiency detection in MPLAD Scheme implementation"**
(Ministry of Statistics and Programme Implementation / DIID, **Smart Automation** theme).

The system is a **decision-support tool for auditors and scheme administrators** —
it flags anomalies, fraud risk, and implementation inefficiencies in MPLAD (Member of
Parliament Local Area Development) fund utilization. It is explicitly **not** an
accusation engine — all flags are probabilistic, explainable, and reviewable by a human.

Four dashboard roles, each with different data visibility and permissions:
- **MP** — view own constituency's projects/funds only
- **State Nodal Authority** — view all constituencies in their state
- **District Authority** — view projects in their district
- **Ministry** — full visibility, cross-state analytics

Hard domain rule to encode everywhere (validation, tests, docs): **MPLAD projects have
a 1-year completion deadline from sanction date** — this is a scheme rule, not a
tunable parameter. The system must do **predictive** flagging (forecast likely deadline
breaches before they happen) in addition to retrospective anomaly detection — retrospective-only
flagging is a competitive weak point to avoid.

We are reusing proven patterns from a prior project (AquaPulse):
JWT + RBAC enforcement, hash-chained tamper-evident audit trails, and a
**hybrid AI approach** — a transparent rule engine + ML model combo, never a black-box
model alone, framed honestly as "hybrid, not pure AI" in all docs/demos.

MVP scope (must-have for demo): **Rule Engine + Isolation Forest** anomaly detection.
Stretch scope (only if time remains): XGBoost + SHAP explainability, GIS map view.

---

## Goal

Generate an initial **monorepo** with three independently-buildable folders
(`frontend/`, `backend/`, `ai-ml/`) plus a `contracts/` folder that all three
depend on. Structure it so each of the 3 team members can `cd` into their folder,
run one setup command, and start building immediately — including before the other
two folders have any real implementation, by coding against `contracts/` and mock data.

---

## 1. Top-level structure to create

```
sih26102-mplad-aqua/
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── contracts/
│   ├── openapi.yaml
│   ├── schemas/
│   │   ├── project.schema.json
│   │   ├── flag.schema.json
│   │   ├── user_role.schema.json
│   │   └── audit_event.schema.json
│   ├── enums.md
│   └── sample-data/
│       ├── sample_projects.json
│       ├── sample_flags.json
│       └── sample_users.json
├── backend/
│   ├── README.md
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py         # JWT issue/verify
│   │   │   └── rbac.py             # role → permission mapping (4 roles above)
│   │   ├── models/
│   │   │   ├── project.py
│   │   │   ├── flag.py
│   │   │   ├── user.py
│   │   │   └── audit_event.py      # hash-chained audit log model
│   │   ├── api/
│   │   │   ├── routes_projects.py
│   │   │   ├── routes_flags.py
│   │   │   ├── routes_auth.py
│   │   │   └── routes_dashboard.py # role-scoped views for the 4 roles
│   │   ├── services/
│   │   │   ├── audit_service.py    # append-only, hash-chained writes
│   │   │   └── ml_client.py        # calls into ai-ml service (HTTP or in-process)
│   │   └── db/
│   │       ├── session.py
│   │       └── migrations/         # alembic
│   └── tests/
├── ai-ml/
│   ├── README.md
│   ├── requirements.txt
│   ├── data/
│   │   ├── synthetic_data_generator.py   # generates realistic fake MPLAD records
│   │   └── raw/                          # (gitignored — real data if/when available)
│   ├── rule_engine/
│   │   ├── rules.py                # explicit, named, explainable rules
│   │   └── rules_config.yaml       # thresholds as config, not hardcoded
│   ├── models/
│   │   ├── isolation_forest_model.py   # MVP anomaly model
│   │   ├── deadline_forecaster.py      # predictive: forecasts deadline breach risk
│   │   └── stretch/
│   │       ├── xgboost_model.py
│   │       └── shap_explainer.py
│   ├── pipeline/
│   │   ├── feature_engineering.py
│   │   ├── train.py
│   │   └── predict.py              # single entrypoint the backend calls
│   ├── service/
│   │   └── ml_api.py               # thin FastAPI wrapper exposing predict() over HTTP
│   └── notebooks/
│       └── exploration.ipynb
├── frontend/
│   ├── README.md
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── api/
│   │   │   ├── client.ts           # typed client generated/hand-written from openapi.yaml
│   │   │   └── mockData.ts         # imports contracts/sample-data for offline dev
│   │   ├── auth/
│   │   │   └── roleContext.tsx     # 4-role-aware auth context
│   │   ├── dashboards/
│   │   │   ├── MPDashboard.tsx
│   │   │   ├── StateNodalDashboard.tsx
│   │   │   ├── DistrictDashboard.tsx
│   │   │   └── MinistryDashboard.tsx
│   │   ├── components/
│   │   │   ├── FlagCard.tsx        # shows anomaly + plain-language reason (honest framing)
│   │   │   ├── DeadlineForecastBadge.tsx
│   │   │   └── AuditTrailViewer.tsx
│   │   └── pages/
│   └── public/
└── docs/
    ├── architecture.md
    ├── demo-script.md             # incl. planned "live constraint-break" demo moment
    └── mock-judge-qa.md
```

---

## 2. What goes in `contracts/` (build this FIRST, before anything else)

This is the single most important folder for parallel work. It must be created and
committed before the three members split off, so nobody guesses at field names.

- `openapi.yaml` — every REST endpoint the backend will expose, including
  `/projects`, `/flags`, `/dashboard/{role}`, `/auth/login`, `/audit-trail`.
- JSON Schemas for `Project`, `Flag` (anomaly/fraud flag with confidence score +
  human-readable reason + rule-vs-ML origin tag), `UserRole`, `AuditEvent`.
- `enums.md` — canonical values for role names, flag severity, flag type
  (rule-based vs. ML-based vs. hybrid), project status.
- `sample-data/` — realistic **synthetic** MPLAD project records (never real MP/constituency
  data) that the frontend and ai-ml folders can develop against immediately.

**Instruct the agent:** generate `contracts/` fully, including realistic synthetic
sample data (20–30 fake projects across multiple states/constituencies, with a mix
of normal, delayed, and anomalous records) before scaffolding the other three folders.

---

## 3. Team split & ownership (for the README)

- **Member A — Backend**: FastAPI app, JWT/RBAC, audit trail (hash-chained), DB models
  and migrations, wires up calls to the ai-ml service.
- **Member B — AI/ML**: rule engine + Isolation Forest MVP, deadline forecaster,
  synthetic data generator, exposes `predict()` via a thin internal API so backend
  can call it without knowing model internals.
- **Member C — Frontend**: 4 role-scoped dashboards, builds entirely against
  `contracts/` + `contracts/sample-data/` mock client until backend endpoints are live,
  then swaps `mockData.ts` for `client.ts`.

Each folder gets its own `README.md` with: setup command, how to run just that folder
standalone, and how it depends on `contracts/`.

---

## 4. Non-negotiable framing constraints (bake into code comments + docs/architecture.md)

- Every flag object must carry a plain-language `reason` string — no bare confidence
  scores with no explanation (this is the "hybrid, honest AI" differentiator).
- Rule engine and ML model outputs must be visibly tagged by origin (`rule` / `ml` /
  `hybrid`) wherever flags are displayed or logged.
- The 1-year completion deadline is a named constant/config value referenced from one
  place (`rules_config.yaml`), not hardcoded in multiple files.
- Audit trail writes must be append-only and hash-chained (reuse the AquaPulse pattern).
- No real MP names, constituencies, or fund figures anywhere in seed/sample/test data —
  synthetic only, clearly labeled as such in code and demo docs.

---

## 5. First commands each member should be able to run standalone

```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# AI/ML
cd ai-ml && pip install -r requirements.txt && python data/synthetic_data_generator.py && python pipeline/train.py

# Frontend
cd frontend && npm install && npm run dev
```

---

## 6. Ask the agent to also generate

- `docker-compose.yml` wiring backend + ai-ml service + Postgres together for
  integration testing once individual pieces are ready.
- A root `README.md` explaining the 3-folder split, the contracts-first workflow,
  and a short project summary (for judges/onboarding).
- `.env.example` covering DB URL, JWT secret, ai-ml service URL.

---

*End of prompt.*