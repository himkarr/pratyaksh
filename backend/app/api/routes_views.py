import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func

from ..db.session import get_db
from ..models import (
    Project, Recommendation, User, Role, ProjectProcurementRecord,
    ProjectStatusHistory, ProjectMilestone, AgencyUser, ImplementingAgency
)
from ..core.rbac import get_current_user, require_roles, filter_projects_by_role

router = APIRouter(prefix="/views", tags=["Executive Dashboard SQL Views"])

# 1. vw_mp_recommendation_summary
@router.get("/mp/recommendation-summary")
def get_mp_recommendation_summary(
    current_user: User = Depends(require_roles(["MPUser", "Admin"])),
    db: Session = Depends(get_db)
):
    recs = db.execute(
        select(Recommendation).where(Recommendation.mp_id == current_user.user_id)
    ).scalars().all()

    statuses = {"Pending": 0, "Accepted": 0, "Rejected": 0, "Withdrawn": 0}
    total_recommended = 0.0

    for r in recs:
        s = r.status or "Pending"
        statuses[s] = statuses.get(s, 0) + 1
        total_recommended += float(r.recommended_amount or 0.0)

    return {
        "mp_id": str(current_user.user_id),
        "total_recommendations": len(recs),
        "total_recommended_amount": total_recommended,
        "status_counts": statuses
    }

# 2. vw_mp_project_status_summary
@router.get("/mp/status-summary")
def get_mp_status_summary(
    current_user: User = Depends(require_roles(["MPUser", "Admin"])),
    db: Session = Depends(get_db)
):
    projects = db.execute(
        select(Project).where(Project.mp_id == current_user.user_id)
    ).scalars().all()

    statuses = {"Proposed": 0, "Sanctioned": 0, "InProgress": 0, "Completed": 0, "Delayed": 0, "Cancelled": 0}
    sanctioned_sum = 0.0
    released_sum = 0.0
    utilized_sum = 0.0
    flagged_count = 0

    for p in projects:
        s = p.status or "Sanctioned"
        statuses[s] = statuses.get(s, 0) + 1
        sanctioned_sum += float(p.sanctioned_amount or 0.0)
        released_sum += float(p.released_amount or 0.0)
        utilized_sum += float(p.utilized_amount or 0.0)
        if p.is_flagged:
            flagged_count += 1

    return {
        "total_projects": len(projects),
        "flagged_projects": flagged_count,
        "financial_summary": {
            "total_sanctioned": sanctioned_sum,
            "total_released": released_sum,
            "total_utilized": utilized_sum,
            "utilization_rate_percentage": round((utilized_sum / sanctioned_sum * 100), 2) if sanctioned_sum > 0 else 0.0
        },
        "status_breakdown": statuses
    }

# 3. vw_mp_project_detail
@router.get("/mp/project-detail")
def get_mp_project_detail(
    current_user: User = Depends(require_roles(["MPUser", "Admin"])),
    db: Session = Depends(get_db)
):
    recs = db.execute(
        select(Recommendation).where(Recommendation.mp_id == current_user.user_id).order_by(Recommendation.recommendation_date.desc())
    ).scalars().all()

    output = []
    for r in recs:
        proj = None
        if r.project_id:
            proj = db.execute(select(Project).where(Project.project_id == r.project_id)).scalar_one_or_none()

        output.append({
            "recommendation_id": str(r.recommendation_id),
            "recommendation_status": r.status,
            "recommended_amount": float(r.recommended_amount or 0.0),
            "recommendation_date": r.recommendation_date.isoformat(),
            "project_id": str(proj.project_id) if proj else None,
            "project_name": proj.project_name if proj else None,
            "project_status": proj.status if proj else None,
            "progress_percentage": proj.progress_percentage if proj else 0,
            "is_flagged": proj.is_flagged if proj else False,
            "sanctioned_amount": float(proj.sanctioned_amount) if proj else None,
            "utilized_amount": float(proj.utilized_amount) if proj else None
        })
    return output

