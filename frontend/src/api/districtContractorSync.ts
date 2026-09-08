/**
 * District Authority <-> Contractor Shared Sync Service
 * 
 * Manages bi-directional data flow between District Authority (Magistrate / DRDA Nodal Officer)
 * and Contractors / Vendors for:
 * 1. Registered Contractor Directory & Work Assignments
 * 2. Stage Monitoring Evidence Submissions Review
 * 3. District Officer Verification & Sign-off
 */

import { WorkItem, INITIAL_WORKS } from '../data/mpladsData';
import { 
  ContractorProject, 
  EvidenceSubmissionRecord, 
  ContractorNotification,
  MOCK_CONTRACTOR_PROJECTS,
  VendorDetails,
  REGISTERED_VENDORS
} from '../data/contractorData';
import { contractorApi } from './contractorApi';
import { calculateMonitoringSchedule } from '../utils/aiTimelineGenerator';
import { 
  saveProjectToSupabase, 
  fetchEvidenceFromSupabase, 
  updateEvidenceStatusInSupabase,
  seedJabalpurProjectsToSupabase
} from './supabaseSync';

export type { VendorDetails };
export { REGISTERED_VENDORS };

class DistrictContractorSyncService {
  private works: WorkItem[] = [...INITIAL_WORKS];

  constructor() {
    // Seed Jabalpur works into live Supabase database on initialization
    seedJabalpurProjectsToSupabase();
  }

  /**
   * Get all synced district works
   */
  getWorks(): WorkItem[] {
    return [...this.works];
  }

  /**
   * Add or update a work in the central sync store & Supabase DB
   */
  addWork(work: WorkItem): void {
    const idx = this.works.findIndex(w => w.id === work.id);
    if (idx >= 0) {
      this.works[idx] = work;
    } else {
      this.works.unshift(work);
    }
    saveProjectToSupabase(work);
  }

  /**
   * Get list of registered contractors/vendors
   */
  getRegisteredVendors(): VendorDetails[] {
    return [...REGISTERED_VENDORS];
  }

  /**
   * Get vendor detail by vendor ID
   */
  getVendorById(vendorId: string): VendorDetails | null {
    return REGISTERED_VENDORS.find(v => v.vendorId === vendorId) || null;
  }

  /**
   * Get vendor details assigned to a specific work
   */
  async getContractorForWork(workId: string): Promise<{ work: WorkItem; vendor: VendorDetails | null } | null> {
    const work = this.works.find(w => w.id === workId);
    if (!work) return null;

    const contractorProject = await contractorApi.getContractorProject(workId);
    const vendorId = contractorProject?.vendorId || REGISTERED_VENDORS.find(v => v.firmName === work.contractor)?.vendorId;
    const vendor = vendorId ? this.getVendorById(vendorId) : null;

    return { work, vendor };
  }

