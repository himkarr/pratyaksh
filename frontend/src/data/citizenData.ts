import {
  fetchCitizenIssuesFromSupabase,
  saveCitizenIssueToSupabase,
  ensureUUID,
  logAuditEventInSupabase
} from "../api/supabaseSync";

export interface IssuePhoto {
  id: string;
  url: string;
  timestamp: string;
  lat?: number;
  lng?: number;
  caption?: string;
}

export interface IssueDocument {
  id: string;
  name: string;
  size: string;
  url: string;
}

export interface CitizenIssue {
  id: string;
  title: string;
  description: string;
  category: "Road Repair" | "Water Supply" | "School Facility" | "Health Center" | "Street Solar" | "Sanitation & Drainage" | "Community Hall" | "Other" | string;
  constituency: string;
  district: string;
  state: string;
  locationName: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  photos: IssuePhoto[];
  documents: IssueDocument[];
  status: "SUBMITTED" | "UNDER_REVIEW" | "INSPECTION_ASSIGNED" | "RESOLVED" | "REJECTED" | "RECOMMENDED_BY_MP";
  dateSubmitted: string;
  lastUpdated: string;
  officialResponse?: string;
  assignedOfficer?: string;
  submittedBy?: string;
  contactNumber?: string;
  isOfflineDraft?: boolean;
  linkedWorkId?: string;
  linkedWorkTitle?: string;
  problemType?: string;
  type?: "problem_report" | "work_recommendation";
  currentSituation?: string;
  proposedWork?: string;
  estimatedBeneficiaries?: string;
  urgencyLevel?: "URGENT" | "HIGH" | "MEDIUM";
  mpRecommendationId?: string;
  stage?: "submitted" | "received" | "inspection_scheduled" | "action_taken" | "resolved" | "recommended";
}

