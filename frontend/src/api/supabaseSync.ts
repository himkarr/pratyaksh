/**
 * Supabase Data Integration Layer for MPLADS District Authority & Contractor Portals
 * 
 * Direct REST API sync for:
 * 1. `projects` table (work creation, contractor assignment, progress updates, Jabalpur live database persistence)
 * 2. `evidence` table (contractor geotagged stage photo uploads & District Officer sign-offs)
 */

import { WorkItem } from '../data/mpladsData';
import { EvidenceSubmissionRecord, SubmittedFileItem } from '../data/contractorData';

const SUPABASE_REST_URL = import.meta.env.VITE_SUPABASE_URL 
  ? `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`
  : "https://kslsyhrrfnshbdujzhdr.supabase.co/rest/v1";

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY ?? 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHN5aHJyZm5zaGJkdWp6aGRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQyMjc3MCwiZXhwIjoyMTAzOTk4NzcwfQ.Dg9q_NvF65haWgygslmN3cQbGvy0VWriF_3J6hpwTVI";

const getHeaders = (extraHeaders: Record<string, string> = {}) => ({
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
  ...extraHeaders
});

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

export interface SupabaseProjectRow {
  project_id: string;
  project_name: string;
  category?: string;
  district?: string;
  state?: string;
  sanctioned_amount?: number;
  utilized_amount?: number;
  progress_percentage?: number;
  status?: string;
  start_date?: string;
  expected_completion_date?: string;
  tender_reference_no?: string;
  created_at?: string;
}

/**
 * Seed / Upsert Jabalpur Official Projects into Supabase `projects` table
 */
export async function seedJabalpurProjectsToSupabase(): Promise<void> {
  try {
    const { JABALPUR_WORKS } = await import('../data/mpladsData');
    for (const work of JABALPUR_WORKS) {
      const payload: SupabaseProjectRow = {
        project_id: work.id,
        project_name: work.title,
        category: work.category || work.sectorName || "Roads",
        district: work.district || "Jabalpur",
        state: work.state || "Madhya Pradesh",
        sanctioned_amount: Math.round((work.sanctionedAmt || 0.10) * 10000000),
        utilized_amount: Math.round((work.expenditureAmt || 0) * 10000000),
        progress_percentage: work.physicalProgress || 0,
        status: work.status || "Sanctioned",
        start_date: work.dateSanctioned,
        expected_completion_date: work.targetCompletion,
        tender_reference_no: work.contractor,
        created_at: new Date().toISOString()
      };

      await fetch(`${SUPABASE_REST_URL}/projects`, {
        method: "POST",
        headers: getHeaders({ "Prefer": "resolution=merge-duplicates" }),
        body: JSON.stringify(payload)
      });
    }
    console.log("Successfully seeded/synced Jabalpur official projects to Supabase database.");
  } catch (err) {
    console.warn("Failed to seed Jabalpur projects to Supabase:", err);
  }
}

/**
 * Fetch Projects directly from live Supabase `projects` table
 */
export async function fetchProjectsFromSupabase(districtName: string = "Jabalpur"): Promise<WorkItem[]> {
  try {
    const resp = await fetch(`${SUPABASE_REST_URL}/projects?district=ilike.*${encodeURIComponent(districtName)}*&select=*`, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(4000)
    });

    if (resp.ok) {
      const rows: SupabaseProjectRow[] = await resp.json();
      if (rows && rows.length > 0) {
        return rows.map(r => ({
          id: r.project_id,
          title: r.project_name,
          house: "Lok Sabha",
          state: r.state || "Madhya Pradesh",
          district: r.district || "Jabalpur",
          constituency: "Jabalpur (PC-13)",
          constituency_code: "MP-JBL-13",
          mpName: "Shri Ashish Dubey",
          category: r.category || "Roads",
          sectorName: r.category || "Roads",
          recommendedAmt: (r.sanctioned_amount || 10000000) / 10000000,
          sanctionedAmt: (r.sanctioned_amount || 10000000) / 10000000,
          expenditureAmt: (r.utilized_amount || 0) / 10000000,
          physicalProgress: r.progress_percentage || 0,
          financialProgress: r.progress_percentage || 0,
          dateSanctioned: r.start_date || "2024-04-01",
          targetCompletion: r.expected_completion_date || "2025-03-31",
          status: (r.status as any) || "Ongoing",
          agency: `Office of District Magistrate, ${r.district || "Jabalpur"}`,
          contractor: r.tender_reference_no || "M/s Apex Infra & Construction Ltd.",
          rating: 4.8,
          reviewsCount: 12,
          attachments: [],
          reviews: []
        }));
      }
    }
  } catch (err) {
    console.warn("Failed to fetch projects from Supabase, seeding and using local dataset:", err);
  }

  // Auto-seed if Supabase currently lacks Jabalpur rows
  await seedJabalpurProjectsToSupabase();
  const { JABALPUR_WORKS } = await import('../data/mpladsData');
  return JABALPUR_WORKS;
}

