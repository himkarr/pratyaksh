from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..models.flag import Flag
from ..models.project import Project
from ..core.rbac import require,scoped
router=APIRouter(prefix="/flags",tags=["flags"])
def serialize(f): return {key:getattr(f,key).isoformat() if hasattr(getattr(f,key),"isoformat") else getattr(f,key) for key in ["id","project_id","category","severity","confidence","reason","origin","created_at"]}
@router.get("")
def list_flags(user=Depends(require("flags:read")),db:Session=Depends(get_db)):
    ids=[p.id for p in db.scalars(scoped(select(Project),Project,user)).all()]; return [serialize(f) for f in db.scalars(select(Flag).where(Flag.project_id.in_(ids))).all()]
