import React from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { ContractorProject } from "../../data/contractorData";

interface ProgressTrackerProps {
  project: ContractorProject;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ project }) => {
  const actual = project.physicalProgress;

  return (
    <div className="gov-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
          Physical Progress Verification
        </h3>
        <span className={`gov-badge ${actual === 100 ? "gov-badge-success" : "gov-badge-info"}`}>
          PROGRESS: {actual}%
        </span>
      </div>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
        <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>REPORTED PHYSICAL PROGRESS</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--gov-accent)", marginTop: "2px" }}>
            {actual}%
          </div>
        </div>

        <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>OFFICIAL START DATE</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "4px" }}>
            {project.officialStartDate}
          </div>
        </div>

        <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>EXPECTED COMPLETION</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "4px" }}>
            {project.officialExpectedCompletionDate}
          </div>
        </div>
      </div>

      {/* Progress Bar Visualization */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", fontWeight: 700, marginBottom: "4px" }}>
          <span>Physical Progress Bar</span>
          <span>{actual}% Completed</span>
        </div>
        <div style={{ position: "relative", height: "12px", background: "#e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.min(100, actual)}%`,
              height: "100%",
              background: actual === 100 ? "#10b981" : "#3b82f6"
            }}
          />
        </div>
      </div>

      {/* Schedule Flow */}
      <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
        <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
          Authority Schedule Timeline
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", fontSize: "0.78rem" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Official Start</div>
            <div style={{ fontWeight: 700 }}>{project.officialStartDate}</div>
          </div>

          <span style={{ color: "var(--border-dark)" }}>➔</span>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Current Progress</div>
            <div style={{ fontWeight: 700, color: "var(--gov-accent)" }}>{actual}%</div>
          </div>

          <span style={{ color: "var(--border-dark)" }}>➔</span>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Expected Completion</div>
            <div style={{ fontWeight: 700 }}>{project.officialExpectedCompletionDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
