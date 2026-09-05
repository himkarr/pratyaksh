"""Role-scoped anomaly flags backed by production tables.

The original scaffold referenced a ``flags`` table which does not exist in the
29-table production schema. Flags are instead derived from:
  - rule_engine_logs (rule_result == 'Fail')
  - risk_scores (risk_score >= threshold, default 50)
  - ai_analysis_results (anomaly_detected == True)

Output shape matches contracts/schemas/flag.schema.json.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..models import (
    Project,
    RuleEngineLog,
    RiskScore,
    AIAnalysisResult,
    User,
)
from ..core.rbac import get_current_user, filter_projects_by_role

router = APIRouter(prefix="/flags", tags=["flags"])

RISK_FLAG_THRESHOLD = 50.0


def _severity_from_risk(score: float) -> str:
    if score >= 80:
        return "critical"
    if score >= 65:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def serialize_rule_log(log: RuleEngineLog) -> dict:
    return {
        "id": str(log.rule_log_id),
        "project_id": str(log.project_id),
        "category": "cost_anomaly",
        "severity": "high" if log.rule_result == "Fail" else "low",
        "confidence": 0.85,
        "reason": f"[{log.rule_type}] {log.rule_name}: {log.details or log.rule_result}",
        "origin": "rule",
        "created_at": log.evaluated_at.isoformat() if log.evaluated_at else None,
    }


def serialize_risk_score(risk: RiskScore) -> dict:
    score = float(risk.risk_score)
    reasons = risk.anomaly_reasons
    if isinstance(reasons, dict):
        reason = reasons.get("summary") or reasons.get("reason") or str(reasons)[:500]
    elif reasons:
        reason = str(reasons)[:500]
    else:
        reason = risk.recommendation or f"Hybrid risk score {score:.1f}/100"
    origin = "rule"
    mv = (risk.model_version or "").lower()
    if "isolation" in mv or "iforest" in mv:
        origin = "isolation_forest"
    elif "deadline" in mv or "forecast" in mv:
        origin = "deadline_forecaster"
    return {
        "id": str(risk.risk_id),
        "project_id": str(risk.project_id),
        "category": "progress_anomaly",
        "severity": _severity_from_risk(score),
        "confidence": round(min(0.95, max(0.5, score / 100.0)), 2),
        "reason": reason,
        "origin": origin,
        "created_at": risk.calculated_at.isoformat() if risk.calculated_at else None,
    }


def serialize_ai_result(res: AIAnalysisResult) -> dict:
    return {
        "id": str(res.analysis_id),
        "project_id": str(res.project_id) if res.project_id else "",
        "category": "progress_anomaly",
        "severity": "medium",
        "confidence": float(res.confidence_score) if res.confidence_score is not None else 0.7,
        "reason": (res.anomaly_type or "AI-detected anomaly"),
        "origin": "isolation_forest",
        "created_at": res.analyzed_at.isoformat() if res.analyzed_at else None,
    }


# Backwards-compatible generic serializer (router import used by dashboard).
def serialize(obj) -> dict:
    if isinstance(obj, RuleEngineLog):
        return serialize_rule_log(obj)
    if isinstance(obj, RiskScore):
        return serialize_risk_score(obj)
    if isinstance(obj, AIAnalysisResult):
        return serialize_ai_result(obj)
    return {}


def collect_flags(project_ids: list, db: Session) -> list[dict]:
    """Collect all flag-like records for the given project ids."""
    if not project_ids:
        return []
    flags: list[dict] = []
    rule_logs = db.execute(
        select(RuleEngineLog).where(
            RuleEngineLog.project_id.in_(project_ids),
            RuleEngineLog.rule_result == "Fail",
        )
    ).scalars().all()
    flags.extend(serialize_rule_log(r) for r in rule_logs)

    risks = db.execute(
        select(RiskScore).where(
            RiskScore.project_id.in_(project_ids),
            RiskScore.risk_score >= RISK_FLAG_THRESHOLD,
        )
    ).scalars().all()
    flags.extend(serialize_risk_score(r) for r in risks)

    ai_rows = db.execute(
        select(AIAnalysisResult).where(
            AIAnalysisResult.project_id.in_(project_ids),
            AIAnalysisResult.anomaly_detected.is_(True),
        )
    ).scalars().all()
    flags.extend(serialize_ai_result(r) for r in ai_rows)
    return flags


@router.get("")
def list_flags(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List explainable review flags scoped to the caller role."""
    scoped_projects = db.execute(
        filter_projects_by_role(select(Project), current_user, db)
    ).scalars().all()
    project_ids = [p.project_id for p in scoped_projects]
    flags = collect_flags(project_ids, db)

    if category:
        flags = [f for f in flags if f.get("category") == category]
    if severity:
        flags = [f for f in flags if f.get("severity") == severity]
    return flags[offset: offset + limit]
