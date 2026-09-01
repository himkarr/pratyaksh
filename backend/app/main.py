from fastapi import FastAPI, Depends
from .api import routes_auth, routes_projects, routes_flags, routes_dashboard
from .core.rbac import require
from .services.audit_service import events

app = FastAPI(title="MPLAD Aqua API", description="Hybrid anomaly review support using synthetic data only.")
app.include_router(routes_auth.router); app.include_router(routes_projects.router); app.include_router(routes_flags.router); app.include_router(routes_dashboard.router)
@app.get("/health")
def health(): return {"status": "ok"}
@app.get("/audit-trail")
def audit_trail(_: dict = Depends(require("audit:read"))): return events
