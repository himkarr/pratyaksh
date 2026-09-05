import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..db.session import get_db
from ..models import Project, User
from ..core.rbac import get_current_user, filter_projects_by_role, require_roles
from ..services.analysis_service import analyze_project

router = APIRouter(prefix="/analysis", tags=["AI & Rules Analysis"])

@router.post("/project/{project_id}")
def run_project_analysis(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manually or automatically runs the hybrid AI/ML & rule engine analysis
    on a specific project, writing to rule_engine_logs and risk_scores.
    """
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    try:
        result = analyze_project(db=db, project_id=p_uuid, actor_id=current_user.user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

@router.post("/run-all")
def run_batch_analysis(
    current_user: User = Depends(require_roles(["DistrictAuthority", "StateNodalAuthority", "MinistryUser", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Batch evaluates all projects within the user's role scope,
    updating risk scores and identifying flagged projects.
    """
    query = filter_projects_by_role(select(Project), current_user, db)
    projects = db.execute(query).scalars().all()

    results = []
    flagged_count = 0

    for p in projects:
        try:
            res = analyze_project(db=db, project_id=p.project_id, actor_id=current_user.user_id)
            results.append({
                "project_id": res["project_id"],
                "project_name": res["project_name"],
                "risk_score": res["risk_score"],
                "priority_level": res["priority_level"],
                "is_flagged": res["is_flagged"]
            })
            if res["is_flagged"]:
                flagged_count += 1
        except Exception:
            continue

    return {
        "total_analyzed": len(results),
        "flagged_count": flagged_count,
        "clean_count": len(results) - flagged_count,
        "projects": results
    }