# 4. vw_state_district_summary
@router.get("/state/district-summary")
def get_state_district_summary(
    current_user: User = Depends(require_roles(["DistrictAuthority", "StateNodalAuthority", "MinistryUser", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    District-wise rollup within a state:
    Project counts by status, flagged count, sanctioned/utilized totals.
    """
    query = select(Project)
    if current_user.role.role_name == "StateNodalAuthority" and current_user.state:
        query = query.where(Project.state == current_user.state)

    projects = db.execute(query).scalars().all()

    district_map: Dict[str, Dict[str, Any]] = {}

    for p in projects:
        d = p.district or "Unassigned"
        if d not in district_map:
            district_map[d] = {
                "district": d,
                "state": p.state,
                "total_projects": 0,
                "flagged_projects": 0,
                "total_sanctioned": 0.0,
                "total_utilized": 0.0,
                "status_counts": {}
            }

        data = district_map[d]
        data["total_projects"] += 1
        if p.is_flagged:
            data["flagged_projects"] += 1
        data["total_sanctioned"] += float(p.sanctioned_amount or 0.0)
        data["total_utilized"] += float(p.utilized_amount or 0.0)
        st = p.status or "Sanctioned"
        data["status_counts"][st] = data["status_counts"].get(st, 0) + 1

    return list(district_map.values())

# 5. vw_state_flagged_projects
@router.get("/state/flagged-projects")
def get_state_flagged_projects(
    current_user: User = Depends(require_roles(["StateNodalAuthority", "MinistryUser", "Admin"])),
    db: Session = Depends(get_db)
):
    query = select(Project).where(Project.is_flagged == True).order_by(Project.latest_risk_score.desc())
    if current_user.role.role_name == "StateNodalAuthority" and current_user.state:
        query = query.where(Project.state == current_user.state)

    flagged = db.execute(query).scalars().all()

    return [
        {
            "project_id": str(p.project_id),
            "project_name": p.project_name,
            "district": p.district,
            "state": p.state,
            "status": p.status,
            "progress_percentage": p.progress_percentage,
            "sanctioned_amount": float(p.sanctioned_amount or 0.0),
            "utilized_amount": float(p.utilized_amount or 0.0),
            "risk_score": float(p.latest_risk_score or 0.0)
        }
        for p in flagged
    ]

# 6. vw_district_project_detail
@router.get("/district/project-detail")
def get_district_project_detail(
    current_user: User = Depends(require_roles(["DistrictAuthority", "Admin"])),
    db: Session = Depends(get_db)
):
    query = select(Project).order_by(Project.created_at.desc())
    if current_user.district:
        query = query.where(Project.district == current_user.district)

    projects = db.execute(query).scalars().all()
    output = []

    for p in projects:
        milestones = db.execute(select(ProjectMilestone).where(ProjectMilestone.project_id == p.project_id)).scalars().all()
        m_verified = sum(1 for m in milestones if m.verified)

        last_history = db.execute(
            select(ProjectStatusHistory).where(ProjectStatusHistory.project_id == p.project_id).order_by(ProjectStatusHistory.changed_at.desc())
        ).scalars().first()

        output.append({
            "project_id": str(p.project_id),
            "project_name": p.project_name,
            "status": p.status,
            "progress_percentage": p.progress_percentage,
            "is_flagged": p.is_flagged,
            "risk_score": float(p.latest_risk_score or 0.0),
            "total_milestones": len(milestones),
            "verified_milestones": m_verified,
            "latest_halt_reason": last_history.reason if last_history else None,
            "last_status_change": last_history.changed_at.isoformat() if last_history else None
        })
    return output

# 7. vw_public_projects
@router.get("/public/projects")
def get_public_projects_view(
    state: Optional[str] = None,
    district: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = select(Project).order_by(Project.created_at.desc())
    if state:
        query = query.where(Project.state == state)
    if district:
        query = query.where(Project.district == district)
    if category:
        query = query.where(Project.category == category)

    projects = db.execute(query.limit(limit).offset(offset)).scalars().all()

    return [
        {
            "project_id": str(p.project_id),
            "project_name": p.project_name,
            "category": p.category,
            "status": p.status,
            "progress_percentage": p.progress_percentage,
            "district": p.district,
            "state": p.state,
            "latitude": float(p.latitude) if p.latitude else None,
            "longitude": float(p.longitude) if p.longitude else None,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "expected_completion_date": p.expected_completion_date.isoformat() if p.expected_completion_date else None
        }
        for p in projects
    ]

# 8. vw_vendor_project_summary
@router.get("/vendor/project-summary")
def get_vendor_project_summary(
    current_user: User = Depends(require_roles(["Vendor", "Admin"])),
    db: Session = Depends(get_db)
):
    agency_link = db.execute(
        select(AgencyUser).where(AgencyUser.user_id == current_user.user_id)
    ).scalar_one_or_none()

    if not agency_link:
        return []

    projects = db.execute(
        select(Project).where(Project.implementing_agency_id == agency_link.agency_id)
    ).scalars().all()

    output = []
    for p in projects:
        last_history = db.execute(
            select(ProjectStatusHistory).where(ProjectStatusHistory.project_id == p.project_id).order_by(ProjectStatusHistory.changed_at.desc())
        ).scalars().first()

        output.append({
            "project_id": str(p.project_id),
            "project_name": p.project_name,
            "status": p.status,
            "progress_percentage": p.progress_percentage,
            "sanctioned_amount": float(p.sanctioned_amount or 0.0),
            "released_amount": float(p.released_amount or 0.0),
            "utilized_amount": float(p.utilized_amount or 0.0),
            "latest_halt_reason": last_history.reason if last_history else None
        })
    return output

# 9. vw_vendor_procurement_detail
@router.get("/vendor/procurement-detail")
def get_vendor_procurement_detail(
    current_user: User = Depends(require_roles(["Vendor", "Admin"])),
    db: Session = Depends(get_db)
):
    items = db.execute(
        select(ProjectProcurementRecord).where(
            ProjectProcurementRecord.vendor_user_id == current_user.user_id
        ).order_by(ProjectProcurementRecord.created_at.desc())
    ).scalars().all()

    output = []
    for i in items:
        proj = db.execute(select(Project).where(Project.project_id == i.project_id)).scalar_one_or_none()
        output.append({
            "procurement_id": str(i.procurement_id),
            "project_id": str(i.project_id),
            "project_name": proj.project_name if proj else "N/A",
            "item_name": i.item_name,
            "quantity": float(i.quantity),
            "unit": i.unit,
            "unit_price": float(i.unit_price),
            "total_amount": float(i.total_amount),
            "purchase_date": i.purchase_date.isoformat(),
            "remarks": i.remarks
        })
    return output
