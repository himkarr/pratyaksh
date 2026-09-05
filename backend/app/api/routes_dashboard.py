"""Role-scoped dashboard backed by production tables."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..models import Project, User
from ..core.rbac import get_current_user, filter_projects_by_role
from ..services.audit_service import record_audit_event
from .routes_flags import collect_flags

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Accept both scaffold short names and production DB role names.
ROLE_ALIASES = {
    "mp": "MPUser",
    "mpuser": "MPUser",
    "district": "DistrictAuthority",
    "districtauthority": "DistrictAuthority",
    "state_nodal": "StateNodalAuthority",
    "statenodal": "StateNodalAuthority",
    "statenodalauthority": "StateNodalAuthority",
    "ministry": "MinistryUser",
    "ministryuser": "MinistryUser",
    "admin": "Admin",
    "field": "FieldOfficer",
    "fieldofficer": "FieldOfficer",
    "vendor": "Vendor",
    "citizen": "Citizen",
}


def serialize_project(p: Project) -> dict:
    return {
        "project_id": str(p.project_id),
        "project_name": p.project_name,
        "category": p.category,
        "status": p.status,
        "district": p.district,
        "state": p.state,
        "sanctioned_amount": float(p.sanctioned_amount) if p.sanctioned_amount is not None else 0.0,
        "progress_percentage": p.progress_percentage,
        "is_flagged": p.is_flagged,
        "latest_risk_score": float(p.latest_risk_score) if p.latest_risk_score is not None else 0.0,
    }


def serialize(f: dict) -> dict:
    """Dashboard-level project serializer (kept for backwards compat imports)."""
    if isinstance(f, dict):
        return f
    return serialize_project(f)


@router.get("/{role}")
def dashboard(
    role: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_role = current_user.role.role_name
    requested = ROLE_ALIASES.get(role.strip().lower(), role)

    # Users may only view their own role dashboard (Admin/MinistryUser may view any).
    if requested != user_role and user_role not in ("Admin", "MinistryUser"):
        raise HTTPException(
            status_code=403,
            detail="Dashboard role must match token role",
        )

    scoped_projects = db.execute(
        filter_projects_by_role(select(Project), current_user, db)
    ).scalars().all()
    project_ids = [p.project_id for p in scoped_projects]
    flags = collect_flags(project_ids, db)

    record_audit_event(
        db=db,
        action="DASHBOARD_VIEWED",
        entity_type="dashboard",
        entity_id=None,
        user_id=current_user.user_id,
        new_value={"role": requested},
    )

    projects_json = [serialize_project(p) for p in scoped_projects]
    return {
        "role": requested,
        "projects": projects_json,
        "flags": flags,
        "summary": {
            "project_count": len(projects_json),
            "flag_count": len(flags),
        },
    }
