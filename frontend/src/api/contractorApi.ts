/**
 * Contractor / Vendor API Abstraction Layer
 * 
 * Manages authority-assigned MPLADS project data and handles
 * stage-period evidence submissions with geotag metadata.
 */

import { 
  ContractorProfile, 
  ContractorProject, 
  EvidenceSubmissionRecord, 
  SubmittedFileItem,
  ContractorNotification,
  DEFAULT_CONTRACTOR_PROFILE, 
  MOCK_CONTRACTOR_PROJECTS,
  INITIAL_NOTIFICATIONS,
  REGISTERED_VENDORS
} from '../data/contractorData';
import { JABALPUR_WORKS, ROHTAK_WORKS, GURUGRAM_WORKS } from '../data/mpladsData';
import { calculateMonitoringSchedule } from '../utils/aiTimelineGenerator';
import { saveEvidenceToSupabase } from './supabaseSync';
import { adminDataService } from './adminDataService';

export interface SubmitStagePayload {
  physicalProgressPercent: number;
  expenditureAmountRs: number;
  workStage: string;
  materialStatus: string;
  evidenceType: string;
  files: SubmittedFileItem[];
  latitude: number | null;
  longitude: number | null;
  locationText: string | null;
  notes: string;
}

// In-memory store for mutated session state
let localProjects: ContractorProject[] = [];
let localNotifications: ContractorNotification[] = [...INITIAL_NOTIFICATIONS];

import { districtContractorSync } from './districtContractorSync';

