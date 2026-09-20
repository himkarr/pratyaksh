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
  state?: string;
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
  // Rohtak, Haryana (HR-ROH-01) - Hon'ble Shri Deepender Singh Hooda
  {
    id: "REC-HR-ROH-2024-001",
    title: "Establishment of Advanced High-Volume Drinking Water RO Purification Plants",
    category: "Drinking Water",
    estimatedCost: 0.75,
    sanctionedCost: 0.75,
    location: "Meham & Sampla Sub-divisions, Rohtak",
    district: "Rohtak",
    state: "Haryana",
    constituency: "Rohtak",
    constituency_code: "HR-ROH-01",
    mpName: "Shri Deepender Singh Hooda",
    justification: "Fulfills vital need for safe drinking water with automated dispensing kiosks in rural blocks.",
    status: "SANCTIONED",
    dateProposed: "2024-02-15",
    dateSanctioned: "2024-03-10",
    districtNotes: "Technical feasibility approved by Public Health Engineering Department. Work commenced.",
    citizenRequestId: "REC-CIT-HR-ROH-101"
  },
  {
    id: "REC-HR-ROH-2024-002",
    title: "Smart STEM Laboratories & Digital Interactive Panels in 12 Govt Model Senior Secondary Schools",
    category: "Education",
    estimatedCost: 0.60,
    sanctionedCost: 0.60,
    location: "Rohtak City & Kalanaur Block",
    district: "Rohtak",
    state: "Haryana",
    constituency: "Rohtak",
    constituency_code: "HR-ROH-01",
    mpName: "Shri Deepender Singh Hooda",
    justification: "Equips government schools with modern digital learning equipment and robotics laboratories.",
    status: "SANCTIONED",
    dateProposed: "2024-03-01",
    dateSanctioned: "2024-03-25",
    districtNotes: "Sanctioned under Digital Education Initiative. Equipment delivery in progress."
  },
  {
    id: "REC-HR-ROH-2024-003",
    title: "Construction of Concrete Access Road & Covered Storm Drainage to Govt Girls School",
    category: "Roads",
    estimatedCost: 0.65,
    sanctionedCost: 0.65,
    location: "Govt Girls Sr Sec School Approach Road, Rohtak",
    district: "Rohtak",
    state: "Haryana",
    constituency: "Rohtak",
    constituency_code: "HR-ROH-01",
    mpName: "Shri Deepender Singh Hooda",
    justification: "Adopting citizen demand from #REC-CIT-HR-ROH-102. Prevents monsoon waterlogging on school corridor.",
    status: "SANCTIONED",
    dateProposed: "2024-04-10",
    dateSanctioned: "2024-05-02",
    districtNotes: "Technical estimate verified by PWD (B&R) Rohtak. Work under execution.",
    citizenRequestId: "REC-CIT-HR-ROH-102"
  },
  {
    id: "REC-HR-ROH-2024-004",
    title: "Installation of High-Mast Solar Lighting & CCTV Network at Grain Mandis and Bus Terminals",
    category: "Renewable Energy",
    estimatedCost: 0.45,
    location: "New Grain Market, Rohtak & Meham Chowk",
    district: "Rohtak",
    state: "Haryana",
    constituency: "Rohtak",
    constituency_code: "HR-ROH-01",
    mpName: "Shri Deepender Singh Hooda",
    justification: "Improves security and transit illumination for farmers and passengers arriving at night.",
    status: "UNDER_SCRUTINY",
    dateProposed: "2024-05-18",
    districtNotes: "Survey in progress by Haryana Renewable Energy Development Agency (HAREDA)."
  },
  {
    id: "REC-HR-ROH-2024-005",
    title: "Augmentation of Multi-Purpose Rural Sports Complex & Gymnasium Facility",
    category: "Sports",
    estimatedCost: 0.80,
    location: "Bhalout & Bohar Villages, Rohtak",
    district: "Rohtak",
    state: "Haryana",
    constituency: "Rohtak",
    constituency_code: "HR-ROH-01",
    mpName: "Shri Deepender Singh Hooda",
    justification: "Promotes athletic training and fitness infrastructure for youth wrestling and athletics.",
    status: "PROPOSED",
    dateProposed: "2024-06-05",
    districtNotes: "Submitted to District Collector / Nodal Authority for technical scrutiny."
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