  /**
   * Assign or reassign a contractor to a work item
   */
  async assignContractorToWork(
    workId: string,
    vendorId: string,
    officialStartDate: string,
    officialExpectedCompletionDate: string,
    assignedByOfficer: string = "District Magistrate & Collector",
    workItemParam?: WorkItem
  ): Promise<{ work: WorkItem; project: ContractorProject }> {
    const vendor = this.getVendorById(vendorId);
    if (!vendor) {
      throw new Error(`Vendor ${vendorId} not found in registered directory.`);
    }

    let existingInSync = this.works.find(w => w.id === workId);

    if (!existingInSync && workItemParam) {
      existingInSync = { ...workItemParam };
      this.works.unshift(existingInSync);
    }

    // Update local District Authority work item
    this.works = this.works.map(w => {
      if (w.id === workId) {
        return {
          ...w,
          contractor: vendor.firmName,
          dateSanctioned: officialStartDate,
          targetCompletion: officialExpectedCompletionDate,
          status: w.status === "Recommended" ? "Sanctioned" : w.status
        };
      }
      return w;
    });

    let updatedWork = this.works.find(w => w.id === workId) || workItemParam;

    if (!updatedWork) {
      updatedWork = {
        id: workId,
        title: "MPLADS Public Infrastructure Project",
        category: "Roads",
        sectorName: "Roads",
        house: "Lok Sabha",
        constituency_code: "PC-01",
        state: "Madhya Pradesh",
        district: "Jabalpur",
        constituency: "Jabalpur",
        mpName: "Hon'ble MP",
        recommendedAmt: 0.25,
        sanctionedAmt: 0.25,
        expenditureAmt: 0,
        physicalProgress: 0,
        financialProgress: 0,
        dateSanctioned: officialStartDate,
        targetCompletion: officialExpectedCompletionDate,
        status: "Sanctioned",
        agency: "DRDA",
        contractor: vendor.firmName,
        rating: 4.5,
        reviewsCount: 0,
        attachments: [],
        reviews: []
      };
      this.works.unshift(updatedWork);
    }

    // Check if contractor project exists in contractorApi store
    let contractorProjects = await contractorApi.getContractorProjects();
    let existingProject = contractorProjects.find(p => p.id === workId);

    const calculatedSchedule = calculateMonitoringSchedule({
      workId,
      officialStartDate,
      officialExpectedCompletionDate,
      category: updatedWork?.category || "Roads"
    });

    if (existingProject) {
      existingProject = {
        ...existingProject,
        contractorName: vendor.firmName,
        vendorId: vendor.vendorId,
        officialStartDate,
        officialExpectedCompletionDate,
        schedule: calculatedSchedule.stages
      };
    } else {
      existingProject = {
        id: updatedWork.id,
        title: updatedWork.title,
        category: (updatedWork.category as any) || "Roads",
        state: updatedWork.state,
        district: updatedWork.district,
        constituency: updatedWork.constituency || "District HQ",
        mpName: updatedWork.mpName || "Hon'ble MP",
        implementingAuthority: `Office of District Magistrate, ${updatedWork.district}`,
        contractorName: vendor.firmName,
        vendorId: vendor.vendorId,
        sanctionAmountRs: (updatedWork.sanctionedAmt || 0.10) * 10000000,
        recommendedAmountRs: (updatedWork.sanctionedAmt || 0.10) * 10000000,
        utilizedAmountRs: (updatedWork.expenditureAmt || 0) * 10000000,
        remainingAmountRs: ((updatedWork.sanctionedAmt || 0.10) - (updatedWork.expenditureAmt || 0)) * 10000000,
        physicalProgress: updatedWork.physicalProgress || 0,
        officialStartDate,
        officialExpectedCompletionDate,
        currentWorkStatus: updatedWork.status === "Completed" ? "Completed" : "InProgress",
        monitoringStatus: "Active Monitoring",
        nextRequiredSubmission: calculatedSchedule.stages[0]?.stageName || "Initial Work Evidence",
        nextSubmissionDueDate: calculatedSchedule.stages[0]?.scheduledEndDate || officialExpectedCompletionDate,
        riskIndicator: "Low Risk",
        checkpointActions: [],
        schedule: calculatedSchedule.stages,
        submissionRecords: []
      };
    }

    // Push/update in contractor store & Supabase DB
    await contractorApi.syncAssignedProject(existingProject);
    saveProjectToSupabase(updatedWork);

    // Send notification to contractor
    const notif: ContractorNotification = {
      id: `notif-assign-${Date.now()}`,
      workId: updatedWork.id,
      title: `Official Project Assigned: ${updatedWork.id}`,
      message: `You have been officially assigned project '${updatedWork.title}' by ${assignedByOfficer}. Official Start Date: ${officialStartDate}, Expected Completion: ${officialExpectedCompletionDate}.`,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      type: "info",
      read: false
    };
    await contractorApi.addNotification(notif);

    return { work: updatedWork, project: existingProject };
  }

  /**
   * Get all evidence submissions for a specific work item submitted by contractor
   * Merges local store and Supabase `evidence` table
   */
  async getStageSubmissionsForWork(workId: string): Promise<EvidenceSubmissionRecord[]> {
    const project = await contractorApi.getContractorProject(workId);
    const localRecords = project ? project.submissionRecords || [] : [];
    
    // Fetch live evidence from Supabase `evidence` table
    const supabaseRecords = await fetchEvidenceFromSupabase(workId);

    // Merge records avoiding duplicates by ID
    const mergedMap = new Map<string, EvidenceSubmissionRecord>();
    localRecords.forEach(r => mergedMap.set(r.id, r));
    supabaseRecords.forEach(r => {
      if (!mergedMap.has(r.id)) {
        mergedMap.set(r.id, r);
      }
    });

    return Array.from(mergedMap.values());
  }

