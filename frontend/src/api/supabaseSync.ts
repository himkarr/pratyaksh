/**
 * Supabase Data Integration Layer for MPLADS Unified Multi-Role Decision Support System
 * 
 * Direct REST API sync for:
 * 1. `projects` table (work creation, contractor assignment, progress updates, live database persistence)
 * 2. `recommendations` table (MP proposals & Citizen community recommendations)
 * 3. `evidence` table (contractor geotagged stage photo uploads & District Officer sign-offs)
 * 4. `verification_requests` table (Field Officer inspection assignments and reports)
 * 5. `audit_logs` table (immutable audit event trail across all portals)
 * 6. `notifications` table (real-time alerts across roles)
 */

import { WorkItem, JABALPUR_WORKS, ROHTAK_WORKS, GURUGRAM_WORKS } from '../data/mpladsData';
import { EvidenceSubmissionRecord, SubmittedFileItem } from '../data/contractorData';
import { CitizenIssue } from '../data/citizenData';
import { MPRecommendation } from '../data/mpData';

const SUPABASE_REST_URL = import.meta.env.VITE_SUPABASE_URL 
  ? `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`
  : "https://kslsyhrrfnshbdujzhdr.supabase.co/rest/v1";

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY ?? 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHN5aHJyZm5zaGJkdWp6aGRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQyMjc3MCwiZXhwIjoyMTAzOTk4NzcwfQ.Dg9q_NvF65haWgygslmN3cQbGvy0VWriF_3J6hpwTVI";

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback below
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function ensureUUID(id?: string): string {
  if (!id) return generateUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;
  return generateUUID();
}

const getHeaders = (extraHeaders: Record<string, string> = {}) => ({
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
  ...extraHeaders
});

/* ============================================================================
 * INTERFACES
 * ============================================================================ */

export interface SupabaseProjectRow {
  project_id: string;
  project_name: string;
  description?: string;
  category?: string;
  recommendation_id?: string;
  mp_id?: string;
  constituency_id?: string;
  district?: string;
  state?: string;
  sanctioned_amount?: number;
  released_amount?: number;
  utilized_amount?: number;
  progress_percentage?: number;
  status?: string;
  start_date?: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
  tender_reference_no?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  is_flagged?: boolean;
  latest_risk_score?: number;
  created_at?: string;
  updated_at?: string;
  implementing_agencies?: {
    agency_name?: string;
  };
}

export interface SupabaseEvidenceRow {
  evidence_id: string;
  project_id: string;
  uploaded_by?: string;
  evidence_type?: string;
  evidence_category?: string;
  file_url?: string;
  thumbnail_url?: string;
  latitude?: number;
  longitude?: number;
  captured_at?: string;
  uploaded_at?: string;
  remarks?: string;
  is_geotagged?: boolean;
  status?: string;
}

export interface SupabaseRecommendationRow {
  recommendation_id: string;
  mp_id: string;
  project_id?: string | null;
  recommendation_letter_url?: string | null;
  recommended_amount?: number;
  recommendation_date?: string;
  district_authority_ack_id?: string | null;
  status: string;
}

export interface SupabaseVerificationRow {
  verification_id: string;
  project_id: string;
  assigned_officer_id?: string | null;
  assigned_by?: string | null;
  priority_level?: string;
  status: string;
  site_visit_date?: string | null;
  verification_report?: string | null;
  gps_lat?: number | null;
  gps_long?: number | null;
  synced_at?: string | null;
  assigned_at?: string;
  completed_at?: string | null;
}

export interface SupabaseAuditLogRow {
  log_id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_value?: any;
  new_value?: any;
  ip_address?: string | null;
  timestamp?: string;
}

export interface SupabaseNotificationRow {
  notification_id: string;
  user_id: string;
  channel?: string;
  title: string;
  message: string;
  related_entity_type?: string;
  related_entity_id?: string;
  is_read: boolean;
  created_at?: string;
  sent_at?: string;
}

/* ============================================================================
 * 1. PROJECTS MODULE (Live Supabase Sync & Multi-District Seeding)
 * ============================================================================ */

