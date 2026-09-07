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
  },
  // Varanasi Issues
  {
    id: "ISSUE-UP-2024-001",
    title: "Severe Drainage Overflow and Waterlogging at Sigra Crossing",
    description: "Monsoon runoff has choked the existing surface drain, affecting over 200 roadside vendors and commuters near Sigra market.",
    category: "Water Supply",
    constituency: "Varanasi",
    district: "Varanasi",
    state: "Uttar Pradesh",
    locationName: "Sigra Crossing, Ward 15",
    latitude: 25.3176,
    longitude: 82.9739,
    photos: [],
    documents: [],
    status: "UNDER_REVIEW",
    dateSubmitted: "2024-05-15",
    lastUpdated: "2024-05-17",
    officialResponse: "Forwarded to Executive Engineer, Jal Nigam Varanasi for site assessment and DPR alignment."
  },
  {
    id: "ISSUE-UP-2024-002",
    title: "Need for High-Mast Solar Lighting at Assi Ghat Approach Road",
    description: "Dark stretches on the approach pathway leading to Assi Ghat cause safety concerns during evening Ganga Aarti.",
    category: "Street Solar",
    constituency: "Varanasi",
    district: "Varanasi",
    state: "Uttar Pradesh",
    locationName: "Assi Ghat Riverfront Approach",
    latitude: 25.2885,
    longitude: 83.0064,
    photos: [],
    documents: [],
    status: "INSPECTION_ASSIGNED",
    dateSubmitted: "2024-06-05",
    lastUpdated: "2024-06-08",
    officialResponse: "Inspected by Nagar Nigam Varanasi electrical wing. Proposed for inclusion in MP smart lighting recommendations."
  },
  // New Delhi Issues
  {
    id: "ISSUE-DL-2024-001",
    title: "Dilapidated Walking Tracks and Non-Functional Lighting in Lodhi Colony Parks",
    description: "Elderly residents face tripping hazards due to broken paving tiles and uneven earthen paths in the neighborhood central park.",
    category: "Other",
    constituency: "New Delhi",
    district: "New Delhi",
    state: "Delhi",
    locationName: "Lodhi Colony Block 18 Central Park",
    latitude: 28.5855,
    longitude: 77.2215,
    photos: [],
    documents: [],
    status: "UNDER_REVIEW",
    dateSubmitted: "2024-04-05",
    lastUpdated: "2024-04-09",
    officialResponse: "NDMC Horticulture team conducted initial survey. Feasible for MPLADS green infrastructure upgrade."
  },
  {
    id: "ISSUE-DL-2024-002",
    title: "Damaged Pavement and Inaccessible Curbs at Sarojini Nagar Ring Road",
    description: "Pedestrians including seniors and wheelchair users unable to safely access market entry due to damaged curbing and broken ramps.",
    category: "Road Repair",
    constituency: "New Delhi",
    district: "New Delhi",
    state: "Delhi",
    locationName: "Sarojini Nagar Market Gate 2",
    latitude: 28.5772,
    longitude: 77.1983,
    photos: [],
    documents: [],
    status: "INSPECTION_ASSIGNED",
    dateSubmitted: "2024-05-28",
    lastUpdated: "2024-06-01",
    officialResponse: "Joint inspection scheduled with PWD and Traffic Police for pedestrian safety corridor."
  },
  {
    id: "ISSUE-MH-2024-003",
    title: "Severe Potholes and Lack of Storm Drainage on Wadgaon Sheri Main Road",
    description: "During rainfall, road inundation causes daily traffic jams and dangerous accidents for two-wheeler commuters.",
    category: "Road Repair",
    constituency: "Pune",
    district: "Pune",
    state: "Maharashtra",
    locationName: "Wadgaon Sheri Kalyani Nagar Link Rd",
    latitude: 18.5529,
    longitude: 73.9167,
    photos: [],
    documents: [],
    status: "UNDER_REVIEW",
    dateSubmitted: "2024-06-12",
    lastUpdated: "2024-06-14",
    officialResponse: "PMC Road Engineering cell assigned to compile site elevation study."
  },
  {
    id: "ISSUE-MH-2024-004",
    title: "Non-Functional Drinking Water RO Unit at Aundh Municipal School",
    description: "The existing filtration machine has been out of service for 3 months, forcing over 450 school children to bring water from home.",
    category: "School Facility",
    constituency: "Pune",
    district: "Pune",
    state: "Maharashtra",
    locationName: "Aundh Zilla Parishad Primary School",
    latitude: 18.5626,
    longitude: 73.8087,
    photos: [],
    documents: [],
    status: "INSPECTION_ASSIGNED",
    dateSubmitted: "2024-06-20",
    lastUpdated: "2024-06-22",
    officialResponse: "Field verification scheduled with DRDA education coordinator for warranty repair."
  },
  {
    id: "ISSUE-UP-2024-003",
    title: "Need for Primary Health Sub-Center in Rural Kashi Zone",
    description: "Villagers from 4 adjacent gram panchayats travel 18 km to reach the nearest diagnostic health post in Varanasi city.",
    category: "Health Center",
    constituency: "Varanasi",
    district: "Varanasi",
    state: "Uttar Pradesh",
    locationName: "Rohaniya Gram Panchayat Common Land",
    latitude: 25.2638,
    longitude: 82.9056,
    photos: [],
    documents: [],
    status: "UNDER_REVIEW",
    dateSubmitted: "2024-05-30",
    lastUpdated: "2024-06-03",
    officialResponse: "Chief Medical Officer (CMO) Varanasi reviewing feasibility for MPLADS mini-PHC sponsorship."
  },
  {
    id: "ISSUE-DL-2024-003",
    title: "Frequent Voltage Fluctuations and Dark Stretches in Chanakyapuri",
    description: "Night workers face security risks due to unlit alleys near service quarters and community sanitation blocks.",
    category: "Street Solar",
    constituency: "New Delhi",
    district: "New Delhi",
    state: "Delhi",
    locationName: "Chanakyapuri Sector 4 Service Lanes",
    latitude: 28.5983,
    longitude: 77.1856,
    photos: [],
    documents: [],
    status: "INSPECTION_ASSIGNED",
    dateSubmitted: "2024-06-18",
    lastUpdated: "2024-06-21",
    officialResponse: "Joint site survey with NDMC Power wing completed; solar high mast light proposal submitted."
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
