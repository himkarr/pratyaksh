/**
 * Official Contractor / Vendor Data Models & Datasets for MPLADS Monitoring Portal
 * Aligned with District Authority Project Assignment Schedule Model
 */

export interface VendorDetails {
  vendorId: string;
  firmName: string;
  registrationClass: 'Class A (Apex)' | 'Class B (District)' | 'Class C (Local)';
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  district: string;
  state: string;
  activeWorksCount: number;
  completedWorksCount: number;
  performanceRating: number;
  status: 'Empanelled & Active' | 'Under Review' | 'Blacklisted';
}

export const REGISTERED_VENDORS: VendorDetails[] = [
  {
    vendorId: "VEN-2024-MP-4120",
    firmName: "M/s Apex Infra & Construction Ltd.",
    registrationClass: "Class A (Apex)",
    contactPerson: "Shri Vikram Singh (Project Director)",
    phone: "+91 94250 99881",
    email: "vikram@apexinfra.co.in",
    gstin: "23AAACA8871J1Z8",
    district: "Jabalpur",
    state: "Madhya Pradesh",
    activeWorksCount: 3,
    completedWorksCount: 9,
    performanceRating: 4.8,
    status: "Empanelled & Active"
  },
  {
    vendorId: "VEN-2024-MH-8842",
    firmName: "M/s Infra Buildcon India Ltd.",
    registrationClass: "Class A (Apex)",
    contactPerson: "Er. Rajesh Deshmukh (Executive Engineer)",
    phone: "+91 98220 11234",
    email: "projects@infrabuildcon.co.in",
    gstin: "27AAACI1234H1Z5",
    district: "Pune",
    state: "Maharashtra",
    activeWorksCount: 3,
    completedWorksCount: 14,
    performanceRating: 4.8,
    status: "Empanelled & Active"
  },
  {
    vendorId: "VEN-2024-MP-9011",
    firmName: "M/s Sagar Waterworks & Civil Corp",
    registrationClass: "Class B (District)",
    contactPerson: "Er. Alok Verma",
    phone: "+91 98931 44321",
    email: "contact@sagarwaterworks.com",
    gstin: "23AACCS5512K1Z2",
    district: "Sagar",
    state: "Madhya Pradesh",
    activeWorksCount: 2,
    completedWorksCount: 6,
    performanceRating: 4.4,
    status: "Empanelled & Active"
  },
  {
    vendorId: "VEN-2024-HR-5011",
    firmName: "M/s Haryana Civil Infra Services",
    registrationClass: "Class A (Apex)",
    contactPerson: "Er. Surender Malik",
    phone: "+91 98120 44556",
    email: "info@haryanacivilinfra.in",
    gstin: "06AAACH5512K1Z9",
    district: "Rohtak",
    state: "Haryana",
    activeWorksCount: 3,
    completedWorksCount: 11,
    performanceRating: 4.8,
    status: "Empanelled & Active"
  },
  {
    vendorId: "VEN-2024-HR-7022",
    firmName: "M/s Millennium City Builders & Engineers",
    registrationClass: "Class A (Apex)",
    contactPerson: "Er. Vikas Rao",
    phone: "+91 99990 12345",
    email: "contact@millenniumcitybuilders.com",
    gstin: "06AACCM7712L1Z4",
    district: "Gurugram",
    state: "Haryana",
    activeWorksCount: 4,
    completedWorksCount: 16,
    performanceRating: 4.9,
    status: "Empanelled & Active"
  },
  {
    vendorId: "VEN-2024-MH-3312",
    firmName: "M/s Maharashtra Rural Roadbuilders",
    registrationClass: "Class A (Apex)",
    contactPerson: "Shri Nilesh Patil",
    phone: "+91 98221 77665",
    email: "nilesh@mharoads.in",
    gstin: "27AAACM9910F1Z4",
    district: "Pune",
    state: "Maharashtra",
    activeWorksCount: 4,
    completedWorksCount: 18,
    performanceRating: 4.9,
    status: "Empanelled & Active"
  },
  {
    vendorId: "VEN-2024-MH-7890",
    firmName: "M/s Vidarbha Green Infra Pvt Ltd",
    registrationClass: "Class B (District)",
    contactPerson: "Smt. Sunita Rao",
    phone: "+91 97654 33221",
    email: "sraov@vidarbhagreen.com",
    gstin: "27AAACV4411D1Z9",
    district: "Nagpur",
    state: "Maharashtra",
    activeWorksCount: 1,
    completedWorksCount: 5,
    performanceRating: 4.2,
    status: "Empanelled & Active"
  }
];