/**
 * Seed / Upsert Official District Projects (Jabalpur, Rohtak, Gurugram) into Supabase `projects` table
 */
export async function seedJabalpurProjectsToSupabase(): Promise<void> {
  try {
    const allDistrictWorks = [...JABALPUR_WORKS, ...(ROHTAK_WORKS || []), ...(GURUGRAM_WORKS || [])];

    for (const work of allDistrictWorks) {
      await saveProjectToSupabase(work);
    }
    console.log("Successfully seeded/synced district official projects to Supabase database.");
  } catch (err) {
    console.warn("Failed to seed district projects to Supabase:", err);
  }
}

export async function fetchAllProjectsFromSupabase(limit: number = 300): Promise<WorkItem[]> {
  try {
    const resp = await fetch(`${SUPABASE_REST_URL}/projects?select=*,implementing_agencies(agency_name)&order=created_at.desc&limit=${limit}`, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(6000)
    });

    if (resp.ok) {
      const rows: SupabaseProjectRow[] = await resp.json();
      if (rows && rows.length > 0) {
        return rows.map((r, idx) => ({
          id: r.project_id || `P-${idx}`,
          title: r.project_name || "Public Infrastructure Work",
          house: "Lok Sabha",
          state: r.state || "Madhya Pradesh",
          district: r.district || "Jabalpur",
          constituency: r.district ? `${r.district} (PC-01)` : "Constituency (PC-01)",
          constituency_code: `PC-${r.state?.slice(0, 2).toUpperCase() || 'IN'}-01`,
          mpName: "District Parliamentary Representative",
          category: r.category || "Community Asset",
          sectorName: r.category || "Public Works",
          recommendedAmt: Number(r.sanctioned_amount || 1000000) / 10000000,
          sanctionedAmt: Number(r.sanctioned_amount || 1000000) / 10000000,
          expenditureAmt: Number(r.utilized_amount || 0) / 10000000,
          physicalProgress: r.progress_percentage || (r.status === "Completed" ? 100 : 40),
          financialProgress: Math.min(
            100,
            Math.round(((Number(r.utilized_amount || 0)) / Math.max(1, Number(r.sanctioned_amount || 1))) * 100) || 35
          ),
          dateSanctioned: r.start_date || "2024-04-01",
          targetCompletion: r.expected_completion_date || "2025-06-30",
          status: (r.status as any) || "Ongoing",
          agency: r.implementing_agencies?.agency_name || `Office of District Magistrate, ${r.district || "Authority"}`,
          contractor: r.tender_reference_no || "Authorized Implementing Contractor",
          rating: 4.8,
          reviewsCount: 1,
          attachments: [],
          reviews: []
        }));
      }
    }
  } catch (err) {
    console.warn("Failed to fetch all projects from Supabase:", err);
  }
  return [];
}

export async function fetchProjectsFromSupabase(districtName: string = "Jabalpur"): Promise<WorkItem[]> {
  try {
    let url = `${SUPABASE_REST_URL}/projects?select=*,implementing_agencies(agency_name)&order=created_at.desc&limit=250`;
    if (districtName && districtName.toLowerCase() !== "all") {
      url = `${SUPABASE_REST_URL}/projects?district=ilike.*${encodeURIComponent(districtName)}*&select=*,implementing_agencies(agency_name)&order=created_at.desc&limit=250`;
    }

    const resp = await fetch(url, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(5000)
    });

    if (resp.ok) {
      const rows: SupabaseProjectRow[] = await resp.json();
      if (rows && rows.length > 0) {
        return rows.map((r, idx) => ({
          id: r.project_id || `P-${idx}`,
          title: r.project_name || "Public Infrastructure Work",
          house: "Lok Sabha",
          state: r.state || (districtName.toLowerCase() === "jabalpur" ? "Madhya Pradesh" : "Haryana"),
          district: r.district || districtName,
          constituency: `${r.district || districtName} (PC-01)`,
          constituency_code: `PC-${r.state?.slice(0, 2).toUpperCase() || 'IN'}-01`,
          mpName: "District Parliamentary Representative",
          category: r.category || "Community Asset",
          sectorName: r.category || "Public Works",
          recommendedAmt: Number(r.sanctioned_amount || 1000000) / 10000000,
          sanctionedAmt: Number(r.sanctioned_amount || 1000000) / 10000000,
          expenditureAmt: Number(r.utilized_amount || 0) / 10000000,
          physicalProgress: r.progress_percentage || (r.status === "Completed" ? 100 : 35),
          financialProgress: Math.min(
            100,
            Math.round(((Number(r.utilized_amount || 0)) / Math.max(1, Number(r.sanctioned_amount || 1))) * 100) || 30
          ),
          dateSanctioned: r.start_date || "2024-04-01",
          targetCompletion: r.expected_completion_date || "2025-06-30",
          status: (r.status as any) || "Ongoing",
          agency: r.implementing_agencies?.agency_name || `Office of District Magistrate, ${r.district || districtName}`,
          contractor: r.tender_reference_no || "Authorized Implementing Contractor",
          rating: 4.8,
          reviewsCount: 1,
          attachments: [],
          reviews: []
        }));
      }
    }
  } catch (err) {
    console.warn("Failed to fetch district projects from Supabase:", err);
  }
  return [];
}

