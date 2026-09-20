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
    vendorId: "2df07d35-4493-4bd4-b7e6-d6a55ea3d80d",
    firmName: "The Sahil Co-operative Labour and Construction Society Ltd",
    registrationClass: "Class A (Apex)",
    contactPerson: "Sahil Verma",
    phone: "+919812033441",
    email: "vendor.sahil.rohtak@contractor.gov.in",
    gstin: "06AABCT1234F1Z5",
    district: "Rohtak",
    state: "Haryana",
    activeWorksCount: 3,
    completedWorksCount: 8,
    performanceRating: 4.8,
    status: "Empanelled & Active"
  },
  {
    vendorId: "bb2e6047-1b01-44f1-9d8f-9266837807e3",
    firmName: "Deepak Govt Contractor",
    registrationClass: "Class B (District)",
    contactPerson: "Deepak Kumar",
    phone: "+919812033442",
    email: "vendor.deepak.rohtak@contractor.gov.in",
    gstin: "06AAECD5678K1Z2",
    district: "Rohtak",
    state: "Haryana",
    activeWorksCount: 2,
    completedWorksCount: 5,
    performanceRating: 4.6,
    status: "Empanelled & Active"
  },
  {
    vendorId: "10d11672-ed12-44e3-872a-7a050fe19149",
    firmName: "Win Power Construction Co",
    registrationClass: "Class A (Apex)",
    contactPerson: "Vikram Malhotra",
    phone: "+919818044551",
    email: "vendor.winpower.gurugram@contractor.gov.in",
    gstin: "06AAFCW9012M1Z8",
    district: "Gurugram",
    state: "Haryana",
    activeWorksCount: 4,
    completedWorksCount: 11,
    performanceRating: 4.9,
    status: "Empanelled & Active"
  },
  {
    vendorId: "a15337f8-9f87-4c04-bb04-19b4127f963d",
    firmName: "The Lal Kripa Coop L&C Society Ltd",
    registrationClass: "Class B (District)",
    contactPerson: "Rajinder Prasad Lal",
    phone: "+919818044552",
    email: "vendor.lalkripa.gurugram@contractor.gov.in",
    gstin: "06AABCL7788P1Z1",
    district: "Gurugram",
    state: "Haryana",
    activeWorksCount: 3,
    completedWorksCount: 7,
    performanceRating: 4.7,
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
  monitoringStatus: 'Active Monitoring' | 'Action Pending' | 'Pending First Submission' | 'Under Scrutiny' | 'Completed' | 'Expenditure Anomaly (Over Budget)';
  nextRequiredSubmission: string;
  nextSubmissionDueDate: string;
  riskIndicator: 'Low Risk' | 'Delay Risk' | 'Critical Delay' | 'Not available' | 'High Anomaly Risk';
  
  checkpointActions: CheckpointAction[];
  schedule: MonitoringScheduleItem[];
  submissionRecords: EvidenceSubmissionRecord[];

  // Completion Certificate Request Metadata
  completionCertificateStatus?: 'Not Requested' | 'Requested' | 'Under Scrutiny' | 'Approved' | 'Issued';
  completionCertificateRequestedDate?: string;
  completionCertificateRemarks?: string;
}

export const DEFAULT_CONTRACTOR_PROFILE: ContractorProfile = {
  id: "2df07d35-4493-4bd4-b7e6-d6a55ea3d80d",
  agencyName: "The Sahil Co-operative Labour and Construction Society Ltd",
  vendorId: "2df07d35-4493-4bd4-b7e6-d6a55ea3d80d",
  gstin: "06AABCT1234F1Z5",
  registrationNo: "PWD/HR/CLASS-A/901",
  circle: "Rohtak Infrastructure Division Circle",
  district: "Rohtak",
  state: "Haryana",
  nodalOfficer: "Sahil Verma",
  contactEmail: "vendor.sahil.rohtak@contractor.gov.in",
  contactPhone: "+919812033441"
};

