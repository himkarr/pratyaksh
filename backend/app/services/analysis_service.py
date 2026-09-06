import uuid
from datetime import datetime, date, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from ..models import (
    Project, RuleEngineLog, RiskScore, PaymentTransaction,
    ProjectMilestone, User, SystemConfig
)
from .audit_service import record_audit_event
from .ml_client import predict_sync
from ..core.config import ML_SERVICE_URL

DEFAULT_COMPLETION_DEADLINE_DAYS = 365
DEFAULT_TENDER_COST_THRESHOLD = 5000000.0  # 50 Lakhs
DEFAULT_UTILIZATION_OVERRUN_TOLERANCE = 0.02  # 2%
DEFAULT_DEADLINE_RISK_ELAPSED_RATIO = 0.50
DEFAULT_LOW_PROGRESS_THRESHOLD = 40.0

def get_system_config_value(db: Session, key: str, default: Any) -> Any:
    """Read dynamic threshold from system_config table or return default."""
    cfg = db.execute(select(SystemConfig).where(SystemConfig.config_key == key)).scalar_one_or_none()
    if not cfg or not isinstance(cfg.config_value, dict):
        return default
    return cfg.config_value.get("threshold") or cfg.config_value.get("days") or cfg.config_value.get("percent") or default

def evaluate_project_rules(db: Session, project: Project) -> List[Dict[str, Any]]:
    """
    Evaluates transparent, explainable MPLADS domain rules against a project record.
    Returns list of evaluated rule dictionaries.
    """
    now_date = date.today()
    sanction_d = project.start_date or (date.fromisoformat(str(project.created_at)[:10]))
    elapsed_days = max(0, (now_date - sanction_d).days)
    
    sanctioned = float(project.sanctioned_amount or 0.0)
    utilized = float(project.utilized_amount or 0.0)
    progress = float(project.progress_percentage or 0)
    
    deadline_days = int(get_system_config_value(db, "completion_deadline_days", DEFAULT_COMPLETION_DEADLINE_DAYS))
    tender_threshold = float(get_system_config_value(db, "tender_cost_threshold", DEFAULT_TENDER_COST_THRESHOLD))
    
    evaluated_rules: List[Dict[str, Any]] = []

    # 1. Statutory 1-Year Completion Deadline Breach (Retrospective)
    is_overdue = elapsed_days > deadline_days and project.status != "Completed" and progress < 100
    evaluated_rules.append({
        "rule_type": "MPLADS_Guideline",
        "rule_name": "One_Year_Completion_Deadline",
        "rule_result": "Fail" if is_overdue else "Pass",
        "category": "deadline_risk",
        "severity": "critical" if is_overdue else "low",
        "risk_points": 40 if is_overdue else 0,
        "details": (
            f"Project has elapsed {elapsed_days} days exceeding mandatory {deadline_days}-day deadline with {progress:.1f}% completion."
            if is_overdue else f"Within {deadline_days}-day statutory window ({elapsed_days} days elapsed)."
        )
    })

    # 2. Predictive Deadline Risk (Early Warning)
    time_ratio = elapsed_days / max(1, deadline_days)
    is_predicted_breach = (
        time_ratio >= DEFAULT_DEADLINE_RISK_ELAPSED_RATIO 
        and progress < DEFAULT_LOW_PROGRESS_THRESHOLD 
        and project.status not in ("Completed", "Cancelled")
    )
    if not is_overdue:
        evaluated_rules.append({
            "rule_type": "Business_Logic",
            "rule_name": "Predictive_Deadline_Breach_Risk",
            "rule_result": "Fail" if is_predicted_breach else "Pass",
            "category": "deadline_risk",
            "severity": "high" if is_predicted_breach else "low",
            "risk_points": 30 if is_predicted_breach else 0,
            "details": (
                f"Predictive warning: {time_ratio:.0%} of timeline elapsed but physical progress is only {progress:.1f}%. High probability of missing statutory deadline."
                if is_predicted_breach else "Progress trajectory is consistent with delivery schedule."
            )
        })

    # 3. Cost Overrun Tolerance
    overrun_threshold = sanctioned * (1 + DEFAULT_UTILIZATION_OVERRUN_TOLERANCE)
    is_overrun = utilized > overrun_threshold and sanctioned > 0
    evaluated_rules.append({
        "rule_type": "Financial",
        "rule_name": "Fund_Utilization_Overrun",
        "rule_result": "Fail" if is_overrun else "Pass",
        "category": "cost_anomaly",
        "severity": "high" if is_overrun else "low",
        "risk_points": 35 if is_overrun else 0,
        "details": (
            f"Fund utilization (₹{utilized:,.2f}) exceeds sanctioned allocation (₹{sanctioned:,.2f}) by {(utilized - sanctioned):,.2f}."
            if is_overrun else "Fund utilization is within approved sanction limits."
        )
    })

    # 4. Mandatory Tender Reference Check (> ₹50 Lakhs)
    missing_tender = sanctioned >= tender_threshold and (not project.tender_reference_no or project.tender_reference_no.strip() == "")
    evaluated_rules.append({
        "rule_type": "Payment_Without_Tender",
        "rule_name": "Mandatory_Tender_Reference_Check",
        "rule_result": "Fail" if missing_tender else "Pass",
        "category": "cost_anomaly",
        "severity": "high" if missing_tender else "low",
        "risk_points": 25 if missing_tender else 0,
        "details": (
            f"Work sanction of ₹{sanctioned:,.2f} exceeds ₹{tender_threshold:,.2f} threshold but lacks mandatory tender reference number."
            if missing_tender else "Tender documentation requirement satisfied."
        )
    })

    # 5. Payment Without Milestone Verification Check
    unverified_payments = db.execute(
        select(PaymentTransaction).where(
            and_(
                PaymentTransaction.project_id == project.project_id,
                PaymentTransaction.anomaly_flag == True
            )
        )
    ).scalars().all()
    has_unverified_payment = len(unverified_payments) > 0
    evaluated_rules.append({
        "rule_type": "Unauthorized_Fund_Transfer",
        "rule_name": "Payment_Before_Milestone_Verification",
        "rule_result": "Fail" if has_unverified_payment else "Pass",
        "category": "cost_anomaly",
        "severity": "critical" if has_unverified_payment else "low",
        "risk_points": 35 if has_unverified_payment else 0,
        "details": (
            f"{len(unverified_payments)} payment transactions were disbursed before milestone inspection sign-off was completed."
            if has_unverified_payment else "All disbursements correspond to verified project milestones."
        )
    })

    # 6. Physical Completion Without Fund Utilization Anomaly
    completion_zero_fund = project.status == "Completed" and utilized <= 0 and sanctioned > 0
    if project.status == "Completed":
        evaluated_rules.append({
            "rule_type": "Business_Logic",
            "rule_name": "Completion_Without_Utilization",
            "rule_result": "Fail" if completion_zero_fund else "Pass",
            "category": "progress_anomaly",
            "severity": "high" if completion_zero_fund else "low",
            "risk_points": 20 if completion_zero_fund else 0,
            "details": (
                "Work marked 100% completed but zero fund utilization recorded. Requires audit reconciliation."
                if completion_zero_fund else "Completion reporting is aligned with fund ledger."
            )
        })

    # 7. Low Progress With High Utilization Anomaly
    high_spend_low_progress = sanctioned > 0 and (utilized / sanctioned >= 0.75) and (progress < 25)
    evaluated_rules.append({
        "rule_type": "Financial",
        "rule_name": "High_Expenditure_Low_Progress_Discrepancy",
        "rule_result": "Fail" if high_spend_low_progress else "Pass",
        "category": "progress_anomaly",
        "severity": "high" if high_spend_low_progress else "low",
        "risk_points": 30 if high_spend_low_progress else 0,
        "details": (
            f"Over {(utilized / sanctioned):.0%} of budget spent (₹{utilized:,.2f}) but physical progress is only {progress:.1f}%."
            if high_spend_low_progress else "Expenditure velocity matches ground execution."
        )
    })

    return evaluated_rules

