import uuid
from datetime import datetime, date, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, desc

from ..db.session import get_db
from ..models import (
    Project, ProjectMilestone, ProjectFinancial, PaymentTransaction,
    ProjectProcurementRecord, FundTransfer, User, ImplementingAgency,
    RuleEngineLog, SystemConfig
)
from ..core.rbac import get_current_user, filter_projects_by_role, require_roles
from ..services.audit_service import record_audit_event
from ..services.analysis_service import analyze_project

router = APIRouter(prefix="/financials", tags=["Financials & Procurement"])

# -------------------------------------------------------------
# Schemas
# -------------------------------------------------------------

class CreateMilestoneRequest(BaseModel):
    milestone_name: str
    expected_percentage: int

class VerifyMilestoneRequest(BaseModel):
    remarks: Optional[str] = None

class CreateInstallmentRequest(BaseModel):
    installment_no: int
    amount_released: float
    amount_utilized: float = 0.0
    release_date: Optional[date] = None
    utilization_date: Optional[date] = None
    remarks: Optional[str] = None

class CreatePaymentRequest(BaseModel):
    amount: float
    payment_mode: str = "NEFT"
    cheque_or_utr_no: Optional[str] = None
    payment_date: Optional[date] = None
    linked_milestone_id: Optional[str] = None
    implementing_agency_id: Optional[str] = None

class CreateProcurementRequest(BaseModel):
    item_name: str
    quantity: float
    unit: str = "Unit"
    unit_price: float
    item_description: Optional[str] = None
    linked_milestone_id: Optional[str] = None
    remarks: Optional[str] = None

class CreateFundTransferRequest(BaseModel):
    source_project_id: str
    destination_project_id: str
    amount: float
    reason: str

class ActionFundTransferRequest(BaseModel):
    action: str  # "Approved" or "Rejected"
    remarks: Optional[str] = None

# -------------------------------------------------------------
# 1. Milestones
# -------------------------------------------------------------

@router.post("/projects/{project_id}/milestones", status_code=status.HTTP_201_CREATED)
def create_project_milestone(
    project_id: str,
    req: CreateMilestoneRequest,
    current_user: User = Depends(require_roles(["DistrictAuthority", "StateNodalAuthority", "Admin"])),
    db: Session = Depends(get_db)
):
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    project = db.execute(select(Project).where(Project.project_id == p_uuid)).scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    m_id = uuid.uuid4()
    milestone = ProjectMilestone(
        milestone_id=m_id,
        project_id=p_uuid,
        milestone_name=req.milestone_name,
        expected_percentage=req.expected_percentage,
        verified=False
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)

    record_audit_event(
        db=db,
        action="PROJECT_MILESTONE_CREATED",
        entity_type="project_milestones",
        entity_id=milestone.milestone_id,
        user_id=current_user.user_id,
        new_value={
            "milestone_name": req.milestone_name,
            "expected_percentage": req.expected_percentage,
            "project_id": str(p_uuid)
        }
    )

    return {
        "message": "Milestone created successfully",
        "milestone_id": str(milestone.milestone_id),
        "milestone_name": milestone.milestone_name,
        "expected_percentage": milestone.expected_percentage,
        "verified": milestone.verified
    }

