from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.project import Project
from ..models.flag import Flag
from ..core.rbac import current_user,scoped
from ..services.audit_service import append
from .routes_projects import serialize as project_json
from .routes_flags import serialize as flag_json
router=APIRouter(prefix="/dashboard",tags=["dashboard"])
@router.get("/{role}")
def dashboard(role:str,user=Depends(current_user),db:Session=Depends(get_db)):
    if role != user["role"]: raise HTTPException(403,"Dashboard role must match token role")
    projects=db.scalars(scoped(select(Project),Project,user)).all(); ids=[p.id for p in projects]; flags=db.scalars(select(Flag).where(Flag.project_id.in_(ids))).all(); append(db,user["sub"],"dashboard.view","dashboard",role)
    return {"role":role,"projects":[project_json(p) for p in projects],"flags":[flag_json(f) for f in flags],"summary":{"project_count":len(projects),"flag_count":len(flags)}}