export interface ContractorProfile {
  id: string;
  agencyName: string;
  vendorId: string;
  gstin: string;
  registrationNo: string;
  circle: string;
  district: string;
  state: string;
  nodalOfficer: string;
  contactEmail: string;
  contactPhone: string;
}

export interface CheckpointAction {
  id: string;
  actionName: string;
  dueDate: string;
  submissionStatus: 'Pending' | 'Submitted' | 'Verified' | 'Overdue';
  submittedDate: string | null;
  verificationStatus: 'Pending' | 'Verified' | 'Under Scrutiny' | 'Not available';
  requiredItems: string[];
}

export interface SubmittedFileItem {
  name: string;
  url: string;
  size?: string;
  type: string;
  lat?: number;
  lng?: number;
  timestamp: string;
}

export interface EvidenceSubmissionRecord {
  id: string;
  workId: string;
  contractorName: string;
  checkpointActionId: string;
  checkpointActionName: string;
  evidenceType: string;
  files: SubmittedFileItem[];
  uploadTimestamp: string;
  latitude: number | null;
  longitude: number | null;
  locationText: string | null;
  physicalProgressPercent: number;
  expenditureAmountRs: number;
  workStage: string;
  materialStatus: string;
  description: string;
  submissionStatus: 'Submitted' | 'Under Scrutiny';
  verificationStatus: 'Pending Verification' | 'Verified' | 'Rejected' | 'Under Scrutiny';
  verificationRemarks: string;
}

export interface MonitoringScheduleItem {
  stageId: string;
  stageName: string;
  targetProgressPercent: number; // e.g. 10%, 30%, 65%, 90%, 100%
  scheduledStartDate: string;
  scheduledEndDate: string;
  requiredEvidenceTypes: string[];
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  submissionStatus: 'Pending' | 'Submitted' | 'Verified' | 'Overdue';
  submittedDate: string | null;
  submissionRecord?: EvidenceSubmissionRecord;
}

export interface ContractorNotification {
  id: string;
  workId: string;
  title: string;
  message: string;
  date: string;
  type: 'urgent' | 'warning' | 'info' | 'success';
  read: boolean;
}

export interface ContractorProject {
  id: string; // Work ID
  title: string; // Work description
  category: 'Roads' | 'Drinking Water' | 'Education' | 'Health' | 'Community Assets';
  state: string;
  district: string;
  constituency: string;
  mpName: string;
  implementingAuthority: string; // Implementing District Authority
  contractorName: string; // Assigned contractor/vendor
  vendorId: string;
  
  sanctionAmountRs: number;
  recommendedAmountRs: number;
  utilizedAmountRs: number | null; // Current expenditure if available
  remainingAmountRs: number | null; // Amount remaining if available
  physicalProgress: number; // Current physical progress %
  
  // Official Schedule provided by District Authority
  officialStartDate: string; // Official project start date from authority assignment
  officialExpectedCompletionDate: string; // Expected completion date / official timeline
  
  currentWorkStatus: 'Sanctioned' | 'InProgress' | 'Completed' | 'Delayed';
  monitoringStatus: 'Active Monitoring' | 'Action Pending' | 'Pending First Submission' | 'Under Scrutiny' | 'Completed';
  nextRequiredSubmission: string;
  nextSubmissionDueDate: string;
  riskIndicator: 'Low Risk' | 'Delay Risk' | 'Critical Delay' | 'Not available';
  
  checkpointActions: CheckpointAction[];
  schedule: MonitoringScheduleItem[];
  submissionRecords: EvidenceSubmissionRecord[];