export async function saveProjectToSupabase(work: WorkItem): Promise<boolean> {
  try {
    const validProjectId = ensureUUID(work.id);
    const validRecId = ensureUUID();

    const payload: SupabaseProjectRow = {
      project_id: validProjectId,
      project_name: work.title,
      description: work.title,
      category: work.category || work.sectorName || "Roads",
      recommendation_id: validRecId,
      district: work.district || "Jabalpur",
      state: work.state || "Madhya Pradesh",
      sanctioned_amount: Math.round((work.sanctionedAmt || 0.10) * 10000000),
      released_amount: Math.round((work.sanctionedAmt || 0.10) * 10000000),
      utilized_amount: Math.round((work.expenditureAmt || 0) * 10000000),
      progress_percentage: work.physicalProgress || 0,
      status: work.status || "Sanctioned",
      start_date: work.dateSanctioned || new Date().toISOString().split("T")[0],
      expected_completion_date: work.targetCompletion || new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0],
      tender_reference_no: work.contractor || "M/s Apex Infra & Construction Ltd.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const resp = await fetch(`${SUPABASE_REST_URL}/projects`, {
      method: "POST",
      headers: getHeaders({ "Prefer": "resolution=merge-duplicates" }),
      body: JSON.stringify(payload)
    });

    if (resp.ok) {
      await logAuditEventInSupabase(
        "PROJECT_CREATED_OR_UPDATED",
        "projects",
        validProjectId,
        { title: work.title, district: work.district, amount: work.sanctionedAmt }
      );
      return true;
    }
  } catch (err) {
    console.warn("Supabase project upsert failed:", err);
  }
  return false;
}

