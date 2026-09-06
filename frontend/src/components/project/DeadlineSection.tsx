import React from "react";
import { Calendar, Clock, AlertOctagon, TrendingUp, Info } from "lucide-react";
import { Card, CardHeader, CardBody, Badge } from "../ui";

export interface DeadlineForecastData {
  predicted_completion_days?: number;
  predicted_completion_date?: string;
  elapsed_days?: number;
  delay_ratio?: number;
  deadline_risk?: "HIGH" | "MEDIUM" | "LOW";
  deadline_status?: "LIKELY DELAY" | "ON TRACK";
  deadline_risk_score?: number;
}

export interface DeadlineSectionProps {
  data?: DeadlineForecastData;
  // Backward compatibility props
  sanctionDate?: string;
  targetCompletion?: string;
  predictedCompletionDate?: string;
  elapsedDays?: number;
  delayRatio?: number;
  deadlineRiskScore?: number;
}

export const DeadlineSection: React.FC<DeadlineSectionProps> = ({
  data,
  sanctionDate = "15 Jan 2024",
  targetCompletion = "15 Jan 2025",
  predictedCompletionDate = data?.predicted_completion_date || "27 Apr 2025",
  elapsedDays = data?.elapsed_days ?? 317,
  delayRatio = data?.delay_ratio ?? 1.34,
  deadlineRiskScore = data?.deadline_risk_score ?? 0.82
}) => {
  const predictedDays = data?.predicted_completion_days ?? 186;
  const deadlineRisk = data?.deadline_risk || (delayRatio > 1.2 ? "HIGH" : "LOW");
  const deadlineStatus = data?.deadline_status || (delayRatio > 1.2 ? "LIKELY DELAY" : "ON TRACK");
  const isHighRisk = deadlineRisk === "HIGH" || delayRatio > 1.2 || deadlineRiskScore > 0.7;

  return (
    <Card>
      <CardHeader
        title="Statutory 1-Year Statutory Deadline AI Forecast"
        icon={<Calendar size={16} />}
        actions={
          <Badge variant={isHighRisk ? "danger" : "success"}>
            {deadlineStatus} ({deadlineRisk} DEADLINE RISK)
          </Badge>
        }
      />

      <CardBody>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "12px" }}>
          <div style={{ padding: "8px 10px", background: "var(--bg-surface-subtle)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Predicted Completion</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: isHighRisk ? "var(--status-danger-text)" : "var(--gov-primary)", marginTop: "2px" }}>
              {predictedCompletionDate}
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", marginTop: "2px" }}>Model Estimate</div>
          </div>

          <div style={{ padding: "8px 10px", background: "var(--bg-surface-subtle)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Predicted Duration</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
              {predictedDays} Days
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", marginTop: "2px" }}>AI Forecast</div>
          </div>

          <div style={{ padding: "8px 10px", background: "var(--bg-surface-subtle)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Elapsed / Limit</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
              {elapsedDays} / 365 Days
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", marginTop: "2px" }}>MoSPI Statutory Ceiling</div>
          </div>

          <div style={{ padding: "8px 10px", background: "var(--bg-surface-subtle)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Delay Ratio</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: isHighRisk ? "var(--status-warning-text)" : "var(--status-success-text)", marginTop: "2px" }}>
              {delayRatio.toFixed(2)}x
            </div>
            <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", marginTop: "2px" }}>Burn Velocity Ratio</div>
          </div>
        </div>

        <div style={{ fontSize: "0.76rem", color: "var(--text-body)", background: "var(--bg-surface-subtle)", padding: "10px 12px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
          <strong>Statutory Compliance Note:</strong> AI forecast estimates project completion date using historical linear burn rate trajectories. Projects exceeding 365 calendar days require formal District Magistrate justification and physical re-inspection.
        </div>
      </CardBody>
    </Card>
  );
};

export default DeadlineSection;