export const MOCK_CONTRACTOR_PROJECTS: ContractorProject[] = [
  {
    id: "WORK-HR-RTK-001",
    title: "Construction of Community Health Centre (CHC) Building & Oxygen Plant, Kalanaur",
    category: "Health",
    state: "Haryana",
    district: "Rohtak",
    constituency: "Rohtak (PC-07)",
    mpName: "Shri Deepender Singh Hooda",
    implementingAuthority: "Public Health Engineering Department / DC Rohtak",
    contractorName: "The Sahil Co-operative Labour and Construction Society Ltd",
    vendorId: "2df07d35-4493-4bd4-b7e6-d6a55ea3d80d",
    
    sanctionAmountRs: 15000000,
    recommendedAmountRs: 15000000,
    utilizedAmountRs: 9500000,
    remainingAmountRs: 5500000,
    physicalProgress: 70,
    
    officialStartDate: "15 Mar 2024",
    officialExpectedCompletionDate: "30 Apr 2025",
    
    currentWorkStatus: "InProgress",
    monitoringStatus: "Active Monitoring",
    nextRequiredSubmission: "Upload Material Evidence for Stage 3",
    nextSubmissionDueDate: "20 Nov 2024",
    riskIndicator: "Low Risk",
    
    checkpointActions: [],
    
    schedule: [
      {
        stageId: "stg-01",
        stageName: "Stage 1 — Site Preparation & RCC Foundation Pouring",
        targetProgressPercent: 25,
        scheduledStartDate: "15 Mar 2024",
        scheduledEndDate: "15 May 2024",
        requiredEvidenceTypes: ["Geo-tagged site demarcation photo", "Foundation RCC inspection report"],
        status: "COMPLETED",
        submissionStatus: "Verified",
        submittedDate: "12 May 2024",
        submissionRecord: {
          id: "sub-hr-01",
          workId: "WORK-HR-RTK-001",
          contractorName: "The Sahil Co-operative Labour and Construction Society Ltd",
          checkpointActionId: "stg-01",
          checkpointActionName: "Stage 1 — Site Preparation & RCC Foundation Pouring",
          evidenceType: "Geo-tagged Work Progress Photo",
          files: [
            {
              name: "CHC_Kalanaur_Foundation_GeoTag.jpg",
              url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=400&q=80",
              size: "2.4 MB",
              type: "Geo-tagged Photo",
              lat: 28.8955,
              lng: 76.6066,
              timestamp: "12 May 2024 10:15 AM"
            }
          ],
          uploadTimestamp: "12 May 2024 10:25 AM",
          latitude: 28.8955,
          longitude: 76.6066,
          locationText: "Kalanaur Block, Rohtak (28.8955° N, 76.6066° E)",
          physicalProgressPercent: 25,
          expenditureAmountRs: 3750000,
          workStage: "Stage 1 — Site Preparation & RCC Foundation Pouring",
          materialStatus: "Steel reinforcement & cement batch verified",
          description: "RCC foundation plinth completed with structural test clearance.",
          submissionStatus: "Submitted",
          verificationStatus: "Verified",
          verificationRemarks: "Verified on site by Executive Engineer PHED Rohtak."
        }
      },
      {
        stageId: "stg-02",
        stageName: "Stage 2 — Main Superstructure, Brickwork & Roof Casting",
        targetProgressPercent: 65,
        scheduledStartDate: "16 May 2024",
        scheduledEndDate: "30 Sep 2024",
        requiredEvidenceTypes: ["Geo-tagged progress photographs", "Oxygen manifold pipeline test report"],
        status: "COMPLETED",
        submissionStatus: "Verified",
        submittedDate: "25 Sep 2024",
        submissionRecord: {
          id: "sub-hr-02",
          workId: "WORK-HR-RTK-001",
          contractorName: "The Sahil Co-operative Labour and Construction Society Ltd",
          checkpointActionId: "stg-02",
          checkpointActionName: "Stage 2 — Main Superstructure, Brickwork & Roof Casting",
          evidenceType: "Geo-tagged Work Progress Photo",
          files: [
            {
              name: "CHC_Superstructure_RoofCast.jpg",
              url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80",
              size: "3.1 MB",
              type: "Geo-tagged Photo",
              lat: 28.8960,
              lng: 76.6072,
              timestamp: "25 Sep 2024 02:45 PM"
            }
          ],
          uploadTimestamp: "25 Sep 2024 02:50 PM",
          latitude: 28.8960,
          longitude: 76.6072,
          locationText: "Kalanaur Block, Rohtak (28.8960° N, 76.6072° E)",
          physicalProgressPercent: 65,
          expenditureAmountRs: 5750000,
          workStage: "Stage 2 — Main Superstructure, Brickwork & Roof Casting",
          materialStatus: "Oxygen plant compressor and cylinder bank installed",
          description: "Superstructure complete. Oxygen pipeline manifold pressure tested.",
          submissionStatus: "Submitted",
          verificationStatus: "Verified",
          verificationRemarks: "Pressure test passed. Tranche 2 release cleared."
        }
      }
    ],
    
    submissionRecords: [
      {
        id: "sub-hr-01",
        workId: "WORK-HR-RTK-001",
        contractorName: "The Sahil Co-operative Labour and Construction Society Ltd",
        checkpointActionId: "stg-01",
        checkpointActionName: "Stage 1 — Site Preparation & RCC Foundation Pouring",
        evidenceType: "Geo-tagged Work Progress Photo",
        files: [
          {
            name: "CHC_Kalanaur_Foundation_GeoTag.jpg",
            url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=400&q=80",
            size: "2.4 MB",
            type: "Geo-tagged Photo",
            lat: 28.8955,
            lng: 76.6066,
            timestamp: "12 May 2024 10:15 AM"
          }
        ],
        uploadTimestamp: "12 May 2024 10:25 AM",
        latitude: 28.8955,
        longitude: 76.6066,
        locationText: "Kalanaur Block, Rohtak (28.8955° N, 76.6066° E)",
        physicalProgressPercent: 25,
        expenditureAmountRs: 3750000,
        workStage: "Stage 1 — Site Preparation & RCC Foundation Pouring",
        materialStatus: "Steel reinforcement & cement batch verified",
        description: "RCC foundation plinth completed with structural test clearance.",
        submissionStatus: "Submitted",
        verificationStatus: "Verified",
        verificationRemarks: "Verified on site by Executive Engineer PHED Rohtak."
      }
    ]
  },
  {
    id: "WORK-HR-RTK-002",
    title: "Construction of Concrete Rural Access Road & Drainage Network, Sampla Block",
    category: "Roads",
    state: "Haryana",
    district: "Rohtak",
    constituency: "Rohtak (PC-07)",
    mpName: "Shri Deepender Singh Hooda",
    implementingAuthority: "Public Works Department (PWD B&R), Rohtak",
    contractorName: "The Sahil Co-operative Labour and Construction Society Ltd",
    vendorId: "2df07d35-4493-4bd4-b7e6-d6a55ea3d80d",
    
    sanctionAmountRs: 9000000,
    recommendedAmountRs: 9000000,
    utilizedAmountRs: 8800000,
    remainingAmountRs: 200000,
    physicalProgress: 100,
    
    officialStartDate: "10 Jan 2024",
    officialExpectedCompletionDate: "30 Nov 2024",
    
    currentWorkStatus: "Completed",
    monitoringStatus: "Completed",
    nextRequiredSubmission: "Final Completion Certificate Handover",
    nextSubmissionDueDate: "Completed",
    riskIndicator: "Low Risk",
    
    checkpointActions: [],
    schedule: [],
    submissionRecords: []
  }
];

export const INITIAL_NOTIFICATIONS: ContractorNotification[] = [
  {
    id: "notif-01",
    workId: "WORK-HR-RTK-001",
    title: "Stage 3 Evidence Action Due Soon",
    message: "Stage 3 ('Internal Plumbing & Electrical Fitting') evidence submission for Kalanaur CHC is scheduled for 20 Nov 2024.",
    date: "10 Oct 2024",
    type: "info",
    read: false
  },
  {
    id: "notif-02",
    workId: "WORK-HR-RTK-002",
    title: "Final Completion Milestone Approved",
    message: "District Authority Rohtak has verified 100% completion of Sampla Rural Road.",
    date: "05 Nov 2024",
    type: "success",
    read: true
  }
];
