import React from "react";
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { Card, CardHeader, CardBody, Badge } from "../ui";

export interface ProjectTimelineProps {
  project: WorkItem;
  predictedCompletionDate?: string;
  elapsedDays?: number;
  delayRatio?: number;
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  project,
  predictedCompletionDate = "2025-04-18",
  elapsedDays = 210,
  delayRatio = 1.15
}) => {
  const targetDays = 365; // Statutory 1-Year Rule
  const progressPercent = Math.min(Math.round((elapsedDays / targetDays) * 100), 100);
  const isDelayed = delayRatio > 1.2 || project.status === "Delayed";

  return (
    <Card>
      <CardHeader
        title="Statutory 1-Year Timeline & AI Forecast"
        icon={<Clock size={16} />}
        actions={
          <Badge variant={isDelayed ? "danger" : (progressPercent > 80 ? "warning" : "success")}>
            {isDelayed ? "LIKELY DELAY" : "ON TRACK"}
          </Badge>
        }
      />

      <CardBody>
        {/* Timeline Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          <div style={{ background: "var(--bg-surface-subtle)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Sanction Date</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--gov-primary)", marginTop: "2px" }}>{project.dateSanctioned}</div>
          </div>

          <div style={{ background: "var(--bg-surface-subtle)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Elapsed Days</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: elapsedDays > 300 ? "var(--status-danger-text)" : "var(--gov-primary)", marginTop: "2px" }}>
              {elapsedDays} / 365 Days
            </div>
          </div>

          <div style={{ background: "var(--bg-surface-subtle)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Target (365-Day)</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--gov-primary)", marginTop: "2px" }}>{project.targetCompletion}</div>
          </div>

          <div style={{ background: "var(--bg-surface-subtle)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>AI Predicted Date</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: isDelayed ? "var(--status-danger-text)" : "var(--status-success-text)", marginTop: "2px" }}>
              {predictedCompletionDate}
            </div>
          </div>
        </div>

        {/* Visual Progress Trajectory Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", marginBottom: "6px", fontWeight: 600 }}>
            <span>Statutory Timeline Progress ({progressPercent}% of 365-day limit)</span>
            <span style={{ color: isDelayed ? "var(--status-danger-text)" : "var(--gov-primary)" }}>
              Physical Executed: {project.physicalProgress}%
            </span>
          </div>

          <div style={{ position: "relative", width: "100%", background: "#e2e8f0", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPercent}%`,
                background: progressPercent > 90 ? "var(--status-danger-text)" : "var(--gov-primary)",
                height: "100%",
                transition: "width 0.3s ease"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginTop: "4px", color: "var(--text-muted)" }}>
            <span>Day 0 (Sanction)</span>
            <span>Day 182 (Mid-Term)</span>
            <span>Day 365 (Statutory Ceiling)</span>
          </div>
        </div>

        {/* AI Forecast Explanation */}
        <div style={{ marginTop: "14px", padding: "10px 12px", background: "var(--status-info-bg)", border: "1px solid var(--status-info-border)", borderRadius: "var(--radius-xs)", fontSize: "0.78rem", color: "var(--status-info-text)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, marginBottom: "2px" }}>
            <Calendar size={14} />
            <span>AI Model Forecast Note:</span>
          </div>
          <div>
            Based on historical district burn rates and contractor physical velocity (delay ratio: {delayRatio.toFixed(2)}x), estimated completion is projected for <strong>{predictedCompletionDate}</strong>.
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ProjectTimeline;