def analyze_project(db: Session, project_id: uuid.UUID, actor_id: Optional[uuid.UUID] = None) -> Dict[str, Any]:
    """
    Executes full hybrid analysis on a project:
    1. Evaluates all transparent domain rules.
    2. Writes rule evaluation logs to rule_engine_logs.
    3. Calculates composite 0-100 risk score.
    4. Persists to risk_scores.
    5. Updates project.is_flagged and project.latest_risk_score.
    6. Appends to hash-chained audit trail.
    """
    project = db.execute(select(Project).where(Project.project_id == project_id)).scalar_one_or_none()
    if not project:
        raise ValueError(f"Project with ID {project_id} not found")

    rules = evaluate_project_rules(db, project)
    now = datetime.now(timezone.utc)

    # The database stores a normalized project, while the anomaly model expects
    # source-work features.  Build the available equivalents and treat missing
    # vendor/evidence fields as unknown/zero rather than fabricating data.
    ml_result = None
    if ML_SERVICE_URL:
        try:
            elapsed = max(0, (now.date() - (project.start_date or now.date())).days)
            ml_result = predict_sync({
                "work_id": str(project.project_id), "sanction_amount": float(project.sanctioned_amount or 0),
                "expenditure_total": float(project.utilized_amount or 0), "recommended_amount": float(project.sanctioned_amount or 0),
                "recommendation_to_sanction_days": 0, "sanction_to_first_expenditure_days": elapsed,
                "sanction_to_completion_days": elapsed if project.actual_completion_date else None,
                "vendor_count": 0, "expenditure_records": 1 if project.utilized_amount else 0,
                "has_expenditure": bool(project.utilized_amount), "has_completion_record": project.status == "Completed",
                "has_completion_image_reference": False, "completion_date": project.actual_completion_date.isoformat() if project.actual_completion_date else None,
            })
        except Exception:
            # Rule-based review remains available if the separate ML service is down.
            ml_result = None

    # Persist rule evaluation logs
    failed_rules = []
    total_risk_points = 0

    for r in rules:
        log_entry = RuleEngineLog(
            rule_log_id=uuid.uuid4(),
            project_id=project.project_id,
            rule_type=r["rule_type"],
            rule_name=r["rule_name"],
            rule_result=r["rule_result"],
            details=r["details"],
            evaluated_at=now
        )
        db.add(log_entry)

        if r["rule_result"] == "Fail":
            failed_rules.append(r)
            total_risk_points += r["risk_points"]

    if ml_result and ml_result.get("is_anomaly"):
        total_risk_points += 15
        failed_rules.append({
            "rule_name": "Isolation_Forest_Statistical_Outlier",
            "details": "ML identified an unusual feature pattern. This is a review signal, not a fraud finding.",
            "risk_points": 15,
        })

    # Calculate composite risk score capped at 100
    composite_risk_score = min(100.0, float(total_risk_points))

    # Determine priority
    if composite_risk_score >= 65:
        priority_level = "High"
    elif composite_risk_score >= 35:
        priority_level = "Medium"
    else:
        priority_level = "Low"

    is_flagged = len(failed_rules) > 0 or composite_risk_score >= 50.0

    # Build structured reasons for human auditors
    reasons_summary = {
        "failed_rule_count": len(failed_rules),
        "reasons": [r["details"] for r in failed_rules],
        "top_failure": failed_rules[0]["rule_name"] if failed_rules else "None",
        "calculated_at": now.isoformat()
    }

    recommendation_text = (
        f"Project flagged for priority review by District Authority. {len(failed_rules)} non-compliance triggers identified."
        if is_flagged else "Project operating within normal scheme execution parameters."
    )

    # Persist RiskScore
    risk_entry = RiskScore(
        risk_id=uuid.uuid4(),
        project_id=project.project_id,
        risk_score=composite_risk_score,
        anomaly_reasons=reasons_summary,
        priority_level=priority_level,
        recommendation=recommendation_text,
        model_version="v2.0-hybrid-rule-ml",
        calculated_at=now
    )
    db.add(risk_entry)

    # Update project record
    project.is_flagged = is_flagged
    project.latest_risk_score = composite_risk_score

    db.commit()
    db.refresh(project)

    # Audit event
    record_audit_event(
        db=db,
        action="PROJECT_AI_ANALYSIS_EXECUTED",
        entity_type="projects",
        entity_id=project.project_id,
        user_id=actor_id,
        new_value={
            "risk_score": composite_risk_score,
            "priority_level": priority_level,
            "is_flagged": is_flagged,
            "failed_rule_count": len(failed_rules)
        }
    )

    return {
        "project_id": str(project.project_id),
        "project_name": project.project_name,
        "risk_score": composite_risk_score,
        "priority_level": priority_level,
        "is_flagged": is_flagged,
        "failed_rules_count": len(failed_rules),
        "failed_rules": failed_rules,
        "all_rules_evaluated": len(rules),
        "recommendation": recommendation_text
    }
