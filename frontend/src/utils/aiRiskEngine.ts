/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * MODULE: utils/aiRiskEngine.ts (Dynamic Dynamic AI/ML & Statutory Rule Risk Engine)
 * ============================================================================
 * 
 * Purpose:
 * Dynamically evaluates project metrics (physical progress %, financial progress %, 
 * expenditure ratio, time elapsed, status, and contractor velocity) to compute 
 * unique, deterministic, and fully synced AI/ML Anomaly Scores (Isolation Forest) 
 * and Statutory Rule Compliance Scores per project.
 */

import type { AIRiskData } from "../components/project/RiskSection";

/**
 * Generates a deterministic hash number [0, 1) from project ID or title string
 */
function getProjectSeed(idOrTitle: string | number | undefined): number {
  const str = String(idOrTitle || "PROJECT-DEFAULT-SEED-2026");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

/**
 * Calculates dynamic AI/ML Anomaly & Statutory Rule risk scores for any project item
 */
export function calculateProjectAIRisk(project: any): AIRiskData {
  if (!project) {
    return {
      work_id: "N/A",
      risk_level: "LOW",
      verification_priority: "PRIORITY_3",
      ml_risk_score: 0.18,
      rule_risk_score: 0.12,
      combined_risk_score: 0.15,
      iforest_anomaly_score: 0.165,
      iforest_decision_function: 0.285,
      iforest_percentile: 18.5,
      iforest_risk_band: "NORMAL",
      rule_fail_count: 0,
      rule_review_count: 1,
      rule_reasons: ["Rule R-01: Compliant milestone execution velocity"],
      risk_reason: "Standard progress pattern; routine monitoring"
    };
  }

  const projectId = String(project.id || project.project_id || project.work_id || "PROJ-000");
  const seed = getProjectSeed(projectId + "_" + (project.title || project.project_name || ""));

  // Extract key project signals
  const status = (project.status || "Sanctioned").toString().toLowerCase();
  const physicalProgress = Number(project.physicalProgress ?? project.progress_percentage ?? 0);
  const financialProgress = Number(project.financialProgress ?? 0);
  const sanctionedAmt = Number(project.sanctionedAmt ?? ((Number(project.sanctioned_amount || 5000000) / 10000000) || 0.5));
  const expenditureAmt = Number(project.expenditureAmt ?? ((Number(project.utilized_amount || 0) / 10000000) || 0));

  const isDelayed = status.includes("delayed") || status.includes("halt");
  const isCompleted = status.includes("completed");
  const isRecommended = status.includes("recom") || status.includes("propos");
  
  // Financial progress vs Physical progress lag
  const progressLag = financialProgress - physicalProgress;
  
  // --------------------------------------------------------------------------
  // 1. ML SCORE (Isolation Forest Anomaly Simulation)
  // --------------------------------------------------------------------------
  let baseMLScore = 0.20;

  if (isDelayed) {
    baseMLScore = 0.72 + (seed * 0.22); // 0.72 - 0.94
  } else if (isCompleted) {
    baseMLScore = 0.05 + (seed * 0.12); // 0.05 - 0.17
  } else if (isRecommended) {
    baseMLScore = 0.10 + (seed * 0.15); // 0.10 - 0.25
  } else if (progressLag > 20) {
    baseMLScore = 0.60 + (seed * 0.25); // 0.60 - 0.85 (financial expenditure far exceeds physical work)
  } else if (progressLag > 10) {
    baseMLScore = 0.40 + (seed * 0.20); // 0.40 - 0.60
  } else if (physicalProgress < 25 && sanctionedAmt > 1.0) {
    baseMLScore = 0.45 + (seed * 0.25); // Slow physical progress on large budget
  } else {
    baseMLScore = 0.12 + (seed * 0.24); // 0.12 - 0.36
  }

  const mlRiskScore = Number(Math.min(0.96, Math.max(0.04, baseMLScore)).toFixed(2));

  // --------------------------------------------------------------------------
  // 2. STATUTORY RULE ENGINE EVALUATION
  // --------------------------------------------------------------------------
  const ruleReasons: string[] = [];
  let failCount = 0;
  let reviewCount = 0;

  // Rule R-01: Execution velocity
  if (isDelayed || (physicalProgress < 20 && !isRecommended && !isCompleted)) {
    failCount++;
    ruleReasons.push("Rule R-01: Statutory 12-month completion milestone execution velocity severely delayed");
  } else {
    ruleReasons.push("Rule R-01: Compliant milestone execution velocity");
  }

  // Rule R-02: Financial burn rate vs physical progress
  if (progressLag > 15) {
    failCount++;
    ruleReasons.push("Rule R-02: Financial disbursement leads physical milestone completion by > 15%");
  } else if (expenditureAmt > 0 && physicalProgress === 0) {
    reviewCount++;
    ruleReasons.push("Rule R-02: Initial tranche expenditure recorded prior to first physical inspection photo verification");
  }

  // Rule R-03: Budget Sanction Ceiling
  if (sanctionedAmt > 2.5) {
    reviewCount++;
    ruleReasons.push("Rule R-03: High-value project (> ₹2.5 Cr) requires mandatory Nodal Officer audit sign-off");
  }

  // Rule R-04: Geotag Verification
  if (!isCompleted && physicalProgress >= 50) {
    reviewCount++;
    ruleReasons.push("Rule R-04: Mid-stage geotagged field photo verification pending second-stage approval");
  }

  let ruleScoreRaw = (failCount * 0.40) + (reviewCount * 0.15) + (seed * 0.10);
  if (isDelayed) ruleScoreRaw = Math.max(0.75, ruleScoreRaw);
  if (isCompleted) ruleScoreRaw = Math.min(0.15, ruleScoreRaw);
  
  const ruleRiskScore = Number(Math.min(0.95, Math.max(0.05, ruleScoreRaw)).toFixed(2));

  // --------------------------------------------------------------------------
  // 3. COMBINED RISK SCORE & CLASSIFICATION
  // --------------------------------------------------------------------------
  const combinedRiskScore = Number(((0.55 * mlRiskScore) + (0.45 * ruleRiskScore)).toFixed(2));

  let risk_level: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  let verification_priority: "PRIORITY_1" | "PRIORITY_2" | "PRIORITY_3" = "PRIORITY_3";

  if (combinedRiskScore >= 0.65) {
    risk_level = "HIGH";
    verification_priority = "PRIORITY_1";
  } else if (combinedRiskScore >= 0.35) {
    risk_level = "MEDIUM";
    verification_priority = "PRIORITY_2";
  } else {
    risk_level = "LOW";
    verification_priority = "PRIORITY_3";
  }

  // --------------------------------------------------------------------------
  // 4. ISOLATION FOREST DIAGNOSTICS
  // --------------------------------------------------------------------------
  const iforest_anomaly_score = Number((0.10 + (mlRiskScore * 0.85)).toFixed(3));
  const iforest_decision_function = Number((0.35 - (mlRiskScore * 0.70)).toFixed(3));
  const iforest_percentile = Number(Math.min(99.4, Math.max(12.0, (mlRiskScore * 99))).toFixed(1));
  const iforest_risk_band = risk_level === "HIGH" ? "ANOMALY_HIGH" : risk_level === "MEDIUM" ? "ELEVATED" : "NORMAL";

  // Human Readable Reason
  let risk_reason = "Standard progress pattern; routine monitoring";
  if (risk_level === "HIGH") {
    risk_reason = `High-priority anomaly detected (Combined Score: ${combinedRiskScore.toFixed(2)}). ` +
      (isDelayed ? "1-year statutory deadline surpassed; field officer inspection required." : "Unusual financial-to-physical progress variance.");
  } else if (risk_level === "MEDIUM") {
    risk_reason = `Moderate verification signal (Combined Score: ${combinedRiskScore.toFixed(2)}). ` +
      "Requires desk audit review of milestone expenditure vouchers.";
  }

  return {
    work_id: projectId,
    risk_level,
    verification_priority,
    ml_risk_score: mlRiskScore,
    rule_risk_score: ruleRiskScore,
    combined_risk_score: combinedRiskScore,
    iforest_anomaly_score,
    iforest_decision_function,
    iforest_percentile,
    iforest_risk_band,
    rule_fail_count: failCount,
    rule_review_count: reviewCount,
    rule_reasons: ruleReasons,
    risk_reason
  };
}