export async function updateProjectProgressInSupabase(
  projectId: string,
  progressPercentage: number,
  expenditureAmtRs?: number,
  status?: string
): Promise<boolean> {
  try {
    const updateBody: any = {
      progress_percentage: progressPercentage,
      updated_at: new Date().toISOString()
    };
    if (expenditureAmtRs !== undefined) {
      updateBody.utilized_amount = expenditureAmtRs;
    }
    if (status) {
      updateBody.status = status;
    }

    const resp = await fetch(`${SUPABASE_REST_URL}/projects?project_id=eq.${encodeURIComponent(projectId)}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(updateBody)
    });

    if (resp.ok) {
      await logAuditEventInSupabase("PROJECT_PROGRESS_UPDATED", "projects", projectId, updateBody);
      return true;
    }
  } catch (err) {
    console.warn("Failed to update project progress in Supabase:", err);
  }
  return false;
}

/* ============================================================================
 * 2. RECOMMENDATIONS & CITIZEN ISSUES MODULE (Live Supabase Sync)
 * ============================================================================ */

export async function fetchRecommendationsFromSupabase(params?: { mpId?: string; district?: string }): Promise<MPRecommendation[]> {
  try {
    let url = `${SUPABASE_REST_URL}/recommendations?select=*&order=recommendation_date.desc&limit=100`;
    if (params?.mpId) {
      url = `${SUPABASE_REST_URL}/recommendations?mp_id=eq.${encodeURIComponent(params.mpId)}&order=recommendation_date.desc&limit=100`;
    }

    const resp = await fetch(url, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(5000)
    });

    if (resp.ok) {
      const rows: SupabaseRecommendationRow[] = await resp.json();
      if (rows && rows.length > 0) {
        return rows.map((r, idx) => ({
          id: r.recommendation_id,
          title: `MPLADS Recommended Work #${idx + 1}`,
          category: "Roads",
          estimatedCost: (r.recommended_amount ? Number(r.recommended_amount) / 10000000 : 0.5),
          sanctionedCost: r.status === "Sanctioned" ? (r.recommended_amount ? Number(r.recommended_amount) / 10000000 : 0.5) : undefined,
          location: params?.district ? `${params.district} Sub-division` : "District Ward",
          district: params?.district || "District",
          constituency: params?.district || "Constituency",
          constituency_code: "PC-01",
          mpName: "Hon'ble Member of Parliament",
          justification: `MP Recommendation letter registered under ref ${r.recommendation_letter_url || r.recommendation_id}`,
          status: (r.status === "Sanctioned" ? "SANCTIONED" : r.status === "Rejected" ? "REJECTED" : "PROPOSED") as any,
          dateProposed: r.recommendation_date || new Date().toISOString().split("T")[0],
          dateSanctioned: r.status === "Sanctioned" ? (r.recommendation_date || new Date().toISOString().split("T")[0]) : undefined
        }));
      }
    }
  } catch (err) {
    console.warn("Failed to fetch recommendations from Supabase:", err);
  }
  return [];
}

export async function saveRecommendationToSupabase(rec: {
  recommendation_id?: string;
  mp_id?: string;
  project_id?: string | null;
  recommended_amount?: number;
  project_name?: string;
  description?: string;
  category?: string;
  district?: string;
  state?: string;
  recommendation_letter_url?: string;
  status?: string;
}): Promise<boolean> {
  try {
    const recId = ensureUUID(rec.recommendation_id);
    const mpId = ensureUUID(rec.mp_id);

    const payload: SupabaseRecommendationRow = {
      recommendation_id: recId,
      mp_id: mpId,
      project_id: rec.project_id ? ensureUUID(rec.project_id) : null,
      recommendation_letter_url: rec.recommendation_letter_url || `https://docs.saphire.gov.in/recs/${recId}.pdf`,
      recommended_amount: rec.recommended_amount ? Math.round(rec.recommended_amount) : 2500000,
      recommendation_date: new Date().toISOString().split("T")[0],
      status: rec.status || "Pending"
    };

    const resp = await fetch(`${SUPABASE_REST_URL}/recommendations`, {
      method: "POST",
      headers: getHeaders({ "Prefer": "resolution=merge-duplicates" }),
      body: JSON.stringify(payload)
    });

    if (resp.ok) {
      await logAuditEventInSupabase(
        "RECOMMENDATION_SUBMITTED",
        "recommendations",
        recId,
        {
          project_name: rec.project_name || "Infrastructure Proposal",
          description: rec.description,
          category: rec.category,
          district: rec.district,
          state: rec.state,
          amount: rec.recommended_amount
        }
      );
      return true;
    }
  } catch (err) {
    console.warn("Failed to save recommendation in Supabase:", err);
  }
  return false;
}

