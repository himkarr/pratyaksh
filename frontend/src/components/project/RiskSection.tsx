import React from "react";
import { ShieldAlert, Cpu, AlertTriangle, FileSearch, CheckCircle2, Info, Activity } from "lucide-react";
import { Card, CardHeader, CardBody, Badge, PriorityBadge, Alert } from "../ui";

export interface AIRiskData {
  work_id?: string;
  chamber?: string;
  mp?: string;
  state?: string;
  constituency?: string;
  ida?: string;
  work_category?: string;
  work_description?: string;

  iforest_anomaly_score?: number;
  iforest_decision_function?: number;
  iforest_flag?: boolean;
  iforest_percentile?: number;
  iforest_risk_band?: string;
  ml_risk_score?: number;

  rule_fail_count?: number;
  rule_review_count?: number;
  rule_not_checkable_count?: number;
  rule_reasons?: string[];
  rule_risk_score?: number;

  combined_risk_score?: number;
  risk_level?: "HIGH" | "MEDIUM" | "LOW";
  verification_priority?: "PRIORITY_1" | "PRIORITY_2" | "PRIORITY_3";
  risk_reason?: string;
}

export interface RiskSectionProps {
  data?: AIRiskData;
  // Backward compatibility props
  riskLevel?: "HIGH" | "MEDIUM" | "LOW";
  verificationPriority?: "PRIORITY_1" | "PRIORITY_2" | "PRIORITY_3";
  mlRiskScore?: number;
  ruleRiskScore?: number;
  combinedRiskScore?: number;
  anomalyPercentile?: number;
  ruleFailures?: string[];
  riskReason?: string;
}

export const RiskSection: React.FC<RiskSectionProps> = ({
  data,
  riskLevel = data?.risk_level || "HIGH",
  verificationPriority = data?.verification_priority || "PRIORITY_1",
  mlRiskScore = data?.ml_risk_score ?? 0.84,
  ruleRiskScore = data?.rule_risk_score ?? 0.75,
  combinedRiskScore = data?.combined_risk_score ?? 0.81,
  anomalyPercentile = data?.iforest_percentile ?? 96.4,
  ruleFailures = data?.rule_reasons || [
    "Rule R-03: Expenditure trajectory deviates from 12-month linear burn rate benchmark",
    "Rule R-07: Physical milestone photos pending second-stage verification"
  ],
  riskReason = data?.risk_reason || "Extremely unusual ML pattern; rule(s) require review"
}) => {
  const iforestAnomalyScore = data?.iforest_anomaly_score ?? 0.784;
  const iforestDecisionFunc = data?.iforest_decision_function ?? -0.142;
  const iforestBand = data?.iforest_risk_band || (riskLevel === "HIGH" ? "ANOMALY_HIGH" : "NORMAL");
  const failCount = data?.rule_fail_count ?? ruleFailures.length;
  const reviewCount = data?.rule_review_count ?? 1;

  return (
    <Card>
      <CardHeader
        title="AI/ML Anomaly Engine & Rule Audit Signals"
        icon={<Cpu size={16} />}
        actions={<PriorityBadge priority={verificationPriority} />}
      />

      <CardBody>
        {/* MANDATORY STATUTORY DISCLAIMER */}
        <Alert type="info" style={{ marginBottom: "14px" }}>
          <strong>IMPORTANT:</strong> Risk level means <strong>verification priority</strong>, NOT proof of fraud or non-compliance. AI identifies cases requiring human inspection.
        </Alert>

        {/* Primary Risk Metrics Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "16px" }}>
          <div style={{ background: "var(--bg-surface-subtle)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Risk Level</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: riskLevel === "HIGH" ? "var(--status-danger-text)" : "var(--status-warning-text)", marginTop: "2px" }}>
              {riskLevel} RISK
            </div>
          </div>

          <div style={{ background: "var(--bg-surface-subtle)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>ML Score (iForest)</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
              {mlRiskScore.toFixed(2)} (P{anomalyPercentile.toFixed(0)})
            </div>
          </div>

          <div style={{ background: "var(--bg-surface-subtle)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Rule Score</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
              {ruleRiskScore.toFixed(2)}
            </div>
          </div>

          <div style={{ background: "var(--bg-surface-subtle)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Combined Risk</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: riskLevel === "HIGH" ? "var(--status-danger-text)" : "var(--status-warning-text)", marginTop: "2px" }}>
              {combinedRiskScore.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Explainable Isolation Forest Diagnostics */}
        <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-main)", marginBottom: "14px" }}>
          <h4 style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Activity size={14} /> Isolation Forest Model Diagnostics (ML Signal):
          </h4>
          <div style={{ fontSize: "0.76rem", color: "var(--text-body)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            <div>Anomaly Score: <strong>{iforestAnomalyScore.toFixed(3)}</strong></div>
            <div>Decision Function: <strong>{iforestDecisionFunc.toFixed(3)}</strong></div>
            <div>Percentile: <strong>Top {anomalyPercentile.toFixed(1)}% Anomaly</strong></div>
            <div>Risk Band: <span className="gov-badge gov-badge-danger" style={{ fontSize: "0.62rem" }}>{iforestBand}</span></div>
          </div>
        </div>

        {/* Human-Readable Risk Reason */}
        <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-main)", marginBottom: "14px" }}>
          <h4 style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
            <FileSearch size={14} /> Why This Project Requires Human Verification:
          </h4>
          <p style={{ fontSize: "0.78rem", color: "var(--text-body)", lineHeight: "1.4" }}>{riskReason}</p>
        </div>

        {/* Rule Engine Failures & Review Counts */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <h4 style={{ fontSize: "0.80rem", fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
              Triggered Statutory Rule Checks ({failCount} Failures, {reviewCount} Reviews Required):
            </h4>
          </div>
          
          <ul style={{ paddingLeft: "18px", fontSize: "0.78rem", color: "var(--text-body)", display: "flex", flexDirection: "column", gap: "4px" }}>
            {ruleFailures.map((rule, idx) => (
              <li key={idx} style={{ color: "var(--status-warning-text)", fontWeight: 600 }}>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
};

export default RiskSection;