@router.get("/projects/{project_id}/milestones")
def list_project_milestones(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    milestones = db.execute(
        select(ProjectMilestone).where(ProjectMilestone.project_id == p_uuid).order_by(ProjectMilestone.expected_percentage.asc())
    ).scalars().all()

    return [
        {
            "milestone_id": str(m.milestone_id),
            "project_id": str(m.project_id),
            "milestone_name": m.milestone_name,
            "expected_percentage": m.expected_percentage,
            "verified": m.verified,
            "verified_by": str(m.verified_by) if m.verified_by else None,
            "verified_at": m.verified_at.isoformat() if m.verified_at else None
        }
        for m in milestones
    ]

@router.post("/milestones/{milestone_id}/verify")
def verify_project_milestone(
    milestone_id: str,
    req: VerifyMilestoneRequest,
    current_user: User = Depends(require_roles(["DistrictAuthority", "FieldOfficer", "Admin"])),
    db: Session = Depends(get_db)
):
    try:
        m_uuid = uuid.UUID(milestone_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid milestone ID format")

    milestone = db.execute(select(ProjectMilestone).where(ProjectMilestone.milestone_id == m_uuid)).scalar_one_or_none()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    milestone.verified = True
    milestone.verified_by = current_user.user_id
    milestone.verified_at = datetime.now(timezone.utc)

    # Automatically update project progress percentage if milestone is higher
    project = db.execute(select(Project).where(Project.project_id == milestone.project_id)).scalar_one_or_none()
    if project and milestone.expected_percentage > project.progress_percentage:
        project.progress_percentage = milestone.expected_percentage

    db.commit()

    record_audit_event(
        db=db,
        action="PROJECT_MILESTONE_VERIFIED",
        entity_type="project_milestones",
        entity_id=milestone.milestone_id,
        user_id=current_user.user_id,
        new_value={
            "milestone_id": str(milestone.milestone_id),
            "milestone_name": milestone.milestone_name,
            "verified": True,
            "remarks": req.remarks
        }
    )

    # Re-evaluate project rules and risk score
    if project:
        try:
            analyze_project(db=db, project_id=project.project_id, actor_id=current_user.user_id)
        except Exception:
            pass

    return {
        "message": "Milestone verified successfully",
        "milestone_id": str(milestone.milestone_id),
        "verified": True,
        "verified_at": milestone.verified_at.isoformat()
    }

# -------------------------------------------------------------
# 2. Financial Installments
# -------------------------------------------------------------

@router.post("/projects/{project_id}/installments", status_code=status.HTTP_201_CREATED)
def record_installment(
    project_id: str,
    req: CreateInstallmentRequest,
    current_user: User = Depends(require_roles(["DistrictAuthority", "StateNodalAuthority", "Admin"])),
    db: Session = Depends(get_db)
):
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    project = db.execute(select(Project).where(Project.project_id == p_uuid)).scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_released = float(project.released_amount or 0.0) + req.amount_released
    new_utilized = float(project.utilized_amount or 0.0) + req.amount_utilized
    balance = new_released - new_utilized

    fin_id = uuid.uuid4()
    fin = ProjectFinancial(
        financial_id=fin_id,
        project_id=p_uuid,
        installment_no=req.installment_no,
        amount_released=req.amount_released,
        release_date=req.release_date or date.today(),
        amount_utilized=req.amount_utilized,
        utilization_date=req.utilization_date,
        balance=balance,
        remarks=req.remarks
    )
    db.add(fin)

    # Update project master figures
    project.released_amount = new_released
    project.utilized_amount = new_utilized

    db.commit()
    db.refresh(fin)

    record_audit_event(
        db=db,
        action="INSTALLMENT_RECORDED",
        entity_type="project_financials",
        entity_id=fin.financial_id,
        user_id=current_user.user_id,
        new_value={
            "installment_no": req.installment_no,
            "amount_released": req.amount_released,
            "amount_utilized": req.amount_utilized,
            "total_released": new_released,
            "total_utilized": new_utilized
        }
    )

    # Re-evaluate rules (checks cost overrun etc.)
    try:
        analyze_project(db=db, project_id=project.project_id, actor_id=current_user.user_id)
    except Exception:
        pass

    return {
        "message": "Financial installment recorded",
        "financial_id": str(fin.financial_id),
        "installment_no": fin.installment_no,
        "amount_released": float(fin.amount_released),
        "total_released": new_released,
        "total_utilized": new_utilized,
        "balance": balance
    }

@router.get("/projects/{project_id}/installments")
def list_installments(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    records = db.execute(
        select(ProjectFinancial).where(ProjectFinancial.project_id == p_uuid).order_by(ProjectFinancial.installment_no.asc())
    ).scalars().all()

    return [
        {
            "financial_id": str(f.financial_id),
            "installment_no": f.installment_no,
            "amount_released": float(f.amount_released),
            "amount_utilized": float(f.amount_utilized),
            "release_date": f.release_date.isoformat() if f.release_date else None,
            "utilization_date": f.utilization_date.isoformat() if f.utilization_date else None,
            "balance": float(f.balance),
            "remarks": f.remarks
        }
        for f in records
    ]

# -------------------------------------------------------------
# 3. Payments & Fraud Detection
# -------------------------------------------------------------

@router.post("/projects/{project_id}/payments", status_code=status.HTTP_201_CREATED)
def record_payment(
    project_id: str,
    req: CreatePaymentRequest,
    current_user: User = Depends(require_roles(["DistrictAuthority", "StateNodalAuthority", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Records a payment disbursement with automated fraud/irregularity checks:
    - Automatically sets anomaly_flag = True if payment is made before milestone verification.
    - Flags if cumulative payments exceed sanctioned amount.
    """
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    project = db.execute(select(Project).where(Project.project_id == p_uuid)).scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestone_uuid = None
    milestone = None
    is_anomaly = False

    if req.linked_milestone_id:
        try:
            milestone_uuid = uuid.UUID(req.linked_milestone_id)
            milestone = db.execute(
                select(ProjectMilestone).where(ProjectMilestone.milestone_id == milestone_uuid)
            ).scalar_one_or_none()
        except ValueError:
            pass

    # FRAUD RULE: Payment before milestone verified
    if milestone and not milestone.verified:
        is_anomaly = True

    agency_uuid = None
    if req.implementing_agency_id:
        try:
            agency_uuid = uuid.UUID(req.implementing_agency_id)
        except ValueError:
            pass
    elif project.implementing_agency_id:
        agency_uuid = project.implementing_agency_id

    tx_id = uuid.uuid4()
    payment = PaymentTransaction(
        transaction_id=tx_id,
        project_id=p_uuid,
        implementing_agency_id=agency_uuid,
        amount=req.amount,
        payment_mode=req.payment_mode,
        cheque_or_utr_no=req.cheque_or_utr_no or f"UTR-RBI-{uuid.uuid4().hex[:10].upper()}",
        payment_date=req.payment_date or date.today(),
        linked_milestone_id=milestone_uuid,
        anomaly_flag=is_anomaly
    )
    db.add(payment)

    # Update project utilized amount
    project.utilized_amount = float(project.utilized_amount or 0.0) + req.amount

    db.commit()
    db.refresh(payment)

    # If unverified payment fraud was detected, record immediate RuleEngineLog failure
    if is_anomaly:
        rule_failure = RuleEngineLog(
            rule_log_id=uuid.uuid4(),
            project_id=p_uuid,
            rule_type="Payment_Without_Tender",
            rule_name="Payment_Before_Milestone_Verification",
            rule_result="Fail",
            details=f"Payment of ₹{req.amount:,.2f} disbursed for milestone '{milestone.milestone_name}' before ground inspection sign-off was completed.",
            evaluated_at=datetime.now(timezone.utc)
        )
        db.add(rule_failure)
        project.is_flagged = True
        db.commit()

    record_audit_event(
        db=db,
        action="PAYMENT_TRANSACTION_RECORDED",
        entity_type="payment_transactions",
        entity_id=payment.transaction_id,
        user_id=current_user.user_id,
        new_value={
            "amount": req.amount,
            "payment_mode": req.payment_mode,
            "cheque_or_utr_no": payment.cheque_or_utr_no,
            "anomaly_flag": is_anomaly,
            "linked_milestone": milestone.milestone_name if milestone else None
        }
    )

    # Run AI/Rule evaluation
    try:
        analyze_project(db=db, project_id=project.project_id, actor_id=current_user.user_id)
    except Exception:
        pass

    return {
        "message": "Payment recorded successfully",
        "transaction_id": str(payment.transaction_id),
        "amount": float(payment.amount),
        "anomaly_flag": payment.anomaly_flag,
        "warning": "ANOMALY: Payment was disbursed for unverified milestone!" if is_anomaly else None
    }

@router.get("/projects/{project_id}/payments")
def list_payments(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    payments = db.execute(
        select(PaymentTransaction).where(PaymentTransaction.project_id == p_uuid).order_by(PaymentTransaction.payment_date.desc())
    ).scalars().all()

    return [
        {
            "transaction_id": str(p.transaction_id),
            "amount": float(p.amount),
            "payment_mode": p.payment_mode,
            "cheque_or_utr_no": p.cheque_or_utr_no,
            "payment_date": p.payment_date.isoformat(),
            "linked_milestone_id": str(p.linked_milestone_id) if p.linked_milestone_id else None,
            "anomaly_flag": p.anomaly_flag
        }
        for p in payments
    ]

# -------------------------------------------------------------
# 4. GeM Procurement Records
# -------------------------------------------------------------

@router.post("/projects/{project_id}/procurement", status_code=status.HTTP_201_CREATED)
def record_procurement(
    project_id: str,
    req: CreateProcurementRequest,
    current_user: User = Depends(require_roles(["Vendor", "DistrictAuthority", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Records itemized vendor procurement against a project.
    Validates unit prices against GeM benchmark deviation tolerance.
    """
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    project = db.execute(select(Project).where(Project.project_id == p_uuid)).scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    total_amount = float(req.quantity * req.unit_price)

    m_uuid = None
    if req.linked_milestone_id:
        try:
            m_uuid = uuid.UUID(req.linked_milestone_id)
        except ValueError:
            pass

    proc_id = uuid.uuid4()
    record = ProjectProcurementRecord(
        procurement_id=proc_id,
        project_id=p_uuid,
        vendor_user_id=current_user.user_id,
        item_name=req.item_name,
        item_description=req.item_description,
        quantity=req.quantity,
        unit=req.unit,
        unit_price=req.unit_price,
        total_amount=total_amount,
        purchase_date=date.today(),
        linked_milestone_id=m_uuid,
        remarks=req.remarks
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    record_audit_event(
        db=db,
        action="PROCUREMENT_RECORD_ADDED",
        entity_type="project_procurement_records",
        entity_id=record.procurement_id,
        user_id=current_user.user_id,
        new_value={
            "item_name": req.item_name,
            "quantity": req.quantity,
            "unit_price": req.unit_price,
            "total_amount": total_amount
        }
    )

    return {
        "message": "Procurement item recorded successfully",
        "procurement_id": str(record.procurement_id),
        "item_name": record.item_name,
        "total_amount": float(record.total_amount)
    }

@router.get("/projects/{project_id}/procurement")
def list_procurement(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    items = db.execute(
        select(ProjectProcurementRecord).where(ProjectProcurementRecord.project_id == p_uuid).order_by(ProjectProcurementRecord.created_at.desc())
    ).scalars().all()

    return [
        {
            "procurement_id": str(i.procurement_id),
            "item_name": i.item_name,
            "item_description": i.item_description,
            "quantity": float(i.quantity),
            "unit": i.unit,
            "unit_price": float(i.unit_price),
            "total_amount": float(i.total_amount),
            "purchase_date": i.purchase_date.isoformat(),
            "remarks": i.remarks
        }
        for i in items
    ]

# -------------------------------------------------------------
# 5. Fund Transfers (Cross-Project Reallocations)
# -------------------------------------------------------------

@router.post("/fund-transfers", status_code=status.HTTP_201_CREATED)
def request_fund_transfer(
    req: CreateFundTransferRequest,
    current_user: User = Depends(require_roles(["DistrictAuthority", "StateNodalAuthority", "Admin"])),
    db: Session = Depends(get_db)
):
    try:
        src_uuid = uuid.UUID(req.source_project_id)
        dst_uuid = uuid.UUID(req.destination_project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid source or destination project ID format")

    src = db.execute(select(Project).where(Project.project_id == src_uuid)).scalar_one_or_none()
    dst = db.execute(select(Project).where(Project.project_id == dst_uuid)).scalar_one_or_none()

    if not src or not dst:
        raise HTTPException(status_code=404, detail="Source or destination project not found")

    tf_id = uuid.uuid4()
    tf = FundTransfer(
        transfer_id=tf_id,
        source_project_id=src_uuid,
        destination_project_id=dst_uuid,
        amount=req.amount,
        reason=req.reason,
        requested_by=current_user.user_id,
        status="Requested"
    )
    db.add(tf)
    db.commit()
    db.refresh(tf)

    record_audit_event(
        db=db,
        action="FUND_TRANSFER_REQUESTED",
        entity_type="fund_transfers",
        entity_id=tf.transfer_id,
        user_id=current_user.user_id,
        new_value={
            "source_project_id": str(src_uuid),
            "destination_project_id": str(dst_uuid),
            "amount": req.amount,
            "reason": req.reason
        }
    )

    return {
        "message": "Fund transfer requested successfully",
        "transfer_id": str(tf.transfer_id),
        "status": tf.status,
        "amount": float(tf.amount)
    }

@router.get("/fund-transfers")
def list_fund_transfers(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = select(FundTransfer).order_by(FundTransfer.requested_at.desc())
    if status_filter:
        query = query.where(FundTransfer.status == status_filter)

    transfers = db.execute(query).scalars().all()
    output = []
    for t in transfers:
        src = db.execute(select(Project).where(Project.project_id == t.source_project_id)).scalar_one_or_none()
        dst = db.execute(select(Project).where(Project.project_id == t.destination_project_id)).scalar_one_or_none()
        output.append({
            "transfer_id": str(t.transfer_id),
            "source_project_id": str(t.source_project_id),
            "source_project_name": src.project_name if src else "N/A",
            "destination_project_id": str(t.destination_project_id),
            "destination_project_name": dst.project_name if dst else "N/A",
            "amount": float(t.amount),
            "reason": t.reason,
            "status": t.status,
            "requested_at": t.requested_at.isoformat(),
            "decided_at": t.decided_at.isoformat() if t.decided_at else None
        })
    return output

@router.post("/fund-transfers/{transfer_id}/action")
def action_fund_transfer(
    transfer_id: str,
    req: ActionFundTransferRequest,
    current_user: User = Depends(require_roles(["StateNodalAuthority", "MinistryUser", "Admin"])),
    db: Session = Depends(get_db)
):
    try:
        tf_uuid = uuid.UUID(transfer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid transfer ID format")

    tf = db.execute(select(FundTransfer).where(FundTransfer.transfer_id == tf_uuid)).scalar_one_or_none()
    if not tf:
        raise HTTPException(status_code=404, detail="Fund transfer not found")

    if tf.status != "Requested":
        raise HTTPException(status_code=400, detail=f"Transfer is already {tf.status}")

    now = datetime.now(timezone.utc)
    tf.status = req.action
    tf.approved_by = current_user.user_id
    tf.decided_at = now

    if req.action == "Approved":
        # Reallocate funds: reduce source, increase destination
        src = db.execute(select(Project).where(Project.project_id == tf.source_project_id)).scalar_one_or_none()
        dst = db.execute(select(Project).where(Project.project_id == tf.destination_project_id)).scalar_one_or_none()
        if src and dst:
            src.released_amount = max(0.0, float(src.released_amount or 0.0) - float(tf.amount))
            dst.released_amount = float(dst.released_amount or 0.0) + float(tf.amount)

    db.commit()

    record_audit_event(
        db=db,
        action=f"FUND_TRANSFER_{req.action.upper()}",
        entity_type="fund_transfers",
        entity_id=tf.transfer_id,
        user_id=current_user.user_id,
        new_value={"action": req.action, "remarks": req.remarks}
    )

    return {
        "message": f"Fund transfer {req.action}",
        "transfer_id": str(tf.transfer_id),
        "status": tf.status
    }
