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
  // Rohtak (HR-RTK-07) - Hon'ble Shri Deepender Singh Hooda
  {
    id: "#na-deepender-singh-hooda-rohtak-const-of-hall-in-baratgarh-09-sep-2026-800000",
    title: "Const. of Hall in Baratgarh",
    category: "Normal/Others",
    estimatedCost: 0.08,
    location: "Jhajjar Block",
    district: "Jhajjar",
    constituency: "Rohtak",
    constituency_code: "HR-RTK-07",
    mpName: "Shri Deepender Singh Hooda",
    justification: "Authority: JHAJJAR(DEPUTY COMMISSIONER cum NODAL OFFICER MPLADS JHAJJAR)",
    status: "PROPOSED",
    dateProposed: "09 Sept 2026",
    districtNotes: "JHAJJAR(DEPUTY COMMISSIONER cum NODAL OFFICER MPLADS JHAJJAR)"
  },
  {
    id: "#na-deepender-singh-hooda-rohtak-development-works-in-brahaman-choupal-9812185674-09-sep-2026-1100000",
    title: "Development works in Brahaman Choupal 9812185674",
    category: "Normal/Others",
    estimatedCost: 0.11,
    location: "Rohtak Block",
    district: "Rohtak",
    constituency: "Rohtak",
    constituency_code: "HR-RTK-07",
    mpName: "Shri Deepender Singh Hooda",
    justification: "Authority: ROHTAK(DEPUTY COMMISSIONER ROHTAK_IDA)",
    status: "PROPOSED",
    dateProposed: "09 Sept 2026",
    districtNotes: "ROHTAK(DEPUTY COMMISSIONER ROHTAK_IDA)"
  },
  {
    id: "#na-deepender-singh-hooda-rohtak-const-of-hall-in-panchayat-land-8708474162-09-sep-2026-1100000",
    title: "Const. of Hall in Panchayat Land 8708474162",
    category: "Normal/Others",
    estimatedCost: 0.11,
    location: "Rohtak Block",
    district: "Rohtak",
    constituency: "Rohtak",
    constituency_code: "HR-RTK-07",
    mpName: "Shri Deepender Singh Hooda",
    justification: "Authority: ROHTAK(DEPUTY COMMISSIONER ROHTAK_IDA)",
    status: "PROPOSED",
    dateProposed: "09 Sept 2026",
    districtNotes: "ROHTAK(DEPUTY COMMISSIONER ROHTAK_IDA)"
  },
  {
    id: "#na-deepender-singh-hooda-rohtak-const-of-hall-in-panchayat-land-09-sep-2026-700000",
    title: "Const. of Hall in Panchayat Land",
    category: "Normal/Others",
    estimatedCost: 0.07,
    location: "Rohtak Block",
    district: "Rohtak",
    constituency: "Rohtak",
    constituency_code: "HR-RTK-07",
    mpName: "Shri Deepender Singh Hooda",
    justification: "Authority: ROHTAK(DEPUTY COMMISSIONER ROHTAK_IDA)",
    status: "PROPOSED",
    dateProposed: "09 Sept 2026",
    districtNotes: "ROHTAK(DEPUTY COMMISSIONER ROHTAK_IDA)"
  },
  {
    id: "#na-deepender-singh-hooda-rohtak-development-works-in-saheed-park-09-sep-2026-1000000",
    title: "Development works in Saheed Park",
    category: "Normal/Others",
    estimatedCost: 0.10,
    location: "Jhajjar Block",
    district: "Jhajjar",
    constituency: "Rohtak",
    constituency_code: "HR-RTK-07",
    mpName: "Shri Deepender Singh Hooda",
    justification: "Authority: JHAJJAR(DEPUTY COMMISSIONER cum NODAL OFFICER MPLADS JHAJJAR)",
    status: "PROPOSED",
    dateProposed: "09 Sept 2026",
    districtNotes: "JHAJJAR(DEPUTY COMMISSIONER cum NODAL OFFICER MPLADS JHAJJAR)"
  },
  {
    id: "#na-deepender-singh-hooda-rohtak-comp-of-kabaddi-hall-near-shiv-mandir-03-sep-2026-500000",
    title: "Comp. of Kabaddi Hall near Shiv Mandir",
    category: "Normal/Others",
    estimatedCost: 0.05,
    location: "Jhajjar Block",
    district: "Jhajjar",
    constituency: "Rohtak",
    constituency_code: "HR-RTK-07",
    mpName: "Shri Deepender Singh Hooda",
    justification: "Authority: JHAJJAR(DEPUTY COMMISSIONER cum NODAL OFFICER MPLADS JHAJJAR)",
    status: "PROPOSED",
    dateProposed: "03 Sept 2026",
    districtNotes: "JHAJJAR(DEPUTY COMMISSIONER cum NODAL OFFICER MPLADS JHAJJAR)"
  },
  {
    id: "#na-deepender-singh-hooda-rohtak-const-of-r-wall-of-dimpti-pond-03-sep-2026-500000",
    title: "Const. of R/wall of Dimpti Pond",
    category: "Normal/Others",
    estimatedCost: 0.05,
    location: "Rohtak Block",
    district: "Rohtak",
    constituency: "Rohtak",
    constituency_code: "HR-RTK-07",
    mpName: "Shri Deepender Singh Hooda",
    justification: "Authority: ROHTAK(DEPUTY COMMISSIONER ROHTAK_IDA)",
    status: "PROPOSED",
    dateProposed: "03 Sept 2026",
    districtNotes: "ROHTAK(DEPUTY COMMISSIONER ROHTAK_IDA)"
  },
  // Gurugram (HR-GUG-01) - Hon'ble Shri Rao Inderjit Singh
  {
    id: "#na-rao-inderjit-singh-gurugram-const-of-community-center-sec-14-15-sep-2026-1200000",
    title: "Construction of Modern Community Center, Sector 14",
    category: "Community Assets",
    estimatedCost: 0.12,
    location: "Gurugram Sadar Block",
    district: "Gurugram",
    constituency: "Gurugram",
    constituency_code: "HR-GUG-01",
    mpName: "Shri Rao Inderjit Singh",
    justification: "Authority: GURUGRAM(DEPUTY COMMISSIONER GURUGRAM_IDA)",
    status: "PROPOSED",
    dateProposed: "15 Sept 2026",
    districtNotes: "GURUGRAM(DEPUTY COMMISSIONER GURUGRAM_IDA)"
  },
  {
    id: "#na-rao-inderjit-singh-gurugram-solar-street-lighting-sohna-08-sep-2026-900000",
    title: "Installation of High-Mast Solar Street Lighting across 20 Rural Villages",
    category: "Renewable Energy",
    estimatedCost: 0.09,
    location: "Sohna Block",
    district: "Gurugram",
    constituency: "Gurugram",
    constituency_code: "HR-GUG-01",
    mpName: "Shri Rao Inderjit Singh",
    justification: "Authority: GURUGRAM(DEPUTY COMMISSIONER GURUGRAM_IDA)",
    status: "PROPOSED",
    dateProposed: "08 Sept 2026",
    districtNotes: "GURUGRAM(DEPUTY COMMISSIONER GURUGRAM_IDA)"
  },
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
  }
];

const MP_RECOMMENDATIONS_STORAGE_KEY = "mplads_mp_recommendations_v2";

export const getMPRecommendations = (): MPRecommendation[] => {
  try {
    const raw = localStorage.getItem(MP_RECOMMENDATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const map = new Map<string, MPRecommendation>();
        INITIAL_MP_RECOMMENDATIONS.forEach((item) => map.set(item.id, item));
        parsed.forEach((item: MPRecommendation) => {
          if (item && item.id) map.set(item.id, item);
        });
        const combined = Array.from(map.values());
        localStorage.setItem(MP_RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(combined));
        return combined;
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
    const existing = getMPRecommendations();
    if (live && live.length > 0) {
      const combinedMap = new Map<string, MPRecommendation>();
      existing.forEach(item => combinedMap.set(item.id, item));
      live.forEach(item => combinedMap.set(item.id, item));
      const combined = Array.from(combinedMap.values());
      localStorage.setItem(MP_RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(combined));
      return combined;
    }
    return existing;
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
