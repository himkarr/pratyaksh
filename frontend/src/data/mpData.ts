import { 
  fetchRecommendationsFromSupabase, 
  saveRecommendationToSupabase, 
  ensureUUID,
  logAuditEventInSupabase 
} from "../api/supabaseSync";

export interface MPRecommendation {
  id: string;
  title: string;
  category: "Drinking Water" | "Education" | "Roads" | "Health" | "Community Assets" | "Renewable Energy" | "Sports" | string;
  estimatedCost: number; // in Cr
  sanctionedCost?: number; // in Cr
  location: string;
  district: string;
  constituency: string;
  constituency_code: string;
  mpName: string;
  justification: string;
  status: "PROPOSED" | "UNDER_SCRUTINY" | "SANCTIONED" | "REJECTED";
  dateProposed: string;
  dateSanctioned?: string;
  districtNotes?: string;
  citizenRequestId?: string;
}

export const INITIAL_MP_RECOMMENDATIONS: MPRecommendation[] = [
  // Pune (MH-PUNE-01) - Hon'ble Murlidhar Mohol
  {
    id: "REC-MH-PUNE-2024-001",
    title: "Construction of Multi-Specialty Mobile Healthcare Van Facility",
    category: "Health",
    estimatedCost: 1.20,
    sanctionedCost: 1.20,
    location: "Kothrud & Karve Nagar Sub-districts",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    justification: "Fulfills urgent demand for mobile primary healthcare diagnostics in peri-urban areas.",
    status: "SANCTIONED",
    dateProposed: "2024-01-15",
    dateSanctioned: "2024-02-10",
    districtNotes: "Technical feasibility approved by District Health Officer. Sanction issued."
  },
  {
    id: "REC-MH-PUNE-2024-002",
    title: "Rooftop Solar PV Installation across 15 Zilla Parishad Schools",
    category: "Renewable Energy",
    estimatedCost: 0.85,
    sanctionedCost: 0.85,
    location: "Haveli & Pune Rural Blocks",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    justification: "Provides 24/7 uninterrupted green power for computer labs and digital smart classrooms.",
    status: "SANCTIONED",
    dateProposed: "2024-02-01",
    dateSanctioned: "2024-02-28",
    districtNotes: "Sanctioned under Green Energy Initiative. Vendor procurement underway."
  },
  {
    id: "REC-MH-PUNE-2024-003",
    title: "Augmentation of Overhead Water Tank Capacity & Feeder Pipeline",
    category: "Drinking Water",
    estimatedCost: 1.50,
    location: "Shivajinagar Ward 12",
    district: "Pune",
    constituency: "Pune",
    constituency_code: "MH-PUNE-01",
    mpName: "Murlidhar Mohol",
    justification: "Recommended based on citizen grievance regarding drinking water shortage.",
    status: "UNDER_SCRUTINY",
    dateProposed: "2024-05-12",
    districtNotes: "Under technical scrutiny by Executive Engineer, Public Health Engineering Dept.",
    citizenRequestId: "ISSUE-MH-2024-001"
  }
];

const MP_RECOMMENDATIONS_STORAGE_KEY = "mplads_mp_recommendations_v2";

export const getMPRecommendations = (): MPRecommendation[] => {
  try {
    const raw = localStorage.getItem(MP_RECOMMENDATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Error reading MP recommendations from storage:", err);
  }
  return INITIAL_MP_RECOMMENDATIONS;
};

export const syncMPRecommendationsFromSupabase = async (params?: { mpId?: string; district?: string }): Promise<MPRecommendation[]> => {
  try {
    const live = await fetchRecommendationsFromSupabase(params);
    if (live && live.length > 0) {
      const existing = getMPRecommendations();
      // Merge unique by id
      const combined = [...live, ...existing.filter(e => !live.some(l => l.id === e.id))];
      localStorage.setItem(MP_RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(combined));
      return combined;
    }
  } catch (err) {
    console.warn("Failed to sync recommendations from Supabase:", err);
  }
  return getMPRecommendations();
};

export const saveMPRecommendation = async (rec: MPRecommendation): Promise<MPRecommendation[]> => {
  const current = getMPRecommendations();
  const updated = [rec, ...current.filter(r => r.id !== rec.id)];
  localStorage.setItem(MP_RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(updated));

  // Sync to Supabase in background
  try {
    await saveRecommendationToSupabase({
      recommendation_id: ensureUUID(rec.id),
      mp_id: ensureUUID(),
      project_name: rec.title,
      description: rec.justification,
      category: rec.category,
      district: rec.district,
      state: "Madhya Pradesh",
      recommended_amount: Math.round(rec.estimatedCost * 10000000),
      status: rec.status === "SANCTIONED" ? "Sanctioned" : "Proposed"
    });
  } catch (err) {
    console.warn("Failed to push recommendation to Supabase:", err);
  }

  return updated;
};

export const updateMPRecommendationStatus = async (
  id: string,
  status: MPRecommendation["status"],
  districtNotes?: string,
  sanctionedCost?: number
): Promise<MPRecommendation[]> => {
  const current = getMPRecommendations();
  const updated = current.map(r => {
    if (r.id === id) {
      return {
        ...r,
        status,
        districtNotes: districtNotes || r.districtNotes,
        sanctionedCost: sanctionedCost !== undefined ? sanctionedCost : r.sanctionedCost,
        dateSanctioned: status === "SANCTIONED" ? new Date().toISOString().split("T")[0] : r.dateSanctioned
      };
    }
    return r;
  });
  localStorage.setItem(MP_RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(updated));

  try {
    await logAuditEventInSupabase(
      "RECOMMENDATION_STATUS_UPDATED",
      "recommendations",
      ensureUUID(id),
      { status, districtNotes, sanctionedCost }
    );
  } catch (err) {
    console.warn("Failed to log recommendation status update to Supabase:", err);
  }

  return updated;
};
