import React from "react";
import { Calendar, Clock, CheckCircle2, ShieldCheck, Activity } from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { ContractorProject, EvidenceSubmissionRecord } from "../../data/contractorData";
import { Card, CardHeader, CardBody, Badge } from "../ui";

export interface ProjectTimelineProps {
  project: WorkItem;
  contractorProject?: ContractorProject | null;
  stageSubmissions?: EvidenceSubmissionRecord[];
  predictedCompletionDate?: string;
  elapsedDays?: number;
  delayRatio?: number;
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  project,
  contractorProject,
  stageSubmissions = [],
  predictedCompletionDate: overridePredictedDate,
  elapsedDays: overrideElapsedDays,
  delayRatio: overrideDelayRatio
}) => {
  // 1. Physical Progress (prioritizing contractor's actual uploaded data)
  const physicalProgress = contractorProject?.physicalProgress ?? project.physicalProgress ?? 0;

  // 2. Sanction Date & Target Completion Date
  const sanctionDateStr = project.dateSanctioned || contractorProject?.officialStartDate || "2024-04-01";
  const targetDateStr = project.targetCompletion || contractorProject?.officialExpectedCompletionDate || "2025-03-31";

  // 3. Dynamic Elapsed Days calculation
  const calculateElapsedDays = (): number => {
    if (overrideElapsedDays !== undefined && overrideElapsedDays !== null) return overrideElapsedDays;
    try {
      const sanctionDate = new Date(sanctionDateStr);
      const today = new Date("2026-09-09");
      if (isNaN(sanctionDate.getTime())) return 120;
      const rawDiff = Math.floor((today.getTime() - sanctionDate.getTime()) / (1000 * 60 * 60 * 24));
      // Clamp elapsed days to valid timeline window for realistic velocity
      return Math.max(1, Math.min(rawDiff, 365));
    } catch {
      return 120;
    }
  };
  const elapsedDays = calculateElapsedDays();

  // 4. Dynamic Target Days calculation (Statutory 365-day ceiling)
  const calculateTargetDays = (): number => {
    try {
      const sanctionDate = new Date(sanctionDateStr);
      const targetDate = new Date(targetDateStr);
      if (isNaN(sanctionDate.getTime()) || isNaN(targetDate.getTime())) return 364;
      const diff = Math.floor((targetDate.getTime() - sanctionDate.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(90, Math.min(diff, 364));
    } catch {
      return 364;
    }
  };
  const targetDays = calculateTargetDays();

  // 5. Dynamic AI Velocity & Forecast Completion Date
  const computeForecast = () => {
    const isCompleted = physicalProgress >= 100 || project.status === "Completed";
    if (isCompleted) {
      return {
        predictedDate: targetDateStr,
        delayRatio: 1.0,
        isDelayed: false,
        statusText: "COMPLETED & CERTIFIED",
        badgeVariant: "success" as const
      };
    }

    if (overridePredictedDate && overrideDelayRatio !== undefined) {
      const isDelayed = overrideDelayRatio > 1.15 || project.status === "Delayed";
      return {
        predictedDate: overridePredictedDate,
        delayRatio: overrideDelayRatio,
        isDelayed,
        statusText: isDelayed ? "LIKELY DELAY" : "ON TRACK",
        badgeVariant: isDelayed ? ("danger" as const) : ("success" as const)
      };
    }

    // Contractor physical execution velocity rate (% progress / active day)
    // Bound minimum daily velocity to 0.25% per day to prevent unrealistic multi-decade projections
    const effectiveElapsed = Math.min(elapsedDays, 240);
    const rawVelocity = effectiveElapsed > 0 ? (physicalProgress / effectiveElapsed) : 0.35;
    const dailyVelocity = Math.max(0.25, rawVelocity);

    const remainingPercent = Math.max(0, 100 - physicalProgress);
    const estDaysToFinish = Math.min(300, Math.max(15, Math.ceil(remainingPercent / dailyVelocity)));

    const estCompletionObj = new Date("2026-09-09");
    estCompletionObj.setDate(estCompletionObj.getDate() + estDaysToFinish);
    const predictedDateStr = estCompletionObj.toISOString().split("T")[0];

    const totalProjectedDays = elapsedDays + estDaysToFinish;
    const calculatedRatio = Number((totalProjectedDays / Math.max(1, targetDays)).toFixed(2));
    const isDelayed = project.status === "Delayed" || (calculatedRatio > 1.30 && physicalProgress < 25 && elapsedDays > 250);

    return {
      predictedDate: predictedDateStr,
      delayRatio: calculatedRatio,
      isDelayed,
      statusText: isDelayed ? "LIKELY DELAY" : "ON TRACK",
      badgeVariant: isDelayed ? ("danger" as const) : (physicalProgress < 30 && elapsedDays > 200 ? ("warning" as const) : ("success" as const))
    };
  };

  const forecast = computeForecast();
  const progressPercent = Math.min(100, Math.round((Math.min(elapsedDays, targetDays) / targetDays) * 100));
  const submissionsList = contractorProject?.submissionRecords || stageSubmissions;
  const latestSubmission = submissionsList && submissionsList.length > 0 ? submissionsList[0] : null;

  return (
    <Card>
      <CardHeader
        title="Statutory 1-Year Timeline & AI Forecast"
        icon={<Clock size={16} />}
        actions={
          <Badge variant={forecast.badgeVariant}>
            {forecast.statusText}
          </Badge>
        }
      />

      <CardBody>
        {/* Timeline Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          <div style={{ background: "var(--bg-surface-subtle)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Sanction Date</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--gov-primary)", marginTop: "2px" }}>{sanctionDateStr}</div>
          </div>

          <div style={{ background: "var(--bg-surface-subtle)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Elapsed Days</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: forecast.isDelayed ? "var(--status-danger-text)" : "var(--gov-primary)", marginTop: "2px" }}>
              {elapsedDays} / {targetDays} Days
            </div>
          </div>

          <div style={{ background: "var(--bg-surface-subtle)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Target ({targetDays}-Day)</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--gov-primary)", marginTop: "2px" }}>{targetDateStr}</div>
          </div>

          <div style={{ background: "var(--bg-surface-subtle)", padding: "10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>AI Predicted Date</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: forecast.isDelayed ? "var(--status-danger-text)" : "var(--status-success-text)", marginTop: "2px" }}>
              {forecast.predictedDate}
            </div>
          </div>
        </div>

        {/* Visual Progress Trajectory Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", marginBottom: "6px", fontWeight: 600 }}>
            <span>Statutory Timeline Progress ({progressPercent}% of {targetDays}-day limit)</span>
            <span style={{ color: forecast.isDelayed ? "var(--status-danger-text)" : "var(--gov-primary)" }}>
              Physical Executed: <strong>{physicalProgress}%</strong>
            </span>
          </div>

          <div style={{ position: "relative", width: "100%", background: "#e2e8f0", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPercent}%`,
                background: forecast.isDelayed ? "var(--status-danger-text)" : "var(--gov-primary)",
                height: "100%",
                transition: "width 0.3s ease"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginTop: "4px", color: "var(--text-muted)" }}>
            <span>Day 0 (Sanction)</span>
            <span>Day 182 (Mid-Term)</span>
            <span>Day {targetDays} (Statutory Ceiling)</span>
          </div>
        </div>

        {/* AI Forecast Explanation Note synced with Contractor Uploads */}
        <div style={{ marginTop: "14px", padding: "10px 12px", background: "var(--status-info-bg)", border: "1px solid var(--status-info-border)", borderRadius: "var(--radius-xs)", fontSize: "0.78rem", color: "var(--status-info-text)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, marginBottom: "3px" }}>
            <Activity size={14} color="var(--gov-primary)" />
            <span>AI Predictive Model Velocity Synced with Contractor Evidence:</span>
          </div>
          <div>
            Synced with actual contractor uploads (Physical Executed: <strong>{physicalProgress}%</strong>{latestSubmission ? `, Latest Stage: ${latestSubmission.checkpointActionName || latestSubmission.workStage}` : ''}). Current physical velocity rate projects completion for <strong>{forecast.predictedDate}</strong> (delay index ratio: {forecast.delayRatio.toFixed(2)}x).
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ProjectTimeline;