  /**
   * District Officer Sign-off / Verification of Contractor Stage Submission
   */
  async verifyStageSubmissionByDistrictOfficer(
    workId: string,
    stageId: string,
    recordId: string,
    verificationStatus: 'Verified' | 'Rejected' | 'Under Scrutiny',
    districtOfficerRemarks: string,
    officerName: string = "Smt. G. Srijana, IAS (District Magistrate & Collector)"
  ): Promise<{ project: ContractorProject; updatedRecord: EvidenceSubmissionRecord }> {
    const contractorProjects = await contractorApi.getContractorProjects();
    const targetProject = contractorProjects.find(p => p.id === workId);

    if (!targetProject) {
      throw new Error(`Project ${workId} not found in contractor database.`);
    }

    let updatedRecord: EvidenceSubmissionRecord | null = null;

    // Update submission record verification
    const updatedRecords = (targetProject.submissionRecords || []).map(rec => {
      if (rec.id === recordId || rec.checkpointActionId === stageId) {
        updatedRecord = {
          ...rec,
          verificationStatus: verificationStatus === 'Verified' ? 'Verified' : verificationStatus === 'Rejected' ? 'Rejected' : 'Under Scrutiny',
          verificationRemarks: `${districtOfficerRemarks} (Verified by: ${officerName})`
        };
        return updatedRecord;
      }
      return rec;
    });

    if (!updatedRecord && targetProject.submissionRecords.length > 0) {
      updatedRecord = targetProject.submissionRecords[targetProject.submissionRecords.length - 1];
    }

    // Sync to Supabase `evidence` table
    if (recordId) {
      updateEvidenceStatusInSupabase(recordId, verificationStatus, districtOfficerRemarks);
    }

    // Update stage item in schedule
    let verifiedPhysicalProgress = targetProject.physicalProgress;
    let verifiedExpenditure = targetProject.utilizedAmountRs;

    const updatedSchedule = targetProject.schedule.map(stage => {
      if (stage.stageId === stageId) {
        if (verificationStatus === 'Verified') {
          verifiedPhysicalProgress = Math.max(verifiedPhysicalProgress, stage.targetProgressPercent);
        }
        return {
          ...stage,
          submissionStatus: (verificationStatus === 'Verified' ? 'Verified' : 'Submitted') as 'Verified' | 'Submitted',
          status: verificationStatus === 'Verified' ? 'COMPLETED' as const : stage.status
        };
      }
      return stage;
    });

    const updatedProject: ContractorProject = {
      ...targetProject,
      physicalProgress: verifiedPhysicalProgress,
      schedule: updatedSchedule,
      submissionRecords: updatedRecords,
      monitoringStatus: verificationStatus === 'Verified' ? 'Active Monitoring' : 'Action Pending'
    };

    await contractorApi.syncAssignedProject(updatedProject);

    // Sync physical progress back to District Authority WorkItem store
    this.works = this.works.map(w => {
      if (w.id === workId) {
        return {
          ...w,
          physicalProgress: verifiedPhysicalProgress,
          status: verifiedPhysicalProgress >= 100 ? 'Completed' : 'Ongoing'
        };
      }
      return w;
    });

    // Notify Contractor
    const notif: ContractorNotification = {
      id: `notif-verif-${Date.now()}`,
      workId,
      title: `Stage Evidence Verification: ${verificationStatus.toUpperCase()}`,
      message: `District Officer (${officerName}) has marked your stage submission as '${verificationStatus}'. Remarks: "${districtOfficerRemarks}". Verified Physical Progress: ${verifiedPhysicalProgress}%.`,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      type: verificationStatus === 'Verified' ? 'success' : 'warning',
      read: false
    };
    await contractorApi.addNotification(notif);

    return { project: updatedProject, updatedRecord: updatedRecord || (updatedRecords[0] as EvidenceSubmissionRecord) };
  }
}

export const districtContractorSync = new DistrictContractorSyncService();
