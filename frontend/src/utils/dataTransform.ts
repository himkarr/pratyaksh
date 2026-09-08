/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * MODULE: utils/dataTransform.ts (Data Normalization & Adapter Layer)
 * ============================================================================
 * 
 * Purpose:
 * Transforms live FastAPI database responses into the standard UI WorkItem
 * and view model interfaces required by existing dashboard components.
 */

import type { WorkItem, WorkAttachment, WorkReview } from "../data/mpladsData";
import type { BackendProject, PublicProject } from "../api/types";

/**
 * Normalizes backend project status to UI status enum
 */
export function normalizeStatus(
  status: string
): 'Sanctioned' | 'Ongoing' | 'Completed' | 'Delayed' | 'Recommended' {
  const norm = (status || "").toLowerCase();
  if (norm.includes("completed")) return "Completed";
  if (norm.includes("delayed") || norm.includes("halt")) return "Delayed";
  if (norm.includes("inprogress") || norm.includes("ongoing") || norm.includes("execution")) return "Ongoing";
  if (norm.includes("proposed") || norm.includes("recommend")) return "Recommended";
  return "Sanctioned";
}

/**
 * Transforms BackendProject or PublicProject from FastAPI into UI WorkItem
 */
export function transformProjectToWorkItem(
  p: BackendProject | PublicProject | any
): WorkItem {
  const sanctionedAmtRs = p.sanctioned_amount ?? 5000000;
  const utilizedAmtRs = p.utilized_amount ?? 0;
  const recommendedAmtRs = p.recommended_amount ?? sanctionedAmtRs;

  // Convert Rupees to Crores for UI display (e.g. 5,00,00,000 Rs = 5.0 Cr)
  const sanctionedAmtCr = Number((sanctionedAmtRs / 10000000).toFixed(2));
  const expenditureAmtCr = Number((utilizedAmtRs / 10000000).toFixed(2));
  const recommendedAmtCr = Number((recommendedAmtRs / 10000000).toFixed(2));

  const physicalProgress = p.progress_percentage ?? 0;
  const financialProgress =
    sanctionedAmtRs > 0
      ? Math.min(100, Math.round((utilizedAmtRs / sanctionedAmtRs) * 100))
      : 0;

  return {
    id: String(p.project_id || p.id),
    title: p.project_name || "Infrastructure Development Project",
    house: "Lok Sabha",
    state: p.state || "Maharashtra",
    district: p.district || "Pune",
    constituency: p.district ? `${p.district} Constituency` : "Pune Constituency",
    constituency_code: "AST-01",
    mpName: p.mp_name || "Hon. Member of Parliament",
    category: p.category || "Community Infrastructure",
    sectorName: p.category || "Infrastructure",
    recommendedAmt: recommendedAmtCr > 0 ? recommendedAmtCr : 0.5,
    sanctionedAmt: sanctionedAmtCr > 0 ? sanctionedAmtCr : 0.5,
    expenditureAmt: expenditureAmtCr,
    physicalProgress,
    financialProgress,
    dateSanctioned: p.start_date || (p.created_at ? p.created_at.split("T")[0] : "2024-04-01"),
    targetCompletion: p.expected_completion_date || "2025-03-31",
    status: normalizeStatus(p.status),
    agency: p.implementing_agency_name || "Public Works Department",
    contractor: p.implementing_agency_name || "Registered Government Agency",
    rating: p.latest_risk_score
      ? Math.max(1, Number((5 - (p.latest_risk_score / 25)).toFixed(1)))
      : 4.8,
    reviewsCount: p.citizen_reports_count ?? 8,
    attachments: [],
    reviews: [],
  };
}
