import json
from fastapi import APIRouter, Depends
from ..core.config import CONTRACTS
from ..core.rbac import require, scope_projects

router = APIRouter(prefix="/flags", tags=["flags"])
@router.get("")
def list_flags(user: dict = Depends(require("flags:read"))):
    projects = json.loads((CONTRACTS / "sample-data/sample_projects.json").read_text())
    allowed = {p["id"] for p in scope_projects(projects, user)}
    flags = json.loads((CONTRACTS / "sample-data/sample_flags.json").read_text())
    return [flag for flag in flags if flag["project_id"] in allowed]
