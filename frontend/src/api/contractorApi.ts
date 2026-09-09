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

// Helper functions for persistent local storage of evidence submissions and project overrides
const STORAGE_KEY_SUBMISSIONS = "mplads_contractor_submissions_v2";
const STORAGE_KEY_PROJECT_OVERRIDES = "mplads_contractor_project_overrides_v2";

function getStoredSubmissionsMap(): Record<string, EvidenceSubmissionRecord[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Failed to load stored submissions from localStorage:", e);
    return {};
  }
}

function saveSubmissionRecordToStorage(workId: string, record: EvidenceSubmissionRecord) {
  try {
    const map = getStoredSubmissionsMap();
    const existing = map[workId] || [];
    const idx = existing.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      existing[idx] = record;
    } else {
      existing.unshift(record);
    }
    map[workId] = existing;
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(map));
  } catch (e) {
    console.warn("Failed to save submission record to localStorage:", e);
  }
}

function getStoredProjectOverridesMap(): Record<string, Partial<ContractorProject>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECT_OVERRIDES);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Failed to load stored project overrides from localStorage:", e);
    return {};
  }
}

function saveProjectOverrideToStorage(workId: string, override: Partial<ContractorProject>) {
  try {
    const map = getStoredProjectOverridesMap();
    map[workId] = {
      ...(map[workId] || {}),
      ...override
    };
    localStorage.setItem(STORAGE_KEY_PROJECT_OVERRIDES, JSON.stringify(map));
  } catch (e) {
    console.warn("Failed to save project override to localStorage:", e);
  }
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

    const storedSubmissionsMap = getStoredSubmissionsMap();
    const storedOverridesMap = getStoredProjectOverridesMap();

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

      const calculatedSchedule = calculateMonitoringSchedule({
        workId: workId,
        officialStartDate: p.start_date || p.dateSanctioned || "2024-04-01",
        officialExpectedCompletionDate: p.expected_completion_date || p.targetCompletion || "2025-03-31",
        category: p.category || "Roads"
      });

      const sanctionedRs = Number(p.sanctioned_amount || (p.sanctionedAmt || 0.10) * 10000000);
      const initialUtilizedRs = Number(p.utilized_amount || (p.expenditureAmt || 0) * 10000000);

      // Merge stored submissions & project overrides from localStorage
      const localSavedRecords = storedSubmissionsMap[workId] || [];
      const projectOverride = storedOverridesMap[workId] || {};

      let currentSchedule = existingLocal?.schedule || projectOverride.schedule || calculatedSchedule.stages;
      let submissionRecords: EvidenceSubmissionRecord[] = existingLocal?.submissionRecords && existingLocal.submissionRecords.length > 0
        ? existingLocal.submissionRecords
        : localSavedRecords;

      localSavedRecords.forEach(lsRec => {
        if (!submissionRecords.some(r => r.id === lsRec.id)) {
          submissionRecords = [lsRec, ...submissionRecords];
        }
      });

      let cumulativeSpent = 0;
      let maxProgress = existingLocal?.physicalProgress || projectOverride.physicalProgress || (p.progress_percentage ?? p.physicalProgress ?? 35);

      if (submissionRecords.length > 0) {
        currentSchedule = currentSchedule.map(stage => {
          const rec = submissionRecords.find(r => r.checkpointActionId === stage.stageId || r.checkpointActionName === stage.stageName);
          if (rec) {
            return {
              ...stage,
              status: "COMPLETED" as const,
              submissionStatus: "Submitted" as const,
              submittedDate: rec.uploadTimestamp?.split(' ')[0] || "Submitted",
              submissionRecord: rec
            };
          }
          return stage;
        });

        submissionRecords.forEach(rec => {
          cumulativeSpent += (Number(rec.expenditureAmountRs) || 0);
          if (rec.physicalProgressPercent > maxProgress) {
            maxProgress = rec.physicalProgressPercent;
          }
        });
      }

      // Calculate total cumulative spent (adding up across all stages)
      const maxSpent = cumulativeSpent > 0
        ? cumulativeSpent
        : (existingLocal?.utilizedAmountRs || projectOverride.utilizedAmountRs || initialUtilizedRs);

      const remainingRs = Math.max(0, sanctionedRs - maxSpent);
      const isCompleted = maxProgress >= 100;
      const isAnomaly = maxSpent > sanctionedRs;

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
        utilizedAmountRs: maxSpent,
        remainingAmountRs: remainingRs,
        physicalProgress: maxProgress,
        officialStartDate: p.start_date || p.dateSanctioned || "2024-04-01",
        officialExpectedCompletionDate: p.expected_completion_date || p.targetCompletion || "2025-03-31",
        currentWorkStatus: isCompleted ? "Completed" : (p.status === "Completed" ? "Completed" : "InProgress"),
        monitoringStatus: isAnomaly ? "Expenditure Anomaly (Over Budget)" : (isCompleted ? "Completed" : (submissionRecords.length > 0 ? "Under Scrutiny" : "Active Monitoring")),
        nextRequiredSubmission: currentSchedule.find(s => s.status !== "COMPLETED")?.stageName || "Final Certificate",
        nextSubmissionDueDate: currentSchedule.find(s => s.status !== "COMPLETED")?.scheduledEndDate || p.expected_completion_date || "2025-03-31",
        riskIndicator: isAnomaly ? "High Anomaly Risk" : (maxProgress < 30 ? "Delay Risk" : "Low Risk"),
        checkpointActions: [],
        schedule: currentSchedule,
        submissionRecords: submissionRecords,
        ...projectOverride
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
    let found = localProjects.find(p => p.id === id);
    if (!found) {
      await this.getContractorProjects();
      found = localProjects.find(p => p.id === id);
    }
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

        const existingRecordsFiltered = project.submissionRecords.filter(r => r.id !== newRecord?.id && r.checkpointActionId !== stageId);
        const updatedSubmissionRecords = [newRecord, ...existingRecordsFiltered];

        // Sum up expenditure from ALL stage submission records (cumulative)
        let cumulativeSpent = 0;
        updatedSubmissionRecords.forEach(rec => {
          cumulativeSpent += (Number(rec.expenditureAmountRs) || 0);
        });

        const isCompleted = payload.physicalProgressPercent >= 100;
        const isAnomaly = cumulativeSpent > project.sanctionAmountRs;
        const newRemaining = Math.max(0, project.sanctionAmountRs - cumulativeSpent);

        const updatedProj = {
          ...project,
          physicalProgress: Math.max(project.physicalProgress, payload.physicalProgressPercent),
          utilizedAmountRs: cumulativeSpent,
          remainingAmountRs: newRemaining,
          currentWorkStatus: isCompleted ? ("Completed" as const) : project.currentWorkStatus,
          monitoringStatus: isAnomaly 
            ? ("Expenditure Anomaly (Over Budget)" as const)
            : (isCompleted ? ("Completed" as const) : ("Under Scrutiny" as const)),
          riskIndicator: isAnomaly ? ("High Anomaly Risk" as const) : project.riskIndicator,
          schedule: updatedSchedule,
          submissionRecords: updatedSubmissionRecords
        };

        // Save persistently to localStorage so data survives reloads
        saveSubmissionRecordToStorage(workId, newRecord);
        saveProjectOverrideToStorage(workId, {
          physicalProgress: updatedProj.physicalProgress,
          utilizedAmountRs: cumulativeSpent,
          remainingAmountRs: newRemaining,
          currentWorkStatus: updatedProj.currentWorkStatus,
          monitoringStatus: updatedProj.monitoringStatus,
          riskIndicator: updatedProj.riskIndicator,
          schedule: updatedSchedule
        });

        return updatedProj;
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
    saveProjectOverrideToStorage(project.id, {
      physicalProgress: project.physicalProgress,
      utilizedAmountRs: project.utilizedAmountRs,
      remainingAmountRs: project.remainingAmountRs,
      currentWorkStatus: project.currentWorkStatus,
      monitoringStatus: project.monitoringStatus,
      schedule: project.schedule,
      completionCertificateStatus: project.completionCertificateStatus,
      completionCertificateRequestedDate: project.completionCertificateRequestedDate,
      completionCertificateRemarks: project.completionCertificateRemarks
    });
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

    saveProjectOverrideToStorage(workId, {
      completionCertificateStatus: 'Requested',
      completionCertificateRequestedDate: todayStr,
      completionCertificateRemarks: updatedProj.completionCertificateRemarks
    });

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
