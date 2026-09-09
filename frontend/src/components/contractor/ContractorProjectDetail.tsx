import React, { useState } from "react";
import { ArrowLeft, Calendar, FileText, CheckCircle2, Clock, Upload, ShieldCheck, MapPin, AlertCircle, Building2, Target, TrendingUp, Users, Info } from "lucide-react";
import { ContractorProject, MonitoringScheduleItem } from "../../data/contractorData";
import { SubmitStagePayload } from "../../api/contractorApi";
import { ContractorTimeline } from "./ContractorTimeline";
import { EvidenceUploadModal } from "./EvidenceUploadModal";
import { RequestCompletionCertificateModal } from "./RequestCompletionCertificateModal";
import { SubmissionHistory } from "./SubmissionHistory";
import { Button } from "../ui/Button";
import { CivicUtilizationGauge } from "../common/CivicUtilizationGauge";

interface ContractorProjectDetailProps {
  project: ContractorProject;
  onBack: () => void;
  onSubmitStageEvidence: (
    workId: string, 
    stageId: string, 
    payload: SubmitStagePayload
  ) => void;
  onRequestCompletionCertificate?: (workId: string, remarks: string) => void;
}

export const ContractorProjectDetail: React.FC<ContractorProjectDetailProps> = ({
  project,
  onBack,
  onSubmitStageEvidence,
  onRequestCompletionCertificate
}) => {
  const [selectedStage, setSelectedStage] = useState<MonitoringScheduleItem | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const calculateDaysRemaining = (completionDateStr: string, currentStatus: string) => {
    if (currentStatus === "Completed") return 0;
    const target = new Date(completionDateStr);
    const today = new Date("2026-09-08"); // Current date
    if (isNaN(target.getTime())) return null;
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = calculateDaysRemaining(project.officialExpectedCompletionDate, project.currentWorkStatus);

  const formatCurrency = (amtRs: number | null) => {
    if (amtRs === null || amtRs === undefined) return "Not available";
    if (amtRs >= 10000000) return `₹${(amtRs / 10000000).toFixed(2)} Cr`;
    return `₹${(amtRs / 100000).toFixed(2)} Lakh`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Top Header Breadcrumb */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "var(--gov-accent)",
            fontSize: "0.84rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <ArrowLeft size={16} />
          Back to Assigned Works Portal
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="gov-badge gov-badge-info">WORK ID: {project.id}</span>
          <span className={`gov-badge ${project.currentWorkStatus === "Completed" ? "gov-badge-success" : project.currentWorkStatus === "Delayed" ? "gov-badge-danger" : "gov-badge-warning"}`}>
            {project.currentWorkStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: OFFICIAL PROJECT INFORMATION                                  */}
      {/* ========================================================================= */}
      <div className="civic-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
            SECTION 1 — OFFICIAL MPLADS PROJECT INFORMATION
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--gov-primary)", margin: "4px 0 0 0" }}>
            {project.title}
          </h2>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <span>State: <strong>{project.state}</strong></span>
            <span>Constituency: <strong>{project.constituency}</strong></span>
            <span>District: <strong>{project.district}</strong></span>
            <span>MP: <strong>{project.mpName}</strong></span>
          </div>
        </div>

        {/* Top Visual Row: Gauge & 2x2 Overview Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "16px", marginBottom: "8px" }}>
          {/* Left: Speedometer Gauge */}
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <CivicUtilizationGauge
              utilization={(project.sanctionAmountRs && project.sanctionAmountRs > 0)
                ? Math.min(100, Math.round(((project.utilizedAmountRs || 0) / project.sanctionAmountRs) * 100))
                : (project.physicalProgress || 0)}
              title={`${project.title.slice(0, 32).toUpperCase()} Utilization`}
              cardHeader="Fund Utilization"
              showInfoIcon={true}
              size="sm"
              hideCardWrap={true}
            />
          </div>

          {/* Right: 2x2 Colored Overview Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Sanctioned */}
            <div
              style={{
                background: "#dcfce7",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "all 0.25s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 14px -2px rgba(5, 150, 105, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckCircle2 size={17} />
              </div>
              <div>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#065f46", display: "block", lineHeight: 1.1 }}>
                  {formatCurrency(project.sanctionAmountRs)}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#047857", fontWeight: 600 }}>Sanction Outlay</span>
              </div>
            </div>

            {/* Recommended */}
            <div
              style={{
                background: "#fef9c3",
                border: "1px solid #fef08a",
                borderRadius: "10px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "all 0.25s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 14px -2px rgba(217, 119, 6, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#d97706", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <TrendingUp size={17} />
              </div>
              <div>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#92400e", display: "block", lineHeight: 1.1 }}>
                  {formatCurrency(project.recommendedAmountRs)}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#b45309", fontWeight: 600 }}>Recommended</span>
              </div>
            </div>

            {/* Spent */}
            <div
              style={{
                background: "#e0f2fe",
                border: "1px solid #bae6fd",
                borderRadius: "10px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "all 0.25s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 14px -2px rgba(2, 132, 199, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#0284c7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Target size={17} />
              </div>
              <div>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0369a1", display: "block", lineHeight: 1.1 }}>
                  {formatCurrency(project.utilizedAmountRs)}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: 600 }}>Spent Amount</span>
              </div>
            </div>

            {/* Physical Execution */}
            <div
              style={{
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                transition: "all 0.25s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 14px -2px rgba(100, 116, 139, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#475569", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Users size={17} />
              </div>
              <div>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", display: "block", lineHeight: 1.1 }}>
                  {project.physicalProgress}%
                </span>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Physical Progress</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Official Parameters Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px", fontSize: "0.8rem" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>WORK ID</div>
            <div style={{ fontWeight: 700, color: "var(--gov-primary)", fontFamily: "monospace", marginTop: "2px" }}>
              {project.id}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>WORK CATEGORY</div>
            <div style={{ fontWeight: 700, color: "var(--text-main)", marginTop: "2px" }}>
              {project.category}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>IMPLEMENTING DISTRICT AUTHORITY</div>
            <div style={{ fontWeight: 700, color: "var(--text-main)", marginTop: "2px" }}>
              {project.implementingAuthority}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>ASSIGNED CONTRACTOR / VENDOR</div>
            <div style={{ fontWeight: 700, color: "var(--text-main)", marginTop: "2px" }}>
              {project.contractorName}
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "monospace" }}>ID: {project.vendorId}</div>
          </div>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>SANCTION AMOUNT</div>
            <div style={{ fontWeight: 700, color: "var(--gov-primary)", marginTop: "2px" }}>
              {formatCurrency(project.sanctionAmountRs)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>RECOMMENDED AMOUNT</div>
            <div style={{ fontWeight: 700, color: "var(--gov-primary)", marginTop: "2px" }}>
              {formatCurrency(project.recommendedAmountRs)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>OFFICIAL PROJECT START DATE</div>
            <div style={{ fontWeight: 700, color: "var(--gov-primary)", marginTop: "2px" }}>
              {project.officialStartDate}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>EXPECTED COMPLETION DATE</div>
            <div style={{ fontWeight: 700, color: "var(--gov-primary)", marginTop: "2px" }}>
              {project.officialExpectedCompletionDate}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>CURRENT WORK STATUS</div>
            <div style={{ fontWeight: 700, color: "var(--gov-primary)", marginTop: "2px" }}>
              {project.currentWorkStatus}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>CURRENT EXPENDITURE</div>
            <div style={{ fontWeight: 700, color: project.utilizedAmountRs !== null ? "var(--status-success-text)" : "var(--text-muted)", marginTop: "2px" }}>
              {formatCurrency(project.utilizedAmountRs)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>AMOUNT REMAINING</div>
            <div style={{ fontWeight: 700, color: project.remainingAmountRs !== null ? "var(--text-main)" : "var(--text-muted)", marginTop: "2px" }}>
              {formatCurrency(project.remainingAmountRs)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>CURRENT PHYSICAL PROGRESS</div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--gov-accent)", marginTop: "2px" }}>
              {project.physicalProgress}%
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: OFFICIAL SCHEDULE PROVIDED BY AUTHORITY                         */}
      {/* ========================================================================= */}
      <div 
        className="civic-card" 
        style={{ 
          padding: "16px 20px", 
          background: "var(--status-info-bg)", 
          border: "1px solid var(--status-info-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px"
        }}
      >
        <div>
          <div style={{ fontSize: "0.72rem", color: "var(--status-info-text)", fontWeight: 700, textTransform: "uppercase" }}>
            SECTION 2 — OFFICIAL SCHEDULE PROVIDED BY DISTRICT AUTHORITY
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
            Execution Schedule: <strong>{project.officialStartDate}</strong> to <strong>{project.officialExpectedCompletionDate}</strong>
          </div>
          <p style={{ fontSize: "0.76rem", color: "var(--text-body)", margin: "4px 0 0 0" }}>
            Official dates originate directly from the District Authority work assignment schedule.
          </p>
        </div>

        <div style={{ background: "var(--bg-surface)", padding: "10px 16px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-main)", textAlign: "right" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>DAYS REMAINING TO TARGET</div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: daysRemaining !== null && daysRemaining < 30 ? "var(--status-danger-text)" : "var(--gov-primary)", marginTop: "2px" }}>
            {daysRemaining !== null ? (daysRemaining <= 0 ? "Completed" : `${daysRemaining} Days`) : "Not available"}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: INTERACTIVE STAGE MONITORING TIMELINE & EVIDENCE SUBMISSION   */}
      {/* ========================================================================= */}
      <div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>
          SECTION 3 — STAGE MONITORING TIMELINE & EVIDENCE SUBMISSION
        </div>
        <ContractorTimeline
          project={project}
          onSubmitStageEvidence={(stage) => setSelectedStage(stage)}
          onRequestCompletionCertificate={() => setIsCertModalOpen(true)}
        />
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: EVIDENCE SUBMISSION HISTORY AUDIT LOG                         */}
      {/* ========================================================================= */}
      <div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>
          SECTION 4 — EVIDENCE SUBMISSION HISTORY & AUDIT LOG
        </div>
        <SubmissionHistory history={project.submissionRecords || []} />
      </div>

      {/* EVIDENCE UPLOAD MODAL */}
      <EvidenceUploadModal
        isOpen={!!selectedStage}
        onClose={() => setSelectedStage(null)}
        project={project}
        stage={selectedStage}
        onSubmitSuccess={(stageId, payload) => {
          onSubmitStageEvidence(project.id, stageId, payload);
        }}
      />

      {/* WORK COMPLETION CERTIFICATE REQUEST MODAL */}
      <RequestCompletionCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        project={project}
        onRequestSubmitted={(workId, remarks) => {
          if (onRequestCompletionCertificate) {
            onRequestCompletionCertificate(workId, remarks);
          }
        }}
      />
    </div>
  );
};
