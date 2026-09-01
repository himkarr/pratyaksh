import json
from fastapi import APIRouter, Depends, HTTPException
from ..core.config import CONTRACTS
from ..core.rbac import current_user, scope_projects
from ..services.audit_service import append

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
@router.get("/{role}")
def dashboard(role: str, user: dict = Depends(current_user)):
    if role != user["role"]: raise HTTPException(403, "Dashboard role must match token role")
    projects = scope_projects(json.loads((CONTRACTS / "sample-data/sample_projects.json").read_text()), user)
    flags = json.loads((CONTRACTS / "sample-data/sample_flags.json").read_text())
    flags = [flag for flag in flags if flag["project_id"] in {p["id"] for p in projects}]
    append(user["sub"], "dashboard.view", "dashboard", role)
    return {"role": role, "projects": projects, "flags": flags, "summary": {"project_count": len(projects), "flag_count": len(flags)}}
