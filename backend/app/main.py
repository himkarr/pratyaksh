from fastapi import FastAPI, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from .api import routes_auth,routes_projects,routes_flags,routes_dashboard
from .core.rbac import require
from .db.session import get_db
from .db.seed import seed
from .models.audit_event import AuditEvent
from .services.audit_service import verify_chain
app=FastAPI(title="MPLAD Aqua API",description="Synthetic-data hybrid review support; flags are not accusations.")
app.include_router(routes_auth.router); app.include_router(routes_projects.router); app.include_router(routes_flags.router); app.include_router(routes_dashboard.router)
@app.on_event("startup")
def startup(): seed()
@app.get("/health")
def health(): return {"status":"ok"}
@app.get("/audit-trail")
def audit_trail(_=Depends(require("audit:read")),db:Session=Depends(get_db)):
    return [{"id":e.id,"actor_id":e.actor_id,"action":e.action,"entity_type":e.entity_type,"entity_id":e.entity_id,"created_at":e.created_at.isoformat(),"previous_hash":e.prev_hash,"event_hash":e.this_hash} for e in db.scalars(select(AuditEvent).order_by(AuditEvent.created_at)).all()]
@app.get("/audit-trail/verify")
def verify(_=Depends(require("audit:read")),db:Session=Depends(get_db)): return verify_chain(db)
