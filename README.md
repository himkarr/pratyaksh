# SIH26102 — MPLAD Aqua

MPLAD Aqua is an explainable, hybrid decision-support MVP for anomaly, fraud-risk, and implementation-inefficiency signals in MPLAD project execution. It is **not an accusation engine**: every flag has a reviewable reason, confidence score, and `rule` / `ml` / `hybrid` origin tag. All included records are clearly labeled synthetic.

## Contracts-first workflow

`contracts/` is the shared source of truth: OpenAPI, JSON schemas, canonical enums, and synthetic samples. Team members can work independently against it before services are connected.

| Owner | Folder | Responsibility |
| --- | --- | --- |
| Member A | `backend/` | FastAPI, JWT/RBAC, hash-chained audit log, integration client |
| Member B | `ai-ml/` | Rules + Isolation Forest MVP, predictive deadline forecaster, ML API |
| Member C | `frontend/` | Four role-scoped dashboards and contract-backed mock development |

The MPLAD one-year completion deadline is a non-tunable scheme rule stored once in `ai-ml/rule_engine/rules_config.yaml`. It is used for predictive as well as retrospective flagging.

## Run independently

```bash
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
cd ai-ml && pip install -r requirements.txt && python data/synthetic_data_generator.py && python pipeline/train.py
cd frontend && npm install && npm run dev
```

For integration, copy `.env.example` to `.env` and run `docker compose up --build`.
