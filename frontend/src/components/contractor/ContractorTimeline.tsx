import React from "react";
import { Clock, CheckCircle2, AlertCircle, ArrowDown, Upload, FileText, MapPin, ShieldCheck } from "lucide-react";
import { ContractorProject, MonitoringScheduleItem } from "../../data/contractorData";
import { calculateMonitoringSchedule } from "../../utils/aiTimelineGenerator";
import { Button } from "../ui/Button";

interface ContractorTimelineProps {
  project: ContractorProject;
  onSubmitStageEvidence?: (stage: MonitoringScheduleItem) => void;
}

export const ContractorTimeline: React.FC<ContractorTimelineProps> = ({ 
  project,
  onSubmitStageEvidence 
}) => {
  const scheduleData = project.schedule && project.schedule.length > 0 
    ? project.schedule 
    : calculateMonitoringSchedule({
        workId: project.id,
        officialStartDate: project.officialStartDate,
        officialExpectedCompletionDate: project.officialExpectedCompletionDate,
        category: project.category
      }).stages;

  const formatRs = (amtRs: number) => {
    if (amtRs >= 10000000) return `₹${(amtRs / 10000000).toFixed(2)} Cr`;
    return `₹${(amtRs / 100000).toFixed(2)} Lakh`;
  };

  return (
    <div className="gov-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header & Notice */}
      <div style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
              Interactive Project Stage Monitoring Timeline ({scheduleData.length} Stages)
            </h3>
            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Work Duration Schedule: <strong>{project.officialStartDate}</strong> to <strong>{project.officialExpectedCompletionDate}</strong>
            </div>
          </div>
          <span className="gov-badge gov-badge-info">
            STAGE-PERIOD MONITORING
          </span>
        </div>

        <div
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            background: "var(--status-info-bg)",
            border: "1px solid var(--status-info-border)",
            borderRadius: "var(--radius-xs)",
            fontSize: "0.74rem",
            color: "var(--status-info-text)",
            lineHeight: 1.4
          }}
        >
          <strong>Notice:</strong> Submit geo-tagged photographs, invoices, physical progress %, and expenditure for each specific stage during or at the end of its designated time window.
        </div>
      </div>

      {/* Visual Interactive Stage Flow */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {scheduleData.map((stage, idx) => {
          const isCompleted = stage.status === "COMPLETED";
          const isCurrent = stage.status === "IN_PROGRESS";
          const isLast = idx === scheduleData.length - 1;
          const rec = stage.submissionRecord;

          return (
            <div key={stage.stageId || idx} style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  padding: "16px",
                  borderRadius: "var(--radius-xs)",
                  border: isCurrent
                    ? "1px solid var(--gov-primary)"
                    : "1px solid var(--border-light)",
                  background: isCurrent
                    ? "var(--status-info-bg)"
                    : isCompleted
                      ? "var(--bg-surface-subtle)"
                      : "var(--bg-surface)"
                }}
              >
                {/* Stage Index Icon */}
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: isCompleted
                      ? "#10b981"
                      : isCurrent
                        ? "#3b82f6"
                        : "#94a3b8",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    flexShrink: 0
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={19} /> : idx + 1}
                </div>

                {/* Stage Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
                        {stage.stageName}
                      </h4>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        Designated Period: <strong style={{ color: "var(--text-main)" }}>{stage.scheduledStartDate} – {stage.scheduledEndDate}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--gov-primary)", background: "#e0f2fe", padding: "3px 10px", borderRadius: "4px" }}>
                        Target: {stage.targetProgressPercent}%
                      </span>
                      <span className={`gov-badge ${isCompleted ? "gov-badge-success" : isCurrent ? "gov-badge-info" : "gov-badge-warning"}`}>
                        {stage.status}
                      </span>
                    </div>
                  </div>

                  {/* Required Evidence Items Checklist */}
                  <div style={{ marginTop: "10px", fontSize: "0.76rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                      Required Verification Evidence:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {stage.requiredEvidenceTypes.map((ev, i) => (
                        <span
                          key={i}
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-main)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            color: "var(--text-body)"
                          }}
                        >
                          • {ev}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Inline Submitted Evidence Card if present */}
                  {rec && (
                    <div
                      style={{
                        marginTop: "12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--status-success-border)",
                        borderRadius: "4px",
                        padding: "10px 12px",
                        fontSize: "0.76rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                        <div style={{ fontWeight: 700, color: "var(--status-success-text)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <CheckCircle2 size={14} />
                          <span>Submitted Stage Evidence ({rec.uploadTimestamp})</span>
                        </div>
                        <span className={`gov-badge ${rec.verificationStatus === "Verified" ? "gov-badge-success" : "gov-badge-warning"}`}>
                          {rec.verificationStatus.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ color: "var(--text-body)", marginTop: "4px" }}>
                        Reported Physical Progress: <strong>{rec.physicalProgressPercent}%</strong> | Expenditure: <strong>{formatRs(rec.expenditureAmountRs)}</strong>
                      </div>
                      <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                        Files Attached: {rec.files ? rec.files.length : 0} files ({rec.files ? rec.files.map(f => f.name).join(", ") : "Evidence file"})
                      </div>
                      {rec.locationText && (
                        <div style={{ color: "var(--status-info-text)", marginTop: "2px" }}>
                          📍 {rec.locationText}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Stage Evidence Button */}
                  {onSubmitStageEvidence && (
                    <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        variant={isCompleted ? "secondary" : "primary"}
                        size="sm"
                        onClick={() => onSubmitStageEvidence(stage)}
                        icon={<Upload size={13} />}
                      >
                        {isCompleted ? "Update / Submit Additional Evidence" : `Submit Evidence for Stage ${idx + 1}`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Connecting Down Arrow */}
              {!isLast && (
                <div style={{ display: "flex", justifyContent: "flex-start", paddingLeft: "24px", margin: "3px 0" }}>
                  <ArrowDown size={18} color="var(--border-dark)" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
