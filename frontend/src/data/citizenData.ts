export interface IssuePhoto {
  id: string;
  url: string;
  timestamp: string;
  lat?: number;
  lng?: number;
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
  category: "Road Repair" | "Water Supply" | "School Facility" | "Health Center" | "Street Solar" | "Other";
  constituency: string;
  district: string;
  state: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  photos: IssuePhoto[];
  documents: IssueDocument[];
  status: "SUBMITTED" | "UNDER_REVIEW" | "INSPECTION_ASSIGNED" | "RESOLVED" | "REJECTED";
  dateSubmitted: string;
  lastUpdated: string;
  officialResponse?: string;
  assignedOfficer?: string;
  submittedBy?: string;
  isOfflineDraft?: boolean;
}

export const INITIAL_CITIZEN_ISSUES: CitizenIssue[] = [
  {
    id: "ISSUE-MH-2024-001",
    title: "Incomplete Drinking Water Pipeline in Shivajinagar",
    description: "The pipeline work sanctioned under MPLADS 6 months ago remains partially laid, causing water leakage and road blockage near Ward 12.",
    category: "Water Supply",
    constituency: "Pune",
    district: "Pune",
    state: "Maharashtra",
    locationName: "Shivajinagar Bus Depot Road, Ward 12",
    latitude: 18.5314,
    longitude: 73.8446,
    photos: [
      {
        id: "img-01",
        url: "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=800&auto=format&fit=crop&q=60",
        timestamp: "2024-05-10 10:30 AM",
        lat: 18.5314,
        lng: 73.8446
      }
    ],
    documents: [
      { id: "doc-01", name: "Resident_Representation_Petition.pdf", size: "1.2 MB", url: "#" }
    ],
    status: "INSPECTION_ASSIGNED",
    dateSubmitted: "2024-05-10",
    lastUpdated: "2024-05-14",
    assignedOfficer: "Suresh Patil (Field Officer, Pune Division)",
    officialResponse: "Field Officer assigned for on-site verification. Geotagged inspection report expected within 48 hours."
  },
  {
    id: "ISSUE-MH-2024-002",
    title: "Broken Solar Street Lights near Primary Health Center",
    description: "3 solar light poles installed 4 months ago are non-functional, creating safety issues at night for patients.",
    category: "Street Solar",
    constituency: "Pune",
    district: "Pune",
    state: "Maharashtra",
    locationName: "Kothrud Gram Panchayat Health Center",
    latitude: 18.5074,
    longitude: 73.8077,
    photos: [],
    documents: [],
    status: "UNDER_REVIEW",
    dateSubmitted: "2024-06-01",
    lastUpdated: "2024-06-02",
    officialResponse: "Issue logged with District Rural Development Agency (DRDA). Contractor notified for warranty repair."
  }
];

// PWA Offline Draft Storage Helpers (using localStorage)
const LOCAL_STORAGE_DRAFTS_KEY = "mplads_citizen_offline_drafts";

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