export async function fetchCitizenIssuesFromSupabase(districtName?: string): Promise<CitizenIssue[]> {
  try {
    let url = `${SUPABASE_REST_URL}/audit_logs?action=in.(CITIZEN_ISSUE_SUBMITTED,CITIZEN_RECOMMENDATION_SUBMITTED)&order=timestamp.desc&limit=100`;
    const resp = await fetch(url, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(5000)
    });

    if (resp.ok) {
      const rows: SupabaseAuditLogRow[] = await resp.json();
      if (rows && rows.length > 0) {
        return rows.map((r, idx) => {
          const val = r.new_value || {};
          const isRec = r.action === "CITIZEN_RECOMMENDATION_SUBMITTED" || val.type === "work_recommendation";
          return {
            id: r.entity_id || r.log_id || `ISSUE-${idx}`,
            type: (isRec ? "work_recommendation" : "problem_report") as any,
            title: val.title || val.proposedWork || "Community Citizen Proposal",
            description: val.description || val.currentSituation || "Reported community issue or work recommendation.",
            category: val.category || "Road Repair",
            constituency: val.constituency || val.district || districtName || "Pune",
            district: val.district || districtName || "Pune",
            state: val.state || "Maharashtra",
            locationName: val.locationName || val.locationText || `${val.district || 'District'} Ward Area`,
            pincode: val.pincode || "411001",
            latitude: val.latitude || 18.5204,
            longitude: val.longitude || 73.8567,
            photos: val.photos || [],
            documents: val.documents || [],
            status: val.status || "UNDER_REVIEW",
            dateSubmitted: (r.timestamp ? r.timestamp.split("T")[0] : new Date().toISOString().split("T")[0]),
            lastUpdated: (r.timestamp ? r.timestamp.split("T")[0] : new Date().toISOString().split("T")[0]),
            officialResponse: val.officialResponse,
            assignedOfficer: val.assignedOfficer,
            submittedBy: val.submittedBy || "Concerned Citizen",
            contactNumber: val.contactNumber,
            currentSituation: val.currentSituation,
            proposedWork: val.proposedWork,
            estimatedBeneficiaries: val.estimatedBeneficiaries,
            urgencyLevel: val.urgencyLevel || "HIGH",
            stage: val.stage || "received"
          };
        });
      }
    }
  } catch (err) {
    console.warn("Failed to fetch citizen issues from Supabase audit logs:", err);
  }
  return [];
}

export async function saveCitizenIssueToSupabase(issue: CitizenIssue): Promise<boolean> {
  try {
    const validEntityId = ensureUUID(issue.id);
    const actionName = issue.type === "work_recommendation" 
      ? "CITIZEN_RECOMMENDATION_SUBMITTED" 
      : "CITIZEN_ISSUE_SUBMITTED";

    const ok = await logAuditEventInSupabase(
      actionName,
      "citizen_feedback",
      validEntityId,
      {
        ...issue,
        id: validEntityId,
        submittedAt: new Date().toISOString()
      }
    );

    if (issue.type === "work_recommendation") {
      await saveRecommendationToSupabase({
        recommendation_id: validEntityId,
        mp_id: ensureUUID(),
        project_name: issue.title,
        description: issue.description || issue.currentSituation,
        category: issue.category,
        district: issue.district,
        state: issue.state,
        recommended_amount: 2500000,
        status: "Pending"
      });
    }

    return ok;
  } catch (err) {
    console.warn("Failed to save citizen issue in Supabase:", err);
    return false;
  }
}

/* ============================================================================
 * 3. EVIDENCE MODULE (Contractor Geotagged Stage Evidence)
 * ============================================================================ */

export async function saveEvidenceToSupabase(
  workId: string,
  contractorName: string,
  checkpointActionId: string,
  checkpointActionName: string,
  payload: {
    evidenceType: string;
    files: SubmittedFileItem[];
    latitude: number | null;
    longitude: number | null;
    locationText?: string | null;
    physicalProgressPercent: number;
    expenditureAmountRs: number;
    notes?: string;
  }
): Promise<SupabaseEvidenceRow | null> {
  try {
    const evidenceId = ensureUUID();
    const projectId = ensureUUID(workId);
    const primaryFile = payload.files[0] || { 
      url: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=600&q=80", 
      name: "evidence.jpg" 
    };

    const row: SupabaseEvidenceRow = {
      evidence_id: evidenceId,
      project_id: projectId,
      uploaded_by: ensureUUID(),
      evidence_type: `${checkpointActionName} (${payload.evidenceType || 'Stage Photo'})`,
      evidence_category: checkpointActionId,
      file_url: primaryFile.url,
      thumbnail_url: primaryFile.url,
      latitude: payload.latitude ?? 23.1815,
      longitude: payload.longitude ?? 79.9864,
      captured_at: new Date().toISOString(),
      uploaded_at: new Date().toISOString(),
      remarks: payload.notes || `Submitted for ${checkpointActionName} (${payload.physicalProgressPercent}% Physical Progress). Contractor: ${contractorName}`,
      is_geotagged: !!(payload.latitude && payload.longitude),
      status: "Under Scrutiny"
    };

    const resp = await fetch(`${SUPABASE_REST_URL}/evidence`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(row)
    });

    if (resp.ok) {
      await updateProjectProgressInSupabase(
        projectId,
        payload.physicalProgressPercent,
        payload.expenditureAmountRs,
        payload.physicalProgressPercent >= 100 ? "Completed" : "Ongoing"
      );

      await logAuditEventInSupabase(
        "CONTRACTOR_EVIDENCE_SUBMITTED",
        "evidence",
        evidenceId,
        {
          projectId,
          contractor: contractorName,
          stage: checkpointActionName,
          progress: payload.physicalProgressPercent,
          fileUrl: primaryFile.url
        }
      );

      return row;
    }
  } catch (err) {
    console.warn("Failed to insert evidence into Supabase:", err);
  }
  return null;
}

