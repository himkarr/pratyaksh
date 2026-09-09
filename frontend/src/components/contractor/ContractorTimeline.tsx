import React, { useState } from "react";
import { Clock, CheckCircle2, AlertCircle, ArrowDown, Upload, FileText, MapPin, ShieldCheck, Award, FileCheck, Lock, X } from "lucide-react";
import { ContractorProject, MonitoringScheduleItem } from "../../data/contractorData";
import { calculateMonitoringSchedule } from "../../utils/aiTimelineGenerator";
import { Button } from "../ui/Button";

interface ContractorTimelineProps {
  project: ContractorProject;
  onSubmitStageEvidence?: (stage: MonitoringScheduleItem) => void;
  onRequestCompletionCertificate?: (project: ContractorProject) => void;
}

export const ContractorTimeline: React.FC<ContractorTimelineProps> = ({ 
  project,
  onSubmitStageEvidence,
  onRequestCompletionCertificate
}) => {
  const [selectedModalImage, setSelectedModalImage] = useState<{ url: string; title: string } | null>(null);

  const scheduleData = project.schedule && project.schedule.length > 0 
    ? project.schedule 
    : calculateMonitoringSchedule({
        workId: project.id,
        officialStartDate: project.officialStartDate,
        officialExpectedCompletionDate: project.officialExpectedCompletionDate,
        category: project.category
      }).stages;

  const formatRs = (amtRs: number) => {
    if (amtRs >= 10000000) return `₹${(amtRs / 10000000).toFixed(2)} Cr`;
    return `₹${(amtRs / 100000).toFixed(2)} Lakh`;
  };

  // Determine if the last stage has been submitted or completed
  const lastStage = scheduleData.length > 0 ? scheduleData[scheduleData.length - 1] : null;
  const isLastStageSubmitted = lastStage ? (
    lastStage.status === "COMPLETED" || 
    lastStage.submissionStatus === "Submitted" || 
    lastStage.submissionStatus === "Verified" || 
    !!lastStage.submissionRecord ||
    project.physicalProgress >= 100 ||
    project.currentWorkStatus === "Completed"
  ) : false;

  const isCertRequested = project.completionCertificateStatus === "Requested" || 
                          project.completionCertificateStatus === "Under Scrutiny";
  const isCertApprovedOrIssued = project.completionCertificateStatus === "Approved" || 
                                 project.completionCertificateStatus === "Issued";

  return (
    <div className="gov-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header & Notice */}
      <div style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
              Interactive Project Stage Monitoring Timeline ({scheduleData.length} Stages)
            </h3>
            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Work Duration Schedule: <strong>{project.officialStartDate}</strong> to <strong>{project.officialExpectedCompletionDate}</strong>
            </div>
          </div>
          <span className="gov-badge gov-badge-info">
            STAGE-PERIOD MONITORING
          </span>
        </div>

        <div
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            background: "var(--status-info-bg)",
            border: "1px solid var(--status-info-border)",
            borderRadius: "var(--radius-xs)",
            fontSize: "0.74rem",
            color: "var(--status-info-text)",
            lineHeight: 1.4
          }}
        >
          <strong>Notice:</strong> Submit geo-tagged photographs, invoices, physical progress %, and expenditure for each specific stage during or at the end of its designated time window.
        </div>
      </div>

      {/* Visual Interactive Stage Flow */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {scheduleData.map((stage, idx) => {
          const isCompleted = stage.status === "COMPLETED";
          const isCurrent = stage.status === "IN_PROGRESS";
          const rec = stage.submissionRecord;

          return (
            <div key={stage.stageId || idx} style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  padding: "16px",
                  borderRadius: "var(--radius-xs)",
                  border: isCurrent
                    ? "1px solid var(--gov-primary)"
                    : "1px solid var(--border-light)",
                  background: isCurrent
                    ? "var(--status-info-bg)"
                    : isCompleted
                      ? "var(--bg-surface-subtle)"
                      : "var(--bg-surface)"
                }}
              >
                {/* Stage Index Icon */}
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: isCompleted
                      ? "#10b981"
                      : isCurrent
                        ? "#3b82f6"
                        : "#94a3b8",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    flexShrink: 0
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={19} /> : idx + 1}
                </div>

                {/* Stage Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
                        {stage.stageName}
                      </h4>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        Designated Period: <strong style={{ color: "var(--text-main)" }}>{stage.scheduledStartDate} – {stage.scheduledEndDate}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--gov-primary)", background: "#e0f2fe", padding: "3px 10px", borderRadius: "4px" }}>
                        Target: {stage.targetProgressPercent}%
                      </span>
                      <span className={`gov-badge ${isCompleted ? "gov-badge-success" : isCurrent ? "gov-badge-info" : "gov-badge-warning"}`}>
                        {stage.status}
                      </span>
                    </div>
                  </div>

                  {/* Required Evidence Items Checklist */}
                  <div style={{ marginTop: "10px", fontSize: "0.76rem" }}>
                    <div style={{ fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                      Required Verification Evidence:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {stage.requiredEvidenceTypes.map((ev, i) => (
                        <span
                          key={i}
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-main)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            color: "var(--text-body)"
                          }}
                        >
                          • {ev}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Inline Submitted Evidence Card if present */}
                  {rec && (
                    <div
                      style={{
                        marginTop: "12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--status-success-border)",
                        borderRadius: "4px",
                        padding: "10px 12px",
                        fontSize: "0.76rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                        <div style={{ fontWeight: 700, color: "var(--status-success-text)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <CheckCircle2 size={14} />
                          <span>Submitted Stage Evidence ({rec.uploadTimestamp})</span>
                        </div>
                        <span className={`gov-badge ${rec.verificationStatus === "Verified" ? "gov-badge-success" : "gov-badge-warning"}`}>
                          {rec.verificationStatus.toUpperCase()}
                        </span>
                      </div>

                      <div style={{ color: "var(--text-body)", marginTop: "4px" }}>
                        Reported Physical Progress: <strong>{rec.physicalProgressPercent}%</strong> | Expenditure: <strong>{formatRs(rec.expenditureAmountRs)}</strong>
                      </div>

                      {/* Photo & Document Thumbnails Gallery */}
                      {rec.files && rec.files.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--gov-primary)", marginBottom: "6px" }}>
                            Uploaded Evidence Assets ({rec.files.length}):
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px" }}>
                            {rec.files.map((f, fIdx) => {
                              const isImg = f.type?.includes("Photo") || f.type?.includes("image") || (f.url && (f.url.startsWith("data:") || f.url.startsWith("http"))) || /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name);
                              return (
                                <div
                                  key={fIdx}
                                  style={{
                                    border: "1px solid var(--border-main)",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                    background: "var(--bg-surface)",
                                    display: "flex",
                                    flexDirection: "column"
                                  }}
                                >
                                  {isImg && f.url && f.url !== "#" ? (
                                    <div
                                      style={{ height: "85px", overflow: "hidden", position: "relative", background: "#f1f5f9", cursor: "pointer" }}
                                      onClick={() => setSelectedModalImage({ url: f.url, title: f.name })}
                                    >
                                      <img
                                        src={f.url}
                                        alt={f.name}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      />
                                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: "0.60rem", padding: "2px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        📷 {f.name}
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ padding: "6px", fontSize: "0.70rem", color: "var(--text-body)", display: "flex", alignItems: "center", gap: "4px" }}>
                                      📄 <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {rec.locationText && (
                        <div style={{ color: "var(--status-info-text)", marginTop: "6px", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "4px" }}>
                          <MapPin size={12} color="#1d4ed8" />
                          <span>📍 <strong>Location Tagged:</strong> {rec.locationText}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Stage Evidence Button */}
                  {onSubmitStageEvidence && (
                    <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        variant={isCompleted ? "secondary" : "primary"}
                        size="sm"
                        onClick={() => onSubmitStageEvidence(stage)}
                        icon={<Upload size={13} />}
                      >
                        {isCompleted ? "Update / Submit Additional Evidence" : `Submit Evidence for Stage ${idx + 1}`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Connecting Down Arrow */}
              <div style={{ display: "flex", justifyContent: "flex-start", paddingLeft: "24px", margin: "3px 0" }}>
                <ArrowDown size={18} color="var(--border-dark)" />
              </div>
            </div>
          );
        })}

        {/* ========================================================================= */}
        {/* FINAL MILESTONE: REQUEST OFFICIAL WORK COMPLETION CERTIFICATE            */}
        {/* ========================================================================= */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            padding: "18px",
            borderRadius: "var(--radius-xs)",
            border: isCertApprovedOrIssued
              ? "1.5px solid #10b981"
              : isCertRequested
                ? "1.5px solid #3b82f6"
                : isLastStageSubmitted
                  ? "1.5px solid #059669"
                  : "1px solid var(--border-light)",
            background: isCertApprovedOrIssued
              ? "rgba(16, 185, 129, 0.08)"
              : isCertRequested
                ? "rgba(59, 130, 246, 0.08)"
                : isLastStageSubmitted
                  ? "rgba(5, 150, 105, 0.06)"
                  : "var(--bg-surface-subtle)"
          }}
        >
          {/* Milestone Icon */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: isCertApprovedOrIssued
                ? "#10b981"
                : isCertRequested
                  ? "#3b82f6"
                  : isLastStageSubmitted
                    ? "#059669"
                    : "#94a3b8",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            {isCertApprovedOrIssued || isCertRequested ? <Award size={20} /> : <FileCheck size={20} />}
          </div>

          {/* Milestone Content & Action Button */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <h4 style={{ fontSize: "1.0rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
                    Final Milestone: Work Completion Certificate
                  </h4>
                  {isCertRequested && (
                    <span className="gov-badge gov-badge-info" style={{ fontSize: "0.68rem" }}>
                      REQUEST SUBMITTED
                    </span>
                  )}
                  {isCertApprovedOrIssued && (
                    <span className="gov-badge gov-badge-success" style={{ fontSize: "0.68rem" }}>
                      ISSUED BY DISTRICT AUTHORITY
                    </span>
                  )}
                  {isLastStageSubmitted && !isCertRequested && !isCertApprovedOrIssued && (
                    <span className="gov-badge gov-badge-success" style={{ fontSize: "0.68rem" }}>
                      READY FOR REQUEST
                    </span>
                  )}
                </div>

                <p style={{ fontSize: "0.78rem", color: "var(--text-body)", margin: "6px 0 0 0", lineHeight: 1.45 }}>
                  {isCertApprovedOrIssued
                    ? `Official Completion Certificate has been verified and issued by the District Magistrate & Collector.`
                    : isCertRequested
                      ? `Completion Certificate request recorded on ${project.completionCertificateRequestedDate || "recent date"}. Under verification by District Collectorate.`
                      : isLastStageSubmitted
                        ? `All ${scheduleData.length} monitoring stages completed and final stage evidence submitted! You are eligible to request the official Work Completion Certificate.`
                        : `Complete and submit stage evidence for the final stage (${lastStage?.stageName || `Stage ${scheduleData.length}`}) to enable the Completion Certificate request button.`
                  }
                </p>
              </div>

              {/* Action Button */}
              <div style={{ marginTop: "4px" }}>
                {isCertRequested || isCertApprovedOrIssued ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRequestCompletionCertificate?.(project)}
                    icon={<Award size={14} />}
                    style={{
                      borderColor: isCertApprovedOrIssued ? "#10b981" : "#3b82f6",
                      color: isCertApprovedOrIssued ? "#047857" : "#1d4ed8",
                      fontWeight: 700,
                      background: "#ffffff"
                    }}
                  >
                    {isCertApprovedOrIssued ? "View Issued Certificate" : "View Certificate Request Details"}
                  </Button>
                ) : (
                  <Button
                    variant={isLastStageSubmitted ? "primary" : "secondary"}
                    size="sm"
                    disabled={!isLastStageSubmitted}
                    onClick={() => isLastStageSubmitted && onRequestCompletionCertificate?.(project)}
                    icon={isLastStageSubmitted ? <Award size={14} /> : <Lock size={14} />}
                    style={{
                      background: isLastStageSubmitted ? "linear-gradient(135deg, #059669 0%, #10b981 100%)" : undefined,
                      borderColor: isLastStageSubmitted ? "#059669" : undefined,
                      color: isLastStageSubmitted ? "#ffffff" : undefined,
                      fontWeight: 700,
                      boxShadow: isLastStageSubmitted ? "0 4px 12px rgba(16, 185, 129, 0.25)" : undefined
                    }}
                  >
                    {isLastStageSubmitted ? "Request Completion Certificate" : "Request Completion Certificate (Locked)"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {selectedModalImage && (
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
          onClick={() => setSelectedModalImage(null)}
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
                📷 {selectedModalImage.title}
              </h4>
              <button
                onClick={() => setSelectedModalImage(null)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <img
              src={selectedModalImage.url}
              alt={selectedModalImage.title}
              style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: "8px", border: "1px solid var(--border-main)" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
