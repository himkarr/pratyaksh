import React, { useState, useEffect } from "react";
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  Clock, 
  UserCheck, 
  Send, 
  X,
  ExternalLink,
  Camera,
  Check,
  Calendar,
  Layers
} from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { districtContractorSync, VendorDetails } from "../../api/districtContractorSync";
import { EvidenceSubmissionRecord, ContractorProject, MonitoringScheduleItem } from "../../data/contractorData";
import { contractorApi } from "../../api/contractorApi";
import { calculateMonitoringSchedule } from "../../utils/aiTimelineGenerator";
import { Button } from "../ui/Button";

interface ContractorInspectionPanelProps {
  work: WorkItem;
  onUpdateWork?: (updatedWork: WorkItem) => void;
}

export const ContractorInspectionPanel: React.FC<ContractorInspectionPanelProps> = ({
  work,
  onUpdateWork
}) => {
  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [contractorProject, setContractorProject] = useState<ContractorProject | null>(null);
  const [submissions, setSubmissions] = useState<EvidenceSubmissionRecord[]>([]);
  const [schedule, setSchedule] = useState<MonitoringScheduleItem[]>([]);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sign-off modal state
  const [selectedRecord, setSelectedRecord] = useState<EvidenceSubmissionRecord | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'Verified' | 'Rejected' | 'Under Scrutiny'>('Verified');
  const [remarks, setRemarks] = useState<string>("");
  const [isSubmittingSignoff, setIsSubmittingSignoff] = useState<boolean>(false);
  const [signoffNotice, setSignoffNotice] = useState<string | null>(null);

  // Assign contractor modal state
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(work.dateSanctioned || "2024-03-31");
  const [targetDate, setTargetDate] = useState<string>(work.targetCompletion || "2025-03-31");

  useEffect(() => {
    loadContractorData();
  }, [work.id]);

  const loadContractorData = async () => {
    setIsLoading(true);
    try {
      const data = await districtContractorSync.getContractorForWork(work.id);
      if (data) {
        setVendor(data.vendor);
      }
      const subs = await districtContractorSync.getStageSubmissionsForWork(work.id);
      setSubmissions(subs);

      const proj = await contractorApi.getContractorProject(work.id);
      let sch: MonitoringScheduleItem[] = [];
      if (proj && proj.schedule && proj.schedule.length > 0) {
        sch = proj.schedule;
      } else {
        sch = calculateMonitoringSchedule({
          workId: work.id,
          officialStartDate: work.dateSanctioned || "2024-01-01",
          officialExpectedCompletionDate: work.targetCompletion || "2025-03-31",
          category: work.category || "General"
        }).stages;
      }
      setSchedule(sch);
    } catch (err) {
      console.error("Error loading contractor inspection data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) return;

    try {
      const { work: updatedWork } = await districtContractorSync.assignContractorToWork(
        work.id,
        selectedVendorId,
        startDate,
        targetDate
      );
      setSignoffNotice(`Contractor successfully assigned to Work #${work.id}`);
      setIsAssigning(false);
      if (onUpdateWork) onUpdateWork(updatedWork);
      await loadContractorData();
      setTimeout(() => setSignoffNotice(null), 4000);
    } catch (err: any) {
      console.error("Error assigning contractor:", err);
    }
  };

  const handleVerifySubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setIsSubmittingSignoff(true);

    try {
      const { updatedRecord } = await districtContractorSync.verifyStageSubmissionByDistrictOfficer(
        work.id,
        selectedRecord.checkpointActionId,
        selectedRecord.id,
        verificationStatus,
        remarks || "Verification completed by District Magistrate Inspection Officer."
      );

      setSignoffNotice(`Stage Evidence Submission ${verificationStatus.toUpperCase()} successfully.`);
      setSelectedRecord(null);
      setRemarks("");
      await loadContractorData();
      setTimeout(() => setSignoffNotice(null), 4000);
    } catch (err: any) {
      console.error("Error verifying submission:", err);
    } finally {
      setIsSubmittingSignoff(false);
    }
  };

  const getTimelinessInfo = (uploadTimestampStr: string, targetEndDateStr?: string) => {
    if (!targetEndDateStr) {
      return { status: "ON TIME SUBMISSION", isLate: false, daysLate: 0, badgeClass: "gov-badge-success" };
    }

    let uploadDate: Date | null = null;
    const d = new Date(uploadTimestampStr);
    if (!isNaN(d.getTime())) {
      uploadDate = d;
    } else {
      const match = uploadTimestampStr.match(/(\d{1,2})[\/\s-]([A-Za-z0-9]+)[\/\s-](\d{4})/);
      if (match) {
        const day = parseInt(match[1], 10);
        const monthStr = match[2];
        const year = parseInt(match[3], 10);
        let month = parseInt(monthStr, 10) - 1;
        if (isNaN(month)) {
          month = new Date(`${monthStr} 1, 2000`).getMonth();
        }
        uploadDate = new Date(year, month, day);
      }
    }

    const targetDate = new Date(targetEndDateStr);
    if (!uploadDate || isNaN(uploadDate.getTime()) || isNaN(targetDate.getTime())) {
      return { status: "ON TIME SUBMISSION", isLate: false, daysLate: 0, badgeClass: "gov-badge-success" };
    }

    const uploadMidnight = new Date(uploadDate.getFullYear(), uploadDate.getMonth(), uploadDate.getDate());
    const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    const diffMs = uploadMidnight.getTime() - targetMidnight.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return {
        status: `DELAYED SUBMISSION (${diffDays} Day${diffDays > 1 ? 's' : ''} Late)`,
        isLate: true,
        daysLate: diffDays,
        badgeClass: "gov-badge-danger"
      };
    } else {
      return {
        status: "ON TIME SUBMISSION",
        isLate: false,
        daysLate: 0,
        badgeClass: "gov-badge-success"
      };
    }
  };

  const registeredVendors = districtContractorSync.getRegisteredVendors();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
      {/* Toast Notice */}
      {signoffNotice && (
        <div style={{ 
          background: "#ecfdf5", 
          color: "#065f46", 
          padding: "10px 14px", 
          borderRadius: "6px", 
          border: "1px solid #a7f3d0",
          fontSize: "0.82rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <CheckCircle2 size={16} />
          <span>{signoffNotice}</span>
        </div>
      )}

      {/* Contractor Vendor Identity Header Card */}
      <div 
        className="gov-card"
        style={{
          background: "#f8fafc",
          border: "1px solid var(--border-main)",
          padding: "14px 16px",
          borderRadius: "8px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "var(--gov-primary)", color: "#fff", width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--gov-primary)" }}>
                Official Empanelled Executing Contractor
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                Contractor assignment & milestone verification portal for District Magistrate & Nodal Officer
              </div>
            </div>
          </div>

          <button
            type="button"
            className="gov-btn gov-btn-secondary"
            onClick={() => setIsAssigning(true)}
            style={{ fontSize: "0.76rem", padding: "5px 12px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Building2 size={13} />
            <span>{vendor ? "Reassign Contractor" : "Assign Contractor"}</span>
          </button>
        </div>

        {vendor ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "0.80rem" }}>
            <div>
              <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Firm / Contractor Name</div>
              <div style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "0.88rem" }}>{vendor.firmName}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Vendor Unique ID</div>
              <div style={{ fontWeight: 700, color: "var(--gov-primary)", fontFamily: "monospace" }}>{vendor.vendorId}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Registration Class</div>
              <div><span className="gov-badge gov-badge-info" style={{ fontSize: "0.68rem" }}>{vendor.registrationClass}</span></div>
            </div>
            <div>
              <div style={{ fontSize: "0.70rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Nodal Contact Person</div>
              <div style={{ fontWeight: 600, color: "var(--text-body)" }}>{vendor.contactPerson}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{vendor.phone} • {vendor.email}</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic", padding: "6px 0" }}>
            No contractor explicitly assigned yet. Click "Assign Contractor" to select an empanelled vendor from the District Directory.
          </div>
        )}
      </div>

      {/* SECTION A: OFFICIAL MILESTONE SCHEDULE & TIMELINESS MONITOR */}
      <div className="gov-card" style={{ padding: "16px 18px", background: "var(--bg-surface)", border: "1px solid var(--border-main)" }}>
        <div style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h4 style={{ fontSize: "0.98rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={18} color="var(--gov-accent)" />
              Official Milestone Schedule & Upload Timeliness Monitor
            </h4>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Designated stage timeline targets vs contractor upload timestamps & on-time verification
            </div>
          </div>

          <span className="gov-badge gov-badge-info" style={{ fontSize: "0.72rem", padding: "4px 8px" }}>
            {schedule.length} Milestones Defined
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {schedule.map((st, idx) => {
            const matchingSub = submissions.find(s => s.checkpointActionId === st.stageId || s.checkpointActionName.toLowerCase() === st.stageName.toLowerCase()) || st.submissionRecord;
            const isSubmitted = !!matchingSub;
            const timeliness = matchingSub ? getTimelinessInfo(matchingSub.uploadTimestamp, st.scheduledEndDate) : null;

            return (
              <div
                key={st.stageId || idx}
                style={{
                  border: `1px solid ${isSubmitted ? (timeliness?.isLate ? "var(--status-danger-border)" : "var(--status-success-border)") : "var(--border-main)"}`,
                  borderRadius: "6px",
                  padding: "10px 14px",
                  background: isSubmitted ? (timeliness?.isLate ? "#fff5f5" : "#f0fdf4") : "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: isSubmitted ? (timeliness?.isLate ? "#ef4444" : "#10b981") : "#94a3b8",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.75rem"
                  }}>
                    {idx + 1}
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.86rem", color: "var(--text-main)" }}>
                      {st.stageName} <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 600 }}>(Target: {st.targetProgressPercent}%)</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={12} color="var(--gov-accent)" />
                      <span>Scheduled Window: <strong>{st.scheduledStartDate} – {st.scheduledEndDate}</strong></span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {matchingSub ? (
                    <>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Uploaded: <strong>{matchingSub.uploadTimestamp}</strong>
                      </span>
                      <span className={`gov-badge ${timeliness?.badgeClass}`} style={{ fontWeight: 800, fontSize: "0.68rem" }}>
                        {timeliness?.isLate ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                        {timeliness?.status}
                      </span>
                    </>
                  ) : (
                    <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.68rem" }}>
                      <Clock size={11} />
                      PENDING CONTRACTOR UPLOAD
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline-Based Contractor Stage Evidence & Image Gallery */}
      <div className="gov-card" style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
          <div>
            <h4 style={{ fontSize: "0.98rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Camera size={18} />
              Timeline-Based Stage Evidence & Geotag Photo Inspection
            </h4>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Stage-by-stage evidence uploaded by contractor during work execution periods
            </div>
          </div>

          <span className="gov-badge gov-badge-info" style={{ fontSize: "0.72rem", padding: "4px 8px" }}>
            {submissions.length} Submissions Received
          </span>
        </div>

        {submissions.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.84rem", background: "var(--bg-surface-subtle)", borderRadius: "8px", border: "1px dashed var(--border-main)" }}>
            No stage evidence photos or documents submitted by contractor for this project yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {submissions.map((rec, stageIdx) => {
              const matchedStage = schedule.find(s => s.stageId === rec.checkpointActionId || s.stageName.toLowerCase() === rec.checkpointActionName.toLowerCase()) || schedule[stageIdx];
              const timeliness = getTimelinessInfo(rec.uploadTimestamp, matchedStage?.scheduledEndDate);

              return (
                <div 
                  key={rec.id}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid var(--border-main)",
                    borderRadius: "8px",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  {/* Stage Header Strip */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid var(--border-light)", paddingBottom: "8px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="gov-badge gov-badge-primary" style={{ fontSize: "0.70rem", fontWeight: 800 }}>
                          Stage {stageIdx + 1}
                        </span>
                        <span style={{ fontSize: "0.90rem", fontWeight: 800, color: "var(--text-main)" }}>
                          {rec.checkpointActionName}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {rec.evidenceType} • Uploaded on <strong>{rec.uploadTimestamp}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="gov-badge gov-badge-info" style={{ fontWeight: 800 }}>
                        {rec.physicalProgressPercent}% Physical Progress
                      </span>
                      <span className={`gov-badge ${
                        rec.verificationStatus === "Verified" ? "gov-badge-success" :
                        rec.verificationStatus === "Rejected" ? "gov-badge-danger" : "gov-badge-warning"
                      }`} style={{ fontWeight: 800 }}>
                        {rec.verificationStatus}
                      </span>
                    </div>
                  </div>

                  {/* Milestone Timeliness & Scheduled Target Audit Banner */}
                  <div style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: timeliness.isLate ? "#fef2f2" : "#f0fdf4",
                    border: `1px solid ${timeliness.isLate ? "#fecaca" : "#bbf7d0"}`,
                    color: timeliness.isLate ? "#991b1b" : "#166534",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {timeliness.isLate ? <AlertTriangle size={15} color="#dc2626" /> : <CheckCircle2 size={15} color="#16a34a" />}
                      <span>Milestone Timeliness Audit: <strong>{timeliness.status}</strong></span>
                    </div>

                    <div style={{ fontSize: "0.72rem" }}>
                      Designated Stage Window: <strong>{matchedStage?.scheduledStartDate || "Start Date"} – {matchedStage?.scheduledEndDate || "Target Date"}</strong>
                    </div>
                  </div>

                {/* Geotag & Material Details */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", fontSize: "0.78rem" }}>
                  <div style={{ background: "#ffffff", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Geotag Coordinates</div>
                    {rec.latitude && rec.longitude ? (
                      <div style={{ color: "#0284c7", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                        <MapPin size={12} />
                        <span>Lat: {rec.latitude.toFixed(5)}°, Lng: {rec.longitude.toFixed(5)}°</span>
                      </div>
                    ) : (
                      <div style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No GPS coordinates</div>
                    )}
                    {rec.locationText && <div style={{ fontSize: "0.70rem", color: "var(--text-muted)" }}>{rec.locationText}</div>}
                  </div>

                  <div style={{ background: "#ffffff", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Reported Expenditure</div>
                    <div style={{ fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
                      ₹{(rec.expenditureAmountRs / 100000).toFixed(2)} Lakh
                    </div>
                    <div style={{ fontSize: "0.70rem", color: "var(--text-muted)" }}>Material: {rec.materialStatus || "Available"}</div>
                  </div>
                </div>

                {/* Stage Photos & Files Lightbox Grid */}
                <div>
                  <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px" }}>
                    Uploaded Evidence Assets ({rec.files.length}):
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
                    {rec.files.map((file, fIdx) => (
                      <div 
                        key={fIdx}
                        style={{
                          border: "1px solid var(--border-main)",
                          borderRadius: "6px",
                          overflow: "hidden",
                          background: "#ffffff",
                          display: "flex",
                          flexDirection: "column"
                        }}
                      >
                        {file.type?.includes("image") || file.url?.match(/\.(jpg|jpeg|png|webp)/i) ? (
                          <div style={{ height: "100px", overflow: "hidden", position: "relative", background: "#f1f5f9" }}>
                            <img 
                              src={file.url} 
                              alt={file.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: "0.62rem", padding: "2px 4px", display: "flex", alignItems: "center", gap: "2px" }}>
                              <MapPin size={9} color="#38bdf8" />
                              <span>GPS Geotagged</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: "70px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", color: "var(--gov-primary)" }}>
                            <FileText size={24} />
                          </div>
                        )}

                        <div style={{ padding: "6px 8px", fontSize: "0.70rem" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {file.name}
                          </div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "var(--gov-accent)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "2px", marginTop: "2px" }}
                          >
                            <span>Inspect Asset</span>
                            <ExternalLink size={9} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sign-off Action Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed var(--border-main)", paddingTop: "10px", marginTop: "4px" }}>
                  {rec.verificationRemarks ? (
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      <strong>Officer Remarks:</strong> {rec.verificationRemarks}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Pending District Magistrate Inspection Sign-off
                    </div>
                  )}

                  <button
                    type="button"
                    className="gov-btn gov-btn-primary"
                    onClick={() => {
                      setSelectedRecord(rec);
                      setRemarks(rec.verificationRemarks || "");
                    }}
                    style={{ fontSize: "0.74rem", padding: "5px 12px" }}
                  >
                    Perform Field Verification & Sign-off
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Assign Contractor Modal Drawer */}
      {isAssigning && (
        <div className="gov-modal-backdrop" onClick={() => setIsAssigning(false)}>
          <div className="gov-modal-content" style={{ maxWidth: "520px", padding: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
                Assign Empanelled Contractor to Work #{work.id}
              </h3>
              <button type="button" onClick={() => setIsAssigning(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignContractor} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px" }}>
                  Select Empanelled Vendor from District Directory:
                </label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.85rem" }}
                >
                  <option value="">-- Choose Registered Vendor --</option>
                  {registeredVendors.map(v => (
                    <option key={v.vendorId} value={v.vendorId}>
                      {v.firmName} ({v.vendorId} • {v.registrationClass})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "4px" }}>
                    Official Start Date:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.82rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "4px" }}>
                    Target Completion Date:
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    required
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.82rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                <button type="button" className="gov-btn gov-btn-secondary" onClick={() => setIsAssigning(false)}>
                  Cancel
                </button>
                <button type="submit" className="gov-btn gov-btn-primary" disabled={!selectedVendorId}>
                  Confirm Official Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* District Officer Sign-Off Modal */}
      {selectedRecord && (
        <div className="gov-modal-backdrop" onClick={() => setSelectedRecord(null)}>
          <div className="gov-modal-content" style={{ maxWidth: "560px", padding: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={18} />
                District Officer Inspection Sign-off
              </h3>
              <button type="button" onClick={() => setSelectedRecord(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleVerifySubmission} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "var(--bg-surface-subtle)", padding: "10px 14px", borderRadius: "6px", fontSize: "0.80rem" }}>
                <div><strong>Stage:</strong> {selectedRecord.checkpointActionName}</div>
                <div><strong>Contractor:</strong> {selectedRecord.contractorName}</div>
                <div><strong>Reported Physical Progress:</strong> {selectedRecord.physicalProgressPercent}%</div>
                <div><strong>Upload Timestamp:</strong> {selectedRecord.uploadTimestamp}</div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px" }}>
                  Verification Decision:
                </label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as any)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.85rem" }}
                >
                  <option value="Verified">✓ Approve & Verified (Official Field Sign-off)</option>
                  <option value="Under Scrutiny">⚠️ Under Scrutiny (Requires Field Officer Re-inspection)</option>
                  <option value="Rejected">❌ Reject Evidence (Non-compliant / Invalid Geotag)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px" }}>
                  District Magistrate / Inspection Officer Remarks:
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter official sign-off remarks, inspection report ref, or requirements..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.82rem" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" className="gov-btn gov-btn-secondary" onClick={() => setSelectedRecord(null)}>
                  Cancel
                </button>
                <button type="submit" className="gov-btn gov-btn-primary" disabled={isSubmittingSignoff}>
                  {isSubmittingSignoff ? "Transmitting Sign-off..." : "Submit Official Sign-off"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Lightbox Image Preview Modal */}
      {selectedPreviewImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px",
              maxWidth: "700px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "var(--gov-primary)" }}>
                📷 {selectedPreviewImage.title}
              </h4>
              <button
                onClick={() => setSelectedPreviewImage(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <img
              src={selectedPreviewImage.url}
              alt={selectedPreviewImage.title}
              style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: "8px", border: "1px solid var(--border-main)" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
