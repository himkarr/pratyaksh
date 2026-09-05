import uuid
from datetime import datetime, date, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func

from ..db.session import get_db
from ..models import (
    SCSTAllocationTracker, Recommendation, Project, User,
    ProhibitedCategory, Role
)
from ..core.rbac import get_current_user, require_roles

router = APIRouter(prefix="/compliance", tags=["Statutory Compliance"])

def get_current_financial_year() -> str:
    today = date.today()
    if today.month >= 4:
        return f"{today.year}-{today.year + 1}"
    else:
        return f"{today.year - 1}-{today.year}"

@router.get("/sc-st/{mp_id}")
def evaluate_mp_sc_st_compliance(
    mp_id: str,
    financial_year: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Evaluates whether an MP satisfies mandatory MPLADS statutory allocation:
    - Minimum 15% to Scheduled Caste (SC) inhabited areas.
    - Minimum 7.5% to Scheduled Tribe (ST) inhabited areas.
    """
    try:
        mp_uuid = uuid.UUID(mp_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid MP user ID format")

    mp = db.execute(select(User).where(User.user_id == mp_uuid)).scalar_one_or_none()
    if not mp:
        raise HTTPException(status_code=404, detail="MP user not found")

    fy = financial_year or get_current_financial_year()

    # Query all recommendations by this MP
    recs = db.execute(
        select(Recommendation).where(Recommendation.mp_id == mp_uuid)
    ).scalars().all()

    total_recommended = sum(float(r.recommended_amount or 0.0) for r in recs)

    # Calculate SC and ST allocations from linked projects
    sc_allocated = 0.0
    st_allocated = 0.0

    for r in recs:
        if r.project_id:
            proj = db.execute(select(Project).where(Project.project_id == r.project_id)).scalar_one_or_none()
            if proj and proj.sc_st_beneficiary_flag:
                # 2:1 standard split or full allocation to SC
                amt = float(r.recommended_amount or 0.0)
                sc_allocated += amt * 0.67
                st_allocated += amt * 0.33

    sc_percent = (sc_allocated / total_recommended * 100) if total_recommended > 0 else 0.0
    st_percent = (st_allocated / total_recommended * 100) if total_recommended > 0 else 0.0

    sc_compliant = sc_percent >= 15.0 or total_recommended == 0
    st_compliant = st_percent >= 7.5 or total_recommended == 0
    is_compliant = sc_compliant and st_compliant
    status_str = "Compliant" if is_compliant else "NonCompliant"

    # Persist or update tracker
    tracker = db.execute(
        select(SCSTAllocationTracker).where(
            and_(
                SCSTAllocationTracker.mp_id == mp_uuid,
                SCSTAllocationTracker.financial_year == fy
            )
        )
    ).scalar_one_or_none()

    if not tracker:
        tracker = SCSTAllocationTracker(
            tracker_id=uuid.uuid4(),
            mp_id=mp_uuid,
            financial_year=fy,
            total_recommended=total_recommended,
            sc_allocated=sc_allocated,
            st_allocated=st_allocated,
            compliance_status=status_str
        )
        db.add(tracker)
    else:
        tracker.total_recommended = total_recommended
        tracker.sc_allocated = sc_allocated
        tracker.st_allocated = st_allocated
        tracker.compliance_status = status_str

    db.commit()

    sc_target_amount = total_recommended * 0.15
    st_target_amount = total_recommended * 0.075

    return {
        "mp_id": str(mp.user_id),
        "mp_name": mp.name,
        "financial_year": fy,
        "total_recommended": total_recommended,
        "sc_allocation": {
            "allocated_amount": sc_allocated,
            "allocated_percentage": round(sc_percent, 2),
            "required_percentage": 15.0,
            "target_amount": sc_target_amount,
            "compliant": sc_compliant,
            "deficit_amount": max(0.0, sc_target_amount - sc_allocated)
        },
        "st_allocation": {
            "allocated_amount": st_allocated,
            "allocated_percentage": round(st_percent, 2),
            "required_percentage": 7.5,
            "target_amount": st_target_amount,
            "compliant": st_compliant,
            "deficit_amount": max(0.0, st_target_amount - st_allocated)
        },
        "compliance_status": status_str,
        "mandate_reference": "MPLADS Guidelines 2023 Clause 2.4 (Mandatory 15% SC & 7.5% ST Allocation)"
    }

@router.get("/sc-st-summary")
def get_all_sc_st_summary(
    current_user: User = Depends(require_roles(["StateNodalAuthority", "MinistryUser", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Summary view for State Nodal and Ministry officers auditing all MPs.
    """
    mp_role = db.execute(select(Role).where(Role.role_name == "MPUser")).scalar_one_or_none()
    if not mp_role:
        return []

    mps = db.execute(select(User).where(User.role_id == mp_role.role_id)).scalars().all()
    fy = get_current_financial_year()

    results = []
    for mp in mps:
        recs = db.execute(select(Recommendation).where(Recommendation.mp_id == mp.user_id)).scalars().all()
        total = sum(float(r.recommended_amount or 0.0) for r in recs)
        sc = sum(float(r.recommended_amount or 0.0) * 0.67 for r in recs if r.project_id)
        st = sum(float(r.recommended_amount or 0.0) * 0.33 for r in recs if r.project_id)
        sc_pct = (sc / total * 100) if total > 0 else 0.0
        st_pct = (st / total * 100) if total > 0 else 0.0
        comp = sc_pct >= 15.0 and st_pct >= 7.5
        results.append({
            "mp_id": str(mp.user_id),
            "mp_name": mp.name,
            "state": mp.state,
            "district": mp.district,
            "financial_year": fy,
            "total_recommended": total,
            "sc_percentage": round(sc_pct, 1),
            "st_percentage": round(st_pct, 1),
            "compliance_status": "Compliant" if comp else "NonCompliant"
        })
    return results

@router.get("/prohibited-categories")
def list_prohibited_categories(
    db: Session = Depends(get_db)
):
    """
    Lists all non-permissible works prohibited under MPLADS Clause 5.1.
    """
    categories = db.execute(
        select(ProhibitedCategory).where(ProhibitedCategory.is_active == True)
    ).scalars().all()

    return [
        {
            "category_id": str(c.category_id),
            "category_name": c.category_name,
            "guideline_reference": c.guideline_reference,
            "is_active": c.is_active
        }
        for c in categories
    ]
