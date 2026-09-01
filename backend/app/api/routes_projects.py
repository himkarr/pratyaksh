import json
from fastapi import APIRouter, Depends
from ..core.config import CONTRACTS
from ..core.rbac import require, scope_projects

router = APIRouter(prefix="/projects", tags=["projects"])
@router.get("")
def list_projects(user: dict = Depends(require("projects:read"))):
    projects = json.loads((CONTRACTS / "sample-data/sample_projects.json").read_text())
    return scope_projects(projects, user)