export const INITIAL_CITIZEN_ISSUES: CitizenIssue[] = [
  {
    id: "REC-CIT-HR-ROH-101",
    type: "work_recommendation",
    title: "Installation of 5,000 LPH Solar RO Safe Drinking Water Kiosk, Sector 14, Rohtak",
    description: "High TDS groundwater in Sector 14 and adjoining residential colonies. Over 1,200 families require clean potable water dispensing facility.",
    currentSituation: "Local groundwater tests reveal TDS > 980 ppm. Schoolchildren and senior citizens depend on expensive private water tankers.",
    proposedWork: "Sanction 5,000 LPH Solar-powered RO filtration unit with automated dispensing counter and overhead stainless steel storage.",
    category: "Water Supply",
    constituency: "Rohtak",
    district: "Rohtak",
    state: "Haryana",
    locationName: "Near Community Centre, Sector 14, Rohtak",
    pincode: "124001",
    latitude: 28.8955,
    longitude: 76.6066,
    urgencyLevel: "HIGH",
    estimatedBeneficiaries: "6,000+ residents & students",
    submittedBy: "Rajesh Kumar Sharma",
    contactNumber: "+91 98120 55432",
    photos: [
      {
        id: "ev-roh-01",
        url: "https://images.unsplash.com/photo-1584467746872-9599a0e5324e?w=800&auto=format&fit=crop&q=60",
        timestamp: "2024-06-15 10:30 AM",
        lat: 28.8955,
        lng: 76.6066,
        caption: "Designated civil plot for proposed RO drinking water kiosk"
      }
    ],
    documents: [],
    status: "RECOMMENDED_BY_MP",
    stage: "recommended",
    dateSubmitted: "2024-06-15",
    lastUpdated: "2024-06-18",
    officialResponse: "Hon'ble MP recommended under MPLADS Annual Action Plan. Forwarded to DC Rohtak for technical sanction."
  },
  {
    id: "REC-CIT-HR-ROH-102",
    type: "work_recommendation",
    title: "Construction of Concrete Access Road to Govt Girls Senior Secondary School, Rohtak",
    description: "Access road to girls school gets severely waterlogged during monsoon, causing safety hazards for 800+ students.",
    currentSituation: "Unpaved dirt corridor filled with mud and stagnant water. Auto-rickshaws and ambulances cannot enter the school gate.",
    proposedWork: "Construct 800-meter Cement Concrete Road with covered side drainage and LED street lighting.",
    category: "Road Repair",
    constituency: "Rohtak",
    district: "Rohtak",
    state: "Haryana",
    locationName: "Govt Girls Sr Sec School Approach Road, Rohtak",
    pincode: "124001",
    latitude: 28.8890,
    longitude: 76.6120,
    urgencyLevel: "URGENT",
    estimatedBeneficiaries: "1,500+ school students & teachers",
    submittedBy: "Vikas Hooda",
    contactNumber: "+91 98124 99881",
    photos: [
      {
        id: "ev-roh-02",
        url: "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=800&auto=format&fit=crop&q=60",
        timestamp: "2024-06-18 11:15 AM",
        lat: 28.8890,
        lng: 76.6120,
        caption: "Waterlogged school approach stretch requiring cement concrete paving"
      }
    ],
    documents: [],
    status: "UNDER_REVIEW",
    stage: "received",
    dateSubmitted: "2024-06-18",
    lastUpdated: "2024-06-19",
    officialResponse: "Site inspection scheduled by District Engineering Cell, Rohtak."
  },
  {
    id: "REC-CIT-HR-JIN-201",
    type: "work_recommendation",
    title: "Installation of Solar High-Mast Lights at Grain Market Chowk & Bus Stand, Jind",
    description: "Busy market intersection remains poorly lit after dusk leading to traffic congestion and safety issues for farmers.",
    currentSituation: "High-density transit junction between Grain Market and Jind Bus Stand has no central high-mast lighting.",
    proposedWork: "Install 2 units of 16-meter Solar High-Mast LED light poles with automatic twilight switching.",
    category: "Street Solar",
    constituency: "Jind",
    district: "Jind",
    state: "Haryana",
    locationName: "New Grain Market Chowk, Jind",
    pincode: "126102",
    latitude: 29.3156,
    longitude: 76.3148,
    urgencyLevel: "HIGH",
    estimatedBeneficiaries: "12,000+ daily farmers and commuters",
    submittedBy: "Pooja Rani",
    contactNumber: "+91 94160 33211",
    photos: [
      {
        id: "ev-jin-01",
        url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=60",
        timestamp: "2024-06-20 08:45 AM",
        lat: 29.3156,
        lng: 76.3148,
        caption: "Grain market intersection proposed for solar high mast illumination"
      }
    ],
    documents: [],
    status: "UNDER_REVIEW",
    stage: "inspection_scheduled",
    dateSubmitted: "2024-06-20",
    lastUpdated: "2024-06-22",
    officialResponse: "District Planning Committee has initiated technical survey for electrical pole placement."
  },
  {
    id: "REC-CIT-HR-JIN-202",
    type: "work_recommendation",
    title: "Renovation & Diagnostic Equipment for Primary Health Centre, Safidon Road, Jind",
    description: "PHC catering to 15 nearby villages lacks dedicated maternal waiting room and automated pathology testing unit.",
    currentSituation: "Old dispensary building requires civil repair, waterproof roofing, and basic hematology diagnostic counter.",
    proposedWork: "Complete civil repair of PHC building, waterproofing, and sanction modern diagnostic blood testing unit.",
    category: "Health Center",
    constituency: "Jind",
    district: "Jind",
    state: "Haryana",
    locationName: "Safidon Road PHC Campus, Jind",
    pincode: "126102",
    latitude: 29.3240,
    longitude: 76.3290,
    urgencyLevel: "HIGH",
    estimatedBeneficiaries: "18,000+ rural patients",
    submittedBy: "Amit Dahiya",
    contactNumber: "+91 94162 77890",
    photos: [
      {
        id: "ev-jin-02",
        url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=60",
        timestamp: "2024-06-22 02:15 PM",
        lat: 29.3240,
        lng: 76.3290,
        caption: "PHC building requiring roof waterproofing & diagnostic lab setup"
      }
    ],
    documents: [],
    status: "SUBMITTED",
    stage: "submitted",
    dateSubmitted: "2024-06-22",
    lastUpdated: "2024-06-22",
    officialResponse: "Citizen proposal registered in MPLADS Public Portal. Queued for MP review."
  },
  {
    id: "REC-CIT-2024-819",
    type: "work_recommendation",
    title: "Construction of 1.5 km All-Weather Concrete Road & Drainage at Shivane Ward 24",
    description: "The main connecting road between Shivane village and Sinhagad Road is completely broken with severe waterlogged craters. Need Hon'ble MP to recommend new concrete road under MPLADS.",
    currentSituation: "Road surface is severely eroded with 1.5-foot deep potholes causing accidents for school buses and daily commuters during rains. No covered drainage exists.",
    proposedWork: "Sanction and construct 1.5 km Cement Concrete (CC) Road with covered side storm drain and solar street poles.",
    category: "Road Repair",
    constituency: "Pune",
    district: "Pune",
    state: "Maharashtra",
    locationName: "Shivane Gaon Main Link Road, Ward 24",
    pincode: "411023",
    latitude: 18.4721,
    longitude: 73.7892,
    urgencyLevel: "URGENT",
    estimatedBeneficiaries: "8,500+ local residents & farmers",
    submittedBy: "Rajesh K. Shinde (Resident Association)",
    contactNumber: "+91 98230 44123",
    photos: [
      {
        id: "ev-01",
        url: "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=800&auto=format&fit=crop&q=60",
        timestamp: "2024-06-10 09:15 AM",
        lat: 18.4721,
        lng: 73.7892,
        caption: "Current damaged road condition with heavy potholes & waterlogging"
      }
    ],
    documents: [],
    status: "UNDER_REVIEW",
    stage: "received",
    dateSubmitted: "2024-06-10",
    lastUpdated: "2024-06-12",
    officialResponse: "MP Constituency Secretariat reviewed site evidence. Forwarded to PWD Pune for DPR feasibility estimate before formal MPLADS recommendation."
  }
];