export async function fetchEvidenceFromSupabase(workId?: string): Promise<EvidenceSubmissionRecord[]> {
  try {
    let url = `${SUPABASE_REST_URL}/evidence?select=*&order=uploaded_at.desc&limit=50`;
    if (workId) {
      url = `${SUPABASE_REST_URL}/evidence?project_id=eq.${encodeURIComponent(ensureUUID(workId))}&order=uploaded_at.desc&limit=50`;
    }

    const resp = await fetch(url, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(4000)
    });

    if (resp.ok) {
      const rows: SupabaseEvidenceRow[] = await resp.json();
      if (rows.length > 0) {
        return rows.map((r, idx) => ({
          id: r.evidence_id,
          workId: r.project_id,
          contractorName: "Assigned Project Contractor",
          checkpointActionId: r.evidence_category || `stage-${idx + 1}`,
          checkpointActionName: r.evidence_type?.split(' (')[0] || `Stage ${idx + 1} Evidence`,
          evidenceType: r.evidence_type || "Stage Evidence Photo",
          files: [
            {
              name: "Site Photo Evidence.jpg",
              url: r.file_url || "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=600&q=80",
              size: "2.4 MB",
              type: "image/jpeg",
              lat: r.latitude ?? 23.1815,
              lng: r.longitude ?? 79.9864,
              timestamp: r.captured_at ? new Date(r.captured_at).toLocaleString("en-GB") : new Date().toLocaleString("en-GB")
            }
          ],
          uploadTimestamp: r.captured_at ? new Date(r.captured_at).toLocaleString("en-GB") : new Date().toLocaleString("en-GB"),
          latitude: r.latitude ?? 23.1815,
          longitude: r.longitude ?? 79.9864,
          locationText: r.latitude ? `GPS: ${r.latitude.toFixed(4)}, ${r.longitude?.toFixed(4)}` : "Site GPS Location",
          physicalProgressPercent: 25 * (idx + 1),
          expenditureAmountRs: 500000,
          workStage: r.evidence_type || "On-site Execution",
          materialStatus: "Verified on site",
          description: r.remarks || "Geotagged evidence image submitted to Supabase.",
          submissionStatus: "Submitted",
          verificationStatus: (r.status as any) || "Under Scrutiny",
          verificationRemarks: r.remarks || "No remarks logged yet."
        }));
      }
    }
  } catch (err) {
    console.warn("Failed to fetch evidence from Supabase:", err);
  }
  return [];
}

