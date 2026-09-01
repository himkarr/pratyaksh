from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.project import Project
from ..core.rbac import require,scoped
router=APIRouter(prefix="/projects",tags=["projects"])
def serialize(p): return {key:getattr(p,key).isoformat() if hasattr(getattr(p,key),"isoformat") else getattr(p,key) for key in ["id","title","state","district","constituency_code","sanction_date","expected_completion_date","actual_completion_date","sanctioned_amount","utilized_amount","physical_progress_percent","status"]}
@router.get("")
def list_projects(user=Depends(require("projects:read")),db:Session=Depends(get_db)): return [serialize(p) for p in db.scalars(scoped(select(Project),Project,user)).all()]