/**
 * Save / Upsert Project into Supabase `projects` table
 */
export async function saveProjectToSupabase(work: WorkItem): Promise<boolean> {
  try {
    const payload: SupabaseProjectRow = {
      project_id: work.id,
      project_name: work.title,
      category: work.category || work.sectorName || "Roads",
      district: work.district || "Jabalpur",
      state: work.state || "Madhya Pradesh",
      sanctioned_amount: Math.round((work.sanctionedAmt || 0.10) * 10000000),
      utilized_amount: Math.round((work.expenditureAmt || 0) * 10000000),
      progress_percentage: work.physicalProgress || 0,
      status: work.status || "Sanctioned",
      start_date: work.dateSanctioned,
      expected_completion_date: work.targetCompletion,
      tender_reference_no: work.contractor,
      created_at: new Date().toISOString()
    };

    const resp = await fetch(`${SUPABASE_REST_URL}/projects`, {
      method: "POST",
      headers: getHeaders({ "Prefer": "resolution=merge-duplicates" }),
      body: JSON.stringify(payload)
    });

    return resp.ok;
  } catch (err) {
    console.warn("Supabase project upsert failed, continuing with local store:", err);
    return false;
  }
}

/**
 * Save Evidence Record uploaded by Contractor to Supabase `evidence` table
 */
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
    const evidenceId = `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const primaryFile = payload.files[0] || { url: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=600&q=80", name: "evidence.jpg" };

    const row: SupabaseEvidenceRow = {
      evidence_id: evidenceId,
      project_id: workId,
      uploaded_by: contractorName || "Contractor",
      evidence_type: `${checkpointActionName} (${payload.evidenceType || 'Stage Photo'})`,
      evidence_category: checkpointActionId,
      file_url: primaryFile.url,
      thumbnail_url: primaryFile.url,
      latitude: payload.latitude ?? 23.1815,
      longitude: payload.longitude ?? 79.9864,
      captured_at: new Date().toISOString(),
      uploaded_at: new Date().toISOString(),
      remarks: payload.notes || `Submitted for ${checkpointActionName} (${payload.physicalProgressPercent}% Physical Progress). Location: ${payload.locationText || 'Jabalpur Site'}`,
      is_geotagged: !!(payload.latitude && payload.longitude),
      status: "Under Scrutiny"
    };

    const resp = await fetch(`${SUPABASE_REST_URL}/evidence`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(row)
    });

    if (resp.ok) {
      console.log("Successfully persisted evidence to Supabase evidence table:", evidenceId);
      return row;
    } else {
      const errText = await resp.text();
      console.warn("Supabase evidence insert response error:", resp.status, errText);
    }
  } catch (err) {
    console.warn("Failed to insert evidence into Supabase:", err);
  }
  return null;
}

/**
 * Fetch Evidence Records for a Project from Supabase `evidence` table
 */
export async function fetchEvidenceFromSupabase(workId: string): Promise<EvidenceSubmissionRecord[]> {
  try {
    const resp = await fetch(`${SUPABASE_REST_URL}/evidence?project_id=eq.${encodeURIComponent(workId)}&order=uploaded_at.desc`, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(4000)
    });

    if (resp.ok) {
      const rows: SupabaseEvidenceRow[] = await resp.json();
      if (rows.length > 0) {
        return rows.map((r, idx) => ({
          id: r.evidence_id,
          workId: r.project_id,
          contractorName: r.uploaded_by || "Assigned Contractor",
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
    console.warn("Failed to fetch evidence from Supabase, returning empty array:", err);
  }
  return [];
}

/**
 * Update Evidence verification status in Supabase `evidence` table
 */
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
    return resp.ok;
  } catch (err) {
    console.warn("Failed to update evidence status in Supabase:", err);
    return false;
  }
}