export async function updateEvidenceStatusInSupabase(
  evidenceId: string,
  verificationStatus: 'Verified' | 'Rejected' | 'Under Scrutiny',
  remarks: string
): Promise<boolean> {
  try {
    const resp = await fetch(`${SUPABASE_REST_URL}/evidence?evidence_id=eq.${encodeURIComponent(evidenceId)}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        status: verificationStatus,
        remarks: remarks
      })
    });
    if (resp.ok) {
      await logAuditEventInSupabase("EVIDENCE_STATUS_UPDATED", "evidence", evidenceId, { status: verificationStatus, remarks });
      return true;
    }
  } catch (err) {
    console.warn("Failed to update evidence status in Supabase:", err);
  }
  return false;
}

/* ============================================================================
 * 4. FIELD VERIFICATION REQUESTS MODULE (Live Supabase Sync)
 * ============================================================================ */

export async function fetchVerificationRequestsFromSupabase(officerId?: string): Promise<any[]> {
  try {
    let url = `${SUPABASE_REST_URL}/verification_requests?select=*&order=assigned_at.desc&limit=50`;
    if (officerId) {
      url = `${SUPABASE_REST_URL}/verification_requests?assigned_officer_id=eq.${encodeURIComponent(officerId)}&order=assigned_at.desc&limit=50`;
    }

    const resp = await fetch(url, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(4000)
    });

    if (resp.ok) {
      const rows: SupabaseVerificationRow[] = await resp.json();
      return rows;
    }
  } catch (err) {
    console.warn("Failed to fetch verification requests from Supabase:", err);
  }
  return [];
}

export async function createVerificationRequestInSupabase(req: {
  project_id: string;
  assigned_officer_id?: string;
  priority_level?: string;
  instructions?: string;
}): Promise<boolean> {
  try {
    const verifId = ensureUUID();
    const payload: SupabaseVerificationRow = {
      verification_id: verifId,
      project_id: ensureUUID(req.project_id),
      assigned_officer_id: req.assigned_officer_id ? ensureUUID(req.assigned_officer_id) : ensureUUID(),
      assigned_by: ensureUUID(),
      priority_level: req.priority_level || "High",
      status: "Pending",
      assigned_at: new Date().toISOString()
    };

    const resp = await fetch(`${SUPABASE_REST_URL}/verification_requests`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    if (resp.ok) {
      await logAuditEventInSupabase("VERIFICATION_REQUESTED", "verification_requests", verifId, req);
      return true;
    }
  } catch (err) {
    console.warn("Failed to create verification request in Supabase:", err);
  }
  return false;
}

export async function completeVerificationInSupabase(
  verificationId: string,
  payload: {
    verification_report: string;
    gps_lat: number;
    gps_long: number;
    status?: string;
  }
): Promise<boolean> {
  try {
    const resp = await fetch(`${SUPABASE_REST_URL}/verification_requests?verification_id=eq.${encodeURIComponent(verificationId)}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        status: payload.status || "Completed",
        verification_report: payload.verification_report,
        gps_lat: payload.gps_lat,
        gps_long: payload.gps_long,
        completed_at: new Date().toISOString()
      })
    });

    if (resp.ok) {
      await logAuditEventInSupabase("VERIFICATION_COMPLETED", "verification_requests", verificationId, payload);
      return true;
    }
  } catch (err) {
    console.warn("Failed to complete verification in Supabase:", err);
  }
  return false;
}

/* ============================================================================
 * 5. AUDIT LOGS & NOTIFICATIONS (Immutable Trail)
 * ============================================================================ */

export async function logAuditEventInSupabase(
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: any
): Promise<boolean> {
  try {
    const logId = ensureUUID();
    const payload: SupabaseAuditLogRow = {
      log_id: logId,
      user_id: ensureUUID(),
      action: action,
      entity_type: entityType,
      entity_id: entityId ? ensureUUID(entityId) : null,
      new_value: details || {},
      ip_address: "127.0.0.1",
      timestamp: new Date().toISOString()
    };

    const resp = await fetch(`${SUPABASE_REST_URL}/audit_logs`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    return resp.ok;
  } catch (err) {
    console.warn("Failed to log audit event in Supabase:", err);
    return false;
  }
}

export async function fetchNotificationsFromSupabase(userId?: string): Promise<any[]> {
  try {
    let url = `${SUPABASE_REST_URL}/notifications?select=*&order=created_at.desc&limit=30`;
    if (userId) {
      url = `${SUPABASE_REST_URL}/notifications?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=30`;
    }

    const resp = await fetch(url, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(4000)
    });

    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn("Failed to fetch notifications from Supabase:", err);
  }
  return [];
}
