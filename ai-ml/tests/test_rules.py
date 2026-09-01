from datetime import date, timedelta
from rule_engine.rules import evaluate
def project(**overrides):
    base = {"id":"T-1", "sanction_date":(date.today()-timedelta(days=220)).isoformat(), "sanctioned_amount":1000, "utilized_amount":500, "physical_progress_percent":20, "status":"in_progress"}; base.update(overrides); return base
def test_overrun_is_explainable_rule(): assert any(flag["category"] == "cost_anomaly" for flag in evaluate(project(utilized_amount=1200)))
def test_normal_project_does_not_overrun(): assert not any("exceeds" in flag["reason"] for flag in evaluate(project(physical_progress_percent=70, utilized_amount=600)))
