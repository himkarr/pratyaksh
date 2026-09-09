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
import { JABALPUR_WORKS } from '../data/mpladsData';
import { calculateMonitoringSchedule } from '../utils/aiTimelineGenerator';
import { saveEvidenceToSupabase } from './supabaseSync';

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

function buildJabalpurContractorProjects(): ContractorProject[] {
  return JABALPUR_WORKS.map(work => {
    const vendor = REGISTERED_VENDORS.find(v => v.firmName === work.contractor) || REGISTERED_VENDORS[1];
    const calculatedSchedule = calculateMonitoringSchedule({
      workId: work.id,
      officialStartDate: work.dateSanctioned || "2024-04-01",
      officialExpectedCompletionDate: work.targetCompletion || "2025-03-31",
      category: work.category || "Roads"
    });

    return {
      id: work.id,
      title: work.title,
      category: (work.category as any) || "Roads",
      state: work.state,
      district: work.district,
      constituency: work.constituency || "Jabalpur (PC-13)",
      mpName: work.mpName || "Shri Ashish Dubey",
      implementingAuthority: work.agency || `Office of District Magistrate, Jabalpur`,
      contractorName: vendor.firmName,
      vendorId: vendor.vendorId,
      sanctionAmountRs: (work.sanctionedAmt || 0.10) * 10000000,
      recommendedAmountRs: (work.recommendedAmt || 0.10) * 10000000,
      utilizedAmountRs: (work.expenditureAmt || 0) * 10000000,
      remainingAmountRs: ((work.sanctionedAmt || 0.10) - (work.expenditureAmt || 0)) * 10000000,
      physicalProgress: work.physicalProgress || 0,
      officialStartDate: work.dateSanctioned || "2024-04-01",
      officialExpectedCompletionDate: work.targetCompletion || "2025-03-31",
      currentWorkStatus: work.status === "Completed" ? "Completed" : "InProgress",
      monitoringStatus: "Active Monitoring",
      nextRequiredSubmission: calculatedSchedule.stages[0]?.stageName || "Initial Work Evidence",
      nextSubmissionDueDate: calculatedSchedule.stages[0]?.scheduledEndDate || work.targetCompletion || "2025-03-31",
      riskIndicator: (work.physicalProgress || 0) < 30 ? "Delay Risk" : "Low Risk",
      checkpointActions: [],
      schedule: calculatedSchedule.stages,
      submissionRecords: []
    };
  });
}

// In-memory store for session state (scoped strictly to Jabalpur District Authority assigned works)
let localProjects: ContractorProject[] = buildJabalpurContractorProjects();
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
   * Fetch authority-assigned works for the contractor (filtered by vendorId)
   */
  async getContractorProjects(vendorId?: string): Promise<ContractorProject[]> {
    const districtWorks = districtContractorSync.getWorks();
    districtWorks.forEach(work => {
      const existingIdx = localProjects.findIndex(p => p.id === work.id);
      const vendor = REGISTERED_VENDORS.find(v => v.firmName === work.contractor) || REGISTERED_VENDORS[0];
      
      if (existingIdx >= 0) {
        localProjects[existingIdx].contractorName = vendor.firmName;
        localProjects[existingIdx].vendorId = vendor.vendorId;
      } else {
        const calculatedSchedule = calculateMonitoringSchedule({
          workId: work.id,
          officialStartDate: work.dateSanctioned || "2024-04-01",
          officialExpectedCompletionDate: work.targetCompletion || "2025-03-31",
          category: work.category || "Roads"
        });

        localProjects.unshift({
          id: work.id,
          title: work.title,
          category: (work.category as any) || "Roads",
          state: work.state,
          district: work.district,
          constituency: work.constituency || "Jabalpur (PC-13)",
          mpName: work.mpName || "Shri Ashish Dubey",
          implementingAuthority: work.agency || `Office of District Magistrate, ${work.district}`,
          contractorName: vendor.firmName,
          vendorId: vendor.vendorId,
          sanctionAmountRs: (work.sanctionedAmt || 0.10) * 10000000,
          recommendedAmountRs: (work.recommendedAmt || 0.10) * 10000000,
          utilizedAmountRs: (work.expenditureAmt || 0) * 10000000,
          remainingAmountRs: ((work.sanctionedAmt || 0.10) - (work.expenditureAmt || 0)) * 10000000,
          physicalProgress: work.physicalProgress || 0,
          officialStartDate: work.dateSanctioned || "2024-04-01",
          officialExpectedCompletionDate: work.targetCompletion || "2025-03-31",
          currentWorkStatus: work.status === "Completed" ? "Completed" : "InProgress",
          monitoringStatus: "Active Monitoring",
          nextRequiredSubmission: calculatedSchedule.stages[0]?.stageName || "Initial Work Evidence",
          nextSubmissionDueDate: calculatedSchedule.stages[0]?.scheduledEndDate || work.targetCompletion || "2025-03-31",
          riskIndicator: (work.physicalProgress || 0) < 30 ? "Delay Risk" : "Low Risk",
          checkpointActions: [],
          schedule: calculatedSchedule.stages,
          submissionRecords: []
        });
      }
    });

    if (!vendorId) return Promise.resolve([...localProjects]);

    const vendor = REGISTERED_VENDORS.find(v => v.vendorId === vendorId);
    const filtered = localProjects.filter(p => 
      p.vendorId === vendorId || (vendor && p.contractorName === vendor.firmName)
    );
    return Promise.resolve(filtered);
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