const CITIZEN_SUBMISSIONS_STORAGE_KEY = "mplads_citizen_submissions_v2";
const LOCAL_STORAGE_DRAFTS_KEY = "mplads_citizen_offline_drafts";

export const getCitizenSubmissions = (): CitizenIssue[] => {
  try {
    const raw = localStorage.getItem(CITIZEN_SUBMISSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Error reading citizen submissions from storage:", err);
  }
  return INITIAL_CITIZEN_ISSUES;
};

export const syncCitizenSubmissionsFromSupabase = async (districtName?: string): Promise<CitizenIssue[]> => {
  try {
    const live = await fetchCitizenIssuesFromSupabase(districtName);
    if (live && live.length > 0) {
      const existing = getCitizenSubmissions();
      const combined = [...live, ...existing.filter(e => !live.some(l => l.id === e.id))];
      localStorage.setItem(CITIZEN_SUBMISSIONS_STORAGE_KEY, JSON.stringify(combined));
      return combined;
    }
  } catch (err) {
    console.warn("Failed to sync citizen issues from Supabase:", err);
  }
  return getCitizenSubmissions();
};

export const saveCitizenSubmission = (item: CitizenIssue): CitizenIssue[] => {
  const current = getCitizenSubmissions();
  const updated = [item, ...current.filter(i => i.id !== item.id)];
  localStorage.setItem(CITIZEN_SUBMISSIONS_STORAGE_KEY, JSON.stringify(updated));

  // Sync to Supabase asynchronously
  saveCitizenIssueToSupabase(item).catch(err => {
    console.warn("Failed to sync citizen submission to Supabase:", err);
  });

  return updated;
};

export const updateCitizenSubmissionStatus = (
  id: string, 
  status: CitizenIssue["status"], 
  mpRecommendationId?: string,
  officialResponse?: string
): CitizenIssue[] => {
  try {
    const current = getCitizenSubmissions();
    const updated = current.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status,
          mpRecommendationId: mpRecommendationId || item.mpRecommendationId,
          officialResponse: officialResponse || item.officialResponse,
          stage: (status === "RECOMMENDED_BY_MP" ? "recommended" : 
                  status === "RESOLVED" ? "resolved" : 
                  status === "INSPECTION_ASSIGNED" ? "inspection_scheduled" : "received") as any,
          lastUpdated: new Date().toISOString().split("T")[0]
        };
      }
      return item;
    });
    localStorage.setItem(CITIZEN_SUBMISSIONS_STORAGE_KEY, JSON.stringify(updated));

    logAuditEventInSupabase(
      "CITIZEN_ISSUE_STATUS_UPDATED",
      "citizen_feedback",
      ensureUUID(id),
      { status, mpRecommendationId, officialResponse }
    ).catch(console.warn);

    return updated;
  } catch (err) {
    console.warn("Error updating citizen submission status:", err);
    return INITIAL_CITIZEN_ISSUES;
  }
};

export const getOfflineDrafts = (): CitizenIssue[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveOfflineDraft = (issue: Partial<CitizenIssue>): CitizenIssue => {
  const existing = getOfflineDrafts();
  const newDraft: CitizenIssue = {
    id: `DRAFT-${Date.now()}`,
    title: issue.title || "Untitled Issue Draft",
    description: issue.description || "",
    category: issue.category || "Other",
    constituency: issue.constituency || "Pune",
    district: issue.district || "Pune",
    state: issue.state || "Maharashtra",
    locationName: issue.locationName || "",
    latitude: issue.latitude,
    longitude: issue.longitude,
    photos: issue.photos || [],
    documents: issue.documents || [],
    status: "SUBMITTED",
    dateSubmitted: new Date().toISOString().split("T")[0],
    lastUpdated: new Date().toISOString().split("T")[0],
    isOfflineDraft: true
  };
  const updated = [newDraft, ...existing];
  localStorage.setItem(LOCAL_STORAGE_DRAFTS_KEY, JSON.stringify(updated));
  return newDraft;
};

export const deleteOfflineDraft = (id: string) => {
  const existing = getOfflineDrafts();
  const updated = existing.filter((item) => item.id !== id);
  localStorage.setItem(LOCAL_STORAGE_DRAFTS_KEY, JSON.stringify(updated));
};
