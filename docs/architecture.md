# Architecture

MPLAD Aqua is a decision-support MVP for auditors and scheme administrators. It operates only on clearly labeled synthetic sample data in this scaffold. A flag is a probabilistic, explainable review signal—not an allegation of fraud.

`frontend` consumes the OpenAPI contract and can run against mock data. `backend` enforces JWT-based RBAC and scopes data to MP, State Nodal Authority, District Authority, or Ministry. It writes audit actions as an append-only hash chain and calls `ai-ml` over its internal HTTP API.

The AI/ML component is deliberately hybrid, not pure AI: named transparent rules run alongside an Isolation Forest. Every result has a plain-language reason and `rule`, `ml`, or `hybrid` origin tag. The mandatory MPLAD one-year completion deadline is defined once in `ai-ml/rule_engine/rules_config.yaml` as `completion_deadline_days: 365`; predictive forecasting surfaces likely breaches before the deadline as well as retrospective breaches.