  // Completion Certificate Request Metadata
  completionCertificateStatus?: 'Not Requested' | 'Requested' | 'Under Scrutiny' | 'Approved' | 'Issued';
  completionCertificateRequestedDate?: string;
  completionCertificateRemarks?: string;
}

export const DEFAULT_CONTRACTOR_PROFILE: ContractorProfile = {
  id: "USR-CONTRACTOR-01",
  agencyName: "M/s Infra Buildcon India Ltd.",
  vendorId: "VEN-2024-MH-8842",
  gstin: "27AAACI1234H1Z5",
  registrationNo: "PWD/MH/CLASS-1/8892",
  circle: "Pune Infrastructure Division Circle",
  district: "Pune",
  state: "Maharashtra",
  nodalOfficer: "Er. Rajesh Deshmukh (Executive Engineer)",
  contactEmail: "projects@infrabuildcon.co.in",
  contactPhone: "+91 98220 11234"
};

export const MOCK_CONTRACTOR_PROJECTS: ContractorProject[] = [
  {
    id: "WORK-MH-2024-001",
    title: "Construction of Concrete Link Road connecting NH-48 to Village Connectivity Hub",
    category: "Roads",
    state: "Maharashtra",
    district: "Pune",
    constituency: "Baramati (ST-18)",
    mpName: "Shri Supriya Sule",
    implementingAuthority: "District Collectorate Pune / Public Works Department (PWD)",
    contractorName: "M/s Infra Buildcon India Ltd.",
    vendorId: "VEN-2024-MH-8842",
    
    sanctionAmountRs: 3850000,
    recommendedAmountRs: 4000000,
    utilizedAmountRs: 2310000,
    remainingAmountRs: 1540000,
    physicalProgress: 48,
    
    officialStartDate: "01 Sep 2026",
    officialExpectedCompletionDate: "28 Feb 2027",
    
    currentWorkStatus: "InProgress",
    monitoringStatus: "Active Monitoring",
    nextRequiredSubmission: "Upload Material Evidence for Stage 2",
    nextSubmissionDueDate: "20 Oct 2026",
    riskIndicator: "Delay Risk",
    
    checkpointActions: [],
    
    schedule: [
      {
        stageId: "stg-01",
        stageName: "Stage 1 — Site Preparation & Boundary Demarcation",
        targetProgressPercent: 10,
        scheduledStartDate: "01 Sep 2026",
        scheduledEndDate: "20 Sep 2026",
        requiredEvidenceTypes: ["Geo-tagged site demarcation photo", "Initial survey layout report"],
        status: "COMPLETED",
        submissionStatus: "Verified",
        submittedDate: "18 Sep 2026",
        submissionRecord: {
          id: "sub-01",
          workId: "WORK-MH-2024-001",
          contractorName: "M/s Infra Buildcon India Ltd.",
          checkpointActionId: "stg-01",
          checkpointActionName: "Stage 1 — Site Preparation & Boundary Demarcation",
          evidenceType: "Geo-tagged Work Progress Photo",
          files: [
            {
              name: "Initial_Site_Demarcation_GeoTag.jpg",
              url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=400&q=80",
              size: "2.4 MB",
              type: "Geo-tagged Photo",
              lat: 18.5204,
              lng: 73.8567,
              timestamp: "18 Sep 2026 10:15 AM"
            }
          ],
          uploadTimestamp: "18 Sep 2026 10:25 AM",
          latitude: 18.5204,
          longitude: 73.8567,
          locationText: "Haveli Block, Pune (18.5204° N, 73.8567° E)",
          physicalProgressPercent: 10,
          expenditureAmountRs: 385000,
          workStage: "Stage 1 — Site Preparation & Boundary Demarcation",
          materialStatus: "Initial aggregate & equipment mobilized",
          description: "Demarcation completed. Topsoil excavated and aggregate bed laid.",
          submissionStatus: "Submitted",
          verificationStatus: "Verified",
          verificationRemarks: "Verified on site by Assistant Engineer PWD."
        }
      },
      {
        stageId: "stg-02",
        stageName: "Stage 2 — Earthwork & Foundation Subgrade Excavation",
        targetProgressPercent: 30,
        scheduledStartDate: "21 Sep 2026",
        scheduledEndDate: "20 Oct 2026",
        requiredEvidenceTypes: ["Geo-tagged progress photographs", "Material test reports", "Material invoices"],
        status: "IN_PROGRESS",
        submissionStatus: "Verified",
        submittedDate: "03 Oct 2026",
        submissionRecord: {
          id: "sub-02",
          workId: "WORK-MH-2024-001",
          contractorName: "M/s Infra Buildcon India Ltd.",
          checkpointActionId: "stg-02",
          checkpointActionName: "Stage 2 — Earthwork & Foundation Subgrade Excavation",
          evidenceType: "Geo-tagged Work Progress Photo",
          files: [
            {
              name: "Subgrade_Excavation_Progress.jpg",
              url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80",
              size: "3.1 MB",
              type: "Geo-tagged Photo",
              lat: 18.5210,
              lng: 73.8572,
              timestamp: "03 Oct 2026 02:45 PM"
            }
          ],
          uploadTimestamp: "03 Oct 2026 02:50 PM",
          latitude: 18.5210,
          longitude: 73.8572,
          locationText: "Haveli Block, Pune (18.5210° N, 73.8572° E)",
          physicalProgressPercent: 30,
          expenditureAmountRs: 1155000,
          workStage: "Stage 2 — Earthwork & Foundation Subgrade Excavation",
          materialStatus: "Crushed stone aggregate stacked on site",
          description: "Subgrade soil compaction verified with roller equipment.",
          submissionStatus: "Submitted",
          verificationStatus: "Verified",
          verificationRemarks: "Subgrade compaction test passed."
        }
      },
      {
        stageId: "stg-03",
        stageName: "Stage 3 — Rigid Pavement Sub-Base & RCC Slab Pouring",
        targetProgressPercent: 65,
        scheduledStartDate: "21 Oct 2026",
        scheduledEndDate: "20 Dec 2026",
        requiredEvidenceTypes: ["Geo-tagged photos of RCC pour", "Compressive strength test documentation", "Expenditure log"],
        status: "UPCOMING",
        submissionStatus: "Pending",
        submittedDate: null
      },
      {
        stageId: "stg-04",
        stageName: "Stage 4 — Storm Drainage & Side Finishing Works",
        targetProgressPercent: 90,
        scheduledStartDate: "21 Dec 2026",
        scheduledEndDate: "10 Feb 2027",
        requiredEvidenceTypes: ["Geo-tagged drainage photographs", "Material evidence", "Expenditure details"],
        status: "UPCOMING",
        submissionStatus: "Pending",
        submittedDate: null
      },
      {
        stageId: "stg-05",
        stageName: "Stage 5 — Final Inspection & Statutory Handover",
        targetProgressPercent: 100,
        scheduledStartDate: "11 Feb 2027",
        scheduledEndDate: "28 Feb 2027",
        requiredEvidenceTypes: ["Final completion geotagged photos", "Completion certificate", "Final MB voucher"],
        status: "UPCOMING",
        submissionStatus: "Pending",
        submittedDate: null
      }
    ],
    
    submissionRecords: [
      {
        id: "sub-01",
        workId: "WORK-MH-2024-001",
        contractorName: "M/s Infra Buildcon India Ltd.",
        checkpointActionId: "stg-01",
        checkpointActionName: "Stage 1 — Site Preparation & Boundary Demarcation",
        evidenceType: "Geo-tagged Work Progress Photo",
        files: [
          {
            name: "Initial_Site_Demarcation_GeoTag.jpg",
            url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=400&q=80",
            size: "2.4 MB",
            type: "Geo-tagged Photo",
            lat: 18.5204,
            lng: 73.8567,
            timestamp: "18 Sep 2026 10:15 AM"
          }
        ],
        uploadTimestamp: "18 Sep 2026 10:25 AM",
        latitude: 18.5204,
        longitude: 73.8567,
        locationText: "Haveli Block, Pune (18.5204° N, 73.8567° E)",
        physicalProgressPercent: 10,
        expenditureAmountRs: 385000,
        workStage: "Stage 1 — Site Preparation & Boundary Demarcation",
        materialStatus: "Initial aggregate & equipment mobilized",
        description: "Demarcation completed. Topsoil excavated and aggregate bed laid.",
        submissionStatus: "Submitted",
        verificationStatus: "Verified",
        verificationRemarks: "Verified on site by Assistant Engineer PWD."
      },
      {
        id: "sub-02",
        workId: "WORK-MH-2024-001",
        contractorName: "M/s Infra Buildcon India Ltd.",
        checkpointActionId: "stg-02",
        checkpointActionName: "Stage 2 — Earthwork & Foundation Subgrade Excavation",
        evidenceType: "Geo-tagged Work Progress Photo",
        files: [
          {
            name: "Subgrade_Excavation_Progress.jpg",
            url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80",
            size: "3.1 MB",
            type: "Geo-tagged Photo",
            lat: 18.5210,
            lng: 73.8572,
            timestamp: "03 Oct 2026 02:45 PM"
          }
        ],
        uploadTimestamp: "03 Oct 2026 02:50 PM",
        latitude: 18.5210,
        longitude: 73.8572,
        locationText: "Haveli Block, Pune (18.5210° N, 73.8572° E)",
        physicalProgressPercent: 30,
        expenditureAmountRs: 1155000,
        workStage: "Stage 2 — Earthwork & Foundation Subgrade Excavation",
        materialStatus: "Crushed stone aggregate stacked on site",
        description: "Subgrade soil compaction verified with roller equipment.",
        submissionStatus: "Submitted",
        verificationStatus: "Verified",
        verificationRemarks: "Subgrade compaction test passed."
      }
    ]
  },
  {
    id: "WORK-MH-2024-002",
    title: "Installation of Solar-Powered Drinking Water Filtration System & Overhead Tank",
    category: "Drinking Water",
    state: "Maharashtra",
    district: "Pune",
    constituency: "Shirur (LS-19)",
    mpName: "Shri Dr. Amol Kolhe",
    implementingAuthority: "District Water & Sanitation Mission / Zilla Parishad Pune",
    contractorName: "M/s Infra Buildcon India Ltd.",
    vendorId: "VEN-2024-MH-8842",
    
    sanctionAmountRs: 2400000,
    recommendedAmountRs: 2500000,
    utilizedAmountRs: 1200000,
    remainingAmountRs: 1200000,
    physicalProgress: 50,
    
    officialStartDate: "15 Aug 2026",
    officialExpectedCompletionDate: "15 Dec 2026",
    
    currentWorkStatus: "InProgress",
    monitoringStatus: "Active Monitoring",
    nextRequiredSubmission: "Upload Material Evidence for Stage 3",
    nextSubmissionDueDate: "15 Oct 2026",
    riskIndicator: "Low Risk",
    
    checkpointActions: [],
    
    schedule: [
      {
        stageId: "stg-dw-01",
        stageName: "Stage 1 — Hydrogeological Survey & Borehole Drilling",
        targetProgressPercent: 25,
        scheduledStartDate: "15 Aug 2026",
        scheduledEndDate: "31 Aug 2026",
        requiredEvidenceTypes: ["Borehole Geo-tagged Photo", "Yield Test Log"],
        status: "COMPLETED",
        submissionStatus: "Verified",
        submittedDate: "30 Aug 2026",
        submissionRecord: {
          id: "sub-dw-01",
          workId: "WORK-MH-2024-002",
          contractorName: "M/s Infra Buildcon India Ltd.",
          checkpointActionId: "stg-dw-01",
          checkpointActionName: "Stage 1 — Hydrogeological Survey & Borehole Drilling",
          evidenceType: "Geo-tagged Work Progress Photo",
          files: [
            {
              name: "Borehole_Drilling_GeoTag.jpg",
              url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=400&q=80",
              size: "1.8 MB",
              type: "Geo-tagged Photo",
              lat: 18.8251,
              lng: 74.3725,
              timestamp: "30 Aug 2026 02:30 PM"
            }
          ],
          uploadTimestamp: "30 Aug 2026 02:35 PM",
          latitude: 18.8251,
          longitude: 74.3725,
          locationText: "Shirur Block, Pune (18.8251° N, 74.3725° E)",
          physicalProgressPercent: 25,
          expenditureAmountRs: 600000,
          workStage: "Stage 1 — Hydrogeological Survey & Borehole Drilling",
          materialStatus: "Casing pipes & pump set delivered",
          description: "200ft deep borehole successfully drilled with water discharge rate of 4,500 LPH.",
          submissionStatus: "Submitted",
          verificationStatus: "Verified",
          verificationRemarks: "Verified by Block Development Officer."
        }
      },
      {
        stageId: "stg-dw-02",
        stageName: "Stage 2 — RCC Overhead Reservoir & Staging Construction",
        targetProgressPercent: 50,
        scheduledStartDate: "01 Sep 2026",
        scheduledEndDate: "30 Sep 2026",
        requiredEvidenceTypes: ["RCC Staging Photo", "Curing Log"],
        status: "COMPLETED",
        submissionStatus: "Verified",
        submittedDate: "28 Sep 2026"
      },
      {
        stageId: "stg-dw-03",
        stageName: "Stage 3 — Solar Array Mounting & RO Plant Installation",
        targetProgressPercent: 80,
        scheduledStartDate: "01 Oct 2026",
        scheduledEndDate: "31 Oct 2026",
        requiredEvidenceTypes: ["Panel Installation Photo", "Equipment Invoices"],
        status: "IN_PROGRESS",
        submissionStatus: "Pending",
        submittedDate: null
      },
      {
        stageId: "stg-dw-04",
        stageName: "Stage 4 — Pipeline Network Distribution & Final Handover",
        targetProgressPercent: 100,
        scheduledStartDate: "01 Nov 2026",
        scheduledEndDate: "15 Dec 2026",
        requiredEvidenceTypes: ["Water Quality Certificate", "Handover Receipt"],
        status: "UPCOMING",
        submissionStatus: "Pending",
        submittedDate: null
      }
    ],
    
    submissionRecords: [
      {
        id: "sub-dw-01",
        workId: "WORK-MH-2024-002",
        contractorName: "M/s Infra Buildcon India Ltd.",
        checkpointActionId: "stg-dw-01",
        checkpointActionName: "Stage 1 — Hydrogeological Survey & Borehole Drilling",
        evidenceType: "Geo-tagged Work Progress Photo",
        files: [
          {
            name: "Borehole_Drilling_GeoTag.jpg",
            url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=400&q=80",
            size: "1.8 MB",
            type: "Geo-tagged Photo",
            lat: 18.8251,
            lng: 74.3725,
            timestamp: "30 Aug 2026 02:30 PM"
          }
        ],
        uploadTimestamp: "30 Aug 2026 02:35 PM",
        latitude: 18.8251,
        longitude: 74.3725,
        locationText: "Shirur Block, Pune (18.8251° N, 74.3725° E)",
        physicalProgressPercent: 25,
        expenditureAmountRs: 600000,
        workStage: "Stage 1 — Hydrogeological Survey & Borehole Drilling",
        materialStatus: "Casing pipes & pump set delivered",
        description: "200ft deep borehole successfully drilled with water discharge rate of 4,500 LPH.",
        submissionStatus: "Submitted",
        verificationStatus: "Verified",
        verificationRemarks: "Verified by Block Development Officer."
      }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: ContractorNotification[] = [
  {
    id: "notif-01",
    workId: "WORK-MH-2024-001",
    title: "Stage 3 Evidence Action Due Soon",
    message: "Stage 3 ('RCC Rigid Pavement Slab Pour') evidence submission is scheduled for 21 Oct 2026.",
    date: "08 Sep 2026",
    type: "info",
    read: false
  }
];
