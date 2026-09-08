/**
 * Official Project Monitoring Schedule Calculator
 * 
 * Computes 4 to 5 stage periodic monitoring checkpoints based on official
 * authority-provided project start date and expected completion date.
 * 
 * Explicitly designated as a MONITORING SCHEDULE for periodic evidence verification.
 */

import { MonitoringScheduleItem } from '../data/contractorData';

export interface ScheduleCalculationInput {
  workId: string;
  officialStartDate: string;
  officialExpectedCompletionDate: string;
  category?: string;
}

export interface CalculatedMonitoringSchedule {
  workId: string;
  officialStartDate: string;
  officialExpectedCompletionDate: string;
  totalDurationDays: number;
  stages: MonitoringScheduleItem[];
}

/**
 * Calculates a structured 4-5 stage monitoring schedule mathematically from official dates.
 */
export function calculateMonitoringSchedule(input: ScheduleCalculationInput): CalculatedMonitoringSchedule {
  const startDate = new Date(input.officialStartDate);
  const endDate = new Date(input.officialExpectedCompletionDate);

  const validStart = isNaN(startDate.getTime()) ? new Date("2026-09-01") : startDate;
  const validEnd = isNaN(endDate.getTime()) ? new Date("2027-02-28") : endDate;

  const totalDurationMs = Math.max(86400000 * 30, validEnd.getTime() - validStart.getTime());
  const totalDurationDays = Math.round(totalDurationMs / (1000 * 60 * 60 * 24));

  const formatDate = (d: Date): string => {
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const addDays = (d: Date, days: number): Date => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res;
  };

  // Determine stage templates (4 to 5 stages based on duration)
  let stageTemplates = [
    { name: "Stage 1 — Site Preparation & Initial Layout", target: 10, startRatio: 0.0, endRatio: 0.12, evidence: ["Geo-tagged site demarcation photo", "Initial survey report"] },
    { name: "Stage 2 — Earthwork & Subgrade Excavation", target: 30, startRatio: 0.13, endRatio: 0.35, evidence: ["Geo-tagged progress photo", "Material batch invoice"] },
    { name: "Stage 3 — Main Structural Execution Phase", target: 65, startRatio: 0.36, endRatio: 0.65, evidence: ["Structural concrete/steel photo", "Measurement Book (MB) voucher"] },
    { name: "Stage 4 — Finishing & Drainage Fixtures", target: 90, startRatio: 0.66, endRatio: 0.88, evidence: ["Finishing photographs", "Material quality certificate"] },
    { name: "Stage 5 — Final Inspection & Statutory Handover", target: 100, startRatio: 0.89, endRatio: 1.00, evidence: ["Final completion photo", "Completion NOC certificate"] }
  ];

  if (totalDurationDays <= 90) {
    stageTemplates = [
      { name: "Stage 1 — Site Prep & Demarcation", target: 20, startRatio: 0.0, endRatio: 0.20, evidence: ["Geo-tagged site demarcation photo"] },
      { name: "Stage 2 — Primary Execution Phase", target: 60, startRatio: 0.21, endRatio: 0.60, evidence: ["Geo-tagged progress photo", "Material invoice"] },
      { name: "Stage 3 — Finishing & Fixtures", target: 90, startRatio: 0.61, endRatio: 0.85, evidence: ["Finishing photographs"] },
      { name: "Stage 4 — Final Inspection & Handover", target: 100, startRatio: 0.86, endRatio: 1.00, evidence: ["Completion NOC certificate"] }
    ];
  }

  const stages: MonitoringScheduleItem[] = stageTemplates.map((stg, idx) => {
    const stgStart = addDays(validStart, Math.round(totalDurationDays * stg.startRatio));
    const stgEnd = addDays(validStart, Math.round(totalDurationDays * stg.endRatio));
    return {
      stageId: `stg-calc-${idx + 1}`,
      stageName: stg.name,
      targetProgressPercent: stg.target,
      scheduledStartDate: formatDate(stgStart),
      scheduledEndDate: formatDate(stgEnd),
      requiredEvidenceTypes: stg.evidence,
      status: idx === 0 ? "IN_PROGRESS" : "UPCOMING",
      submissionStatus: "Pending",
      submittedDate: null
    };
  });

  return {
    workId: input.workId,
    officialStartDate: formatDate(validStart),
    officialExpectedCompletionDate: formatDate(validEnd),
    totalDurationDays,
    stages
  };
}

export const generateMonitoringTimeline = calculateMonitoringSchedule;