export const contractorApi = {
  /**
   * Fetch current contractor vendor profile (supports switching vendorId)
   */
  async getContractorProfile(vendorId?: string): Promise<ContractorProfile> {
    if (!vendorId) return Promise.resolve({ ...DEFAULT_CONTRACTOR_PROFILE });
    
    const vendor = REGISTERED_VENDORS.find(v => v.vendorId === vendorId) || REGISTERED_VENDORS[0];
    return Promise.resolve({
      id: `USR-${vendor.vendorId}`,
      agencyName: vendor.firmName,
      vendorId: vendor.vendorId,
      gstin: vendor.gstin,
      registrationNo: `PWD/${vendor.state.substring(0,2).toUpperCase()}/${vendor.registrationClass.split(' ')[0]}/901`,
      circle: `${vendor.district} Infrastructure Division Circle`,
      district: vendor.district,
      state: vendor.state,
      nodalOfficer: vendor.contactPerson,
      contactEmail: vendor.email,
      contactPhone: vendor.phone
    });
  },

  /**
   * Fetch authority-assigned works for the contractor (filtered by vendorId & district)
   */
  async getContractorProjects(vendorId: string = "VEN-HR-GGM-01"): Promise<ContractorProject[]> {
    const targetVendor = REGISTERED_VENDORS.find(v => v.vendorId === vendorId) || REGISTERED_VENDORS[0];
    const vendorDistrictLower = (targetVendor.district || "Gurugram").toLowerCase().trim();

    // 1. Fetch raw live DB projects for contractor's district
    let rawDbProjects: any[] = [];
    try {
      rawDbProjects = await adminDataService.getProjectsByDistrict(targetVendor.district);
    } catch (e) {
      console.warn("Using local fallback projects for contractor API:", e);
    }

    // 2. Filter raw DB projects strictly by vendor's district
    const districtFiltered = rawDbProjects;

    // Determine district works fallback if DB query returns empty array
    let datasetToMap = districtFiltered;
    if (districtFiltered.length === 0) {
      if (vendorDistrictLower === "rohtak") datasetToMap = ROHTAK_WORKS as any[];
      else datasetToMap = GURUGRAM_WORKS as any[];
    }

    // List of empanelled vendors registered for this vendor's district
    const districtVendors = REGISTERED_VENDORS.filter(v => 
      (v.district || "").toLowerCase().trim() === vendorDistrictLower
    );

    // Map DB rows to ContractorProject with exact authority quota assignments
    const mappedProjects: ContractorProject[] = datasetToMap.map((p: any, idx: number) => {
      let assignedVendor;
      if (vendorDistrictLower === "gurugram") {
        const v1 = districtVendors.find(v => v.vendorId === "VEN-HR-GGM-01") || districtVendors[0];
        const v2 = districtVendors.find(v => v.vendorId === "VEN-HR-GGM-02") || districtVendors[1] || v1;
        assignedVendor = (idx % 10 < 7) ? v1 : v2;
      } else if (vendorDistrictLower === "rohtak") {
        const v1 = districtVendors.find(v => v.vendorId === "VEN-HR-RTK-01") || districtVendors[0];
        const v2 = districtVendors.find(v => v.vendorId === "VEN-HR-RTK-02") || districtVendors[1] || v1;
        assignedVendor = (idx % 10 < 6) ? v1 : v2;
      } else {
        assignedVendor = districtVendors.find(v => v.firmName === (p.tender_reference_no || p.contractor)) ||
                         districtVendors[idx % Math.max(1, districtVendors.length)] || targetVendor;
      }

      const workId = p.project_id || p.id || `PROJ-${idx + 1}`;
      const existingLocal = localProjects.find(lp => lp.id === workId);
      if (existingLocal) {
        return {
          ...existingLocal,
          vendorId: assignedVendor.vendorId,
          contractorName: assignedVendor.firmName
        };
      }

      const calculatedSchedule = calculateMonitoringSchedule({
        workId: workId,
        officialStartDate: p.start_date || p.dateSanctioned || "2024-04-01",
        officialExpectedCompletionDate: p.expected_completion_date || p.targetCompletion || "2025-03-31",
        category: p.category || "Roads"
      });

      const sanctionedRs = Number(p.sanctioned_amount || (p.sanctionedAmt || 0.10) * 10000000);
      const utilizedRs = Number(p.utilized_amount || (p.expenditureAmt || 0) * 10000000);
      const remainingRs = Math.max(0, sanctionedRs - utilizedRs);

      return {
        id: workId,
        title: p.project_name || p.title || "MPLADS Infrastructure Development Work",
        category: (p.category as any) || "Roads",
        state: p.state || targetVendor.state,
        district: p.district || targetVendor.district,
        constituency: p.constituency || `${targetVendor.district} (PC-01)`,
        mpName: p.mp_name || p.mpName || "District Parliamentary MP",
        implementingAuthority: p.agency || p.implementing_agency_name || `Office of District Magistrate & Collector (IDA), ${targetVendor.district}`,
        contractorName: assignedVendor.firmName,
        vendorId: assignedVendor.vendorId,
        sanctionAmountRs: sanctionedRs,
        recommendedAmountRs: Number(p.recommended_amount || sanctionedRs),
        utilizedAmountRs: utilizedRs,
        remainingAmountRs: remainingRs,
        physicalProgress: p.progress_percentage ?? p.physicalProgress ?? 35,
        officialStartDate: p.start_date || p.dateSanctioned || "2024-04-01",
        officialExpectedCompletionDate: p.expected_completion_date || p.targetCompletion || "2025-03-31",
        currentWorkStatus: p.status === "Completed" ? "Completed" : "InProgress",
        monitoringStatus: "Active Monitoring",
        nextRequiredSubmission: calculatedSchedule.stages[0]?.stageName || "Initial Work Evidence",
        nextSubmissionDueDate: calculatedSchedule.stages[0]?.scheduledEndDate || p.expected_completion_date || "2025-03-31",
        riskIndicator: (p.progress_percentage || 0) < 30 ? "Delay Risk" : "Low Risk",
        checkpointActions: [],
        schedule: calculatedSchedule.stages,
        submissionRecords: []
      };
    });

    // Synchronize localProjects array
    mappedProjects.forEach(mp => {
      const idx = localProjects.findIndex(lp => lp.id === mp.id);
      if (idx >= 0) {
        localProjects[idx] = mp;
      } else {
        localProjects.push(mp);
      }
    });

    // Filter strictly for the requested vendorId / contractor firmName!
    const vendorProjects = localProjects.filter(p => 
      p.vendorId === targetVendor.vendorId || p.contractorName === targetVendor.firmName
    );

    return Promise.resolve(vendorProjects);
  },

  /**
   * Fetch single assigned project detail by ID
   */
  async getContractorProject(id: string): Promise<ContractorProject | null> {
    const found = localProjects.find(p => p.id === id);
    return Promise.resolve(found ? { ...found } : null);
  },

  /**
   * Submit detailed evidence for a specific stage period
   */
  async submitStageEvidence(
    workId: string, 
    stageId: string, 
    payload: SubmitStagePayload
  ): Promise<{ project: ContractorProject; record: EvidenceSubmissionRecord }> {
    await new Promise(res => setTimeout(res, 800));

    const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const fullTimestampStr = `${todayStr} ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

    let targetStageName = "Stage Evidence";

    localProjects = localProjects.map(project => {
      if (project.id === workId) {
        let newRecord: EvidenceSubmissionRecord | undefined;

        const updatedSchedule = project.schedule.map(stage => {
          if (stage.stageId === stageId) {
            targetStageName = stage.stageName;

            newRecord = {
              id: `rec-${Date.now().toString().slice(-4)}`,
              workId: project.id,
              contractorName: project.contractorName,
              checkpointActionId: stageId,
              checkpointActionName: stage.stageName,
              evidenceType: payload.evidenceType || "Stage Period Evidence",
              files: payload.files,
              uploadTimestamp: fullTimestampStr,
              latitude: payload.latitude,
              longitude: payload.longitude,
              locationText: payload.locationText,
              physicalProgressPercent: payload.physicalProgressPercent,
              expenditureAmountRs: payload.expenditureAmountRs,
              workStage: payload.workStage || stage.stageName,
              materialStatus: payload.materialStatus || "Material available on site",
              description: payload.notes || "Evidence uploaded for stage period.",
              submissionStatus: "Submitted",
              verificationStatus: "Under Scrutiny",
              verificationRemarks: "Logged into District Verification Portal. Pending Officer Inspection."
            };

            return {
              ...stage,
              status: "COMPLETED" as const,
              submissionStatus: "Submitted" as const,
              submittedDate: todayStr,
              submissionRecord: newRecord
            };
          }
          return stage;
        });

        if (!newRecord) {
          newRecord = {
            id: `rec-${Date.now().toString().slice(-4)}`,
            workId: project.id,
            contractorName: project.contractorName,
            checkpointActionId: stageId,
            checkpointActionName: targetStageName,
            evidenceType: payload.evidenceType,
            files: payload.files,
            uploadTimestamp: fullTimestampStr,
            latitude: payload.latitude,
            longitude: payload.longitude,
            locationText: payload.locationText,
            physicalProgressPercent: payload.physicalProgressPercent,
            expenditureAmountRs: payload.expenditureAmountRs,
            workStage: payload.workStage,
            materialStatus: payload.materialStatus,
            description: payload.notes,
            submissionStatus: "Submitted",
            verificationStatus: "Under Scrutiny",
            verificationRemarks: "Logged into District Verification Portal."
          };
        }

        const isCompleted = payload.physicalProgressPercent >= 100;
        const newUtilized = payload.expenditureAmountRs;
        const newRemaining = Math.max(0, project.sanctionAmountRs - newUtilized);

        return {
          ...project,
          physicalProgress: payload.physicalProgressPercent,
          utilizedAmountRs: newUtilized,
          remainingAmountRs: newRemaining,
          currentWorkStatus: isCompleted ? ("Completed" as const) : project.currentWorkStatus,
          monitoringStatus: isCompleted ? ("Completed" as const) : ("Under Scrutiny" as const),
          schedule: updatedSchedule,
          submissionRecords: [newRecord, ...project.submissionRecords]
        };
      }
      return project;
    });

    // Save asynchronously to Supabase DB `evidence` table
    const updatedProj = localProjects.find(p => p.id === workId)!;
    saveEvidenceToSupabase(
      workId,
      updatedProj?.contractorName || "Contractor",
      stageId,
      targetStageName,
      payload
    );

    // Add notification
    localNotifications.unshift({
      id: `notif-${Date.now().toString().slice(-4)}`,
      workId,
      title: "Stage Evidence Submitted Successfully",
      message: `Evidence for stage '${targetStageName}' submitted on ${todayStr}. Routed for District verification.`,
      date: todayStr,
      type: "success",
      read: false
    });

    const submissionRecord = updatedProj.submissionRecords[0];

    return { project: updatedProj, record: submissionRecord };
  },

  /**
   * Sync / update project assigned by District Authority
   */
  async syncAssignedProject(project: ContractorProject): Promise<void> {
    const idx = localProjects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      localProjects[idx] = project;
    } else {
      localProjects.unshift(project);
    }
    return Promise.resolve();
  },

  /**
   * Add a notification to contractor inbox
   */
  async addNotification(notif: ContractorNotification): Promise<void> {
    localNotifications.unshift(notif);
    return Promise.resolve();
  },

  /**
   * Get contractor notifications list
   */
  async getNotifications(): Promise<ContractorNotification[]> {
    return Promise.resolve([...localNotifications]);
  },

  async getContractorNotifications(): Promise<ContractorNotification[]> {
    return Promise.resolve([...localNotifications]);
  },

  /**
   * Request Official Work Completion Certificate from District Authority
   */
  async requestCompletionCertificate(workId: string, remarks?: string): Promise<ContractorProject> {
    const projIdx = localProjects.findIndex(p => p.id === workId);
    if (projIdx === -1) {
      throw new Error(`Project #${workId} not found`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const project = localProjects[projIdx];

    const updatedProj: ContractorProject = {
      ...project,
      completionCertificateStatus: 'Requested',
      completionCertificateRequestedDate: todayStr,
      completionCertificateRemarks: remarks || "All physical stages completed & certified geotagged evidence uploaded."
    };

    localProjects[projIdx] = updatedProj;

    // Add notification
    localNotifications.unshift({
      id: `notif-cert-${Date.now().toString().slice(-4)}`,
      workId,
      title: "Completion Certificate Requested",
      message: `Request for Work Completion Certificate for Work #${workId} submitted to District Magistrate & Collector on ${todayStr}.`,
      date: todayStr,
      type: "success",
      read: false
    });

    return Promise.resolve(updatedProj);
  },

  /**
   * Mark notifications as read
   */
  async markNotificationsRead(): Promise<void> {
    localNotifications = localNotifications.map(n => ({ ...n, read: true }));
    return Promise.resolve();
  }
};
