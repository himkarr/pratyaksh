"""Deprecated scaffold stub — production flags live in rule_engine_logs /
risk_scores / ai_analysis_results (see routes_flags.collect_flags).

Kept so legacy ``from .flag import Flag`` imports do not crash; it re-exports
RiskScore as the closest production equivalent without defining a new table.
"""

from .schema_models import RiskScore as Flag  # noqa: F401

__all__ = ["Flag"]
