import React, { useState } from "react";
import { 
  Award, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  AlertCircle, 
  Building2,
  Calendar,
  IndianRupee,
  FileCheck
} from "lucide-react";
import { ContractorProject } from "../../data/contractorData";
import { Button } from "../ui/Button";

interface RequestCompletionCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ContractorProject | null;
  onRequestSubmitted: (workId: string, remarks: string) => void;
}

export const RequestCompletionCertificateModal: React.FC<RequestCompletionCertificateModalProps> = ({
  isOpen,
  onClose,
  project,
  onRequestSubmitted
}) => {
  if (!isOpen || !project) return null;

  const [certifyCompletion, setCertifyCompletion] = useState(true);
  const [certifyEvidence, setCertifyEvidence] = useState(true);
  const [remarks, setRemarks] = useState(
    "Work has been fully completed strictly per approved technical specifications and drawings. All stage-wise geotagged photographs, inspection logs, and final expenditure bills are attached for District Authority sign-off."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatCurrency = (amtRs: number | null) => {
    if (amtRs === null || amtRs === undefined) return "N/A";
    if (amtRs >= 10000000) return `₹${(amtRs / 10000000).toFixed(2)} Cr`;
    return `₹${(amtRs / 100000).toFixed(2)} Lakh`;
  };

  const isAlreadyRequested = project.completionCertificateStatus === "Requested" || 
                             project.completionCertificateStatus === "Approved" || 
                             project.completionCertificateStatus === "Issued";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certifyCompletion || !certifyEvidence) {
      setErrorMsg("Please accept both certification acknowledgments before submitting your certificate request.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    setTimeout(() => {
      onRequestSubmitted(project.id, remarks.trim());
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 1100,
        padding: "16px",
        overflowY: "auto"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-surface, #ffffff)",
          border: "1px solid var(--border-main, #cbd5e1)",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "650px",
          maxHeight: "calc(100vh - 32px)",
          margin: "auto",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-light, #e2e8f0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, var(--gov-primary, #0a2540) 0%, #1e3a8a 100%)",
            color: "#ffffff",
            borderTopLeftRadius: "11px",
            borderTopRightRadius: "11px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff"
              }}
            >
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#ffffff", fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
                {isAlreadyRequested ? "Work Completion Certificate Status" : "Request Official Completion Certificate"}
              </h3>
              <div style={{ fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.8)", marginTop: "2px" }}>
                District Authority MPLADS Work Sign-off Application
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#ffffff",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Project Summary Banner */}
          <div
            style={{
              background: "var(--bg-surface-subtle, #f8fafc)",
              border: "1px solid var(--border-light, #e2e8f0)",
              borderRadius: "8px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted, #64748b)", fontWeight: 700, textTransform: "uppercase" }}>
              PROJECT DETAILS
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--gov-primary, #0a2540)" }}>
              {project.title}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px", fontSize: "0.78rem", color: "var(--text-body, #334155)", marginTop: "4px" }}>
              <span>Work ID: <strong style={{ fontFamily: "monospace" }}>{project.id}</strong></span>
              <span>District: <strong>{project.district}, {project.state}</strong></span>
              <span>Sanction: <strong>{formatCurrency(project.sanctionAmountRs)}</strong></span>
              <span>Authority: <strong>{project.implementingAuthority}</strong></span>
            </div>
          </div>

          {isAlreadyRequested ? (
            /* Certificate Status View for already requested certificates */
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1.5px solid #10b981",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px"
                }}
              >
                <CheckCircle2 size={24} color="#059669" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#065f46" }}>
                    Completion Certificate Request Submitted
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#047857", marginTop: "4px", lineHeight: 1.45 }}>
                    Your request was recorded on <strong>{project.completionCertificateRequestedDate || "recently"}</strong>. It is currently under scrutiny by the <strong>District Magistrate & Collector, {project.district}</strong>.
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "0.78rem", background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "6px", border: "1px solid var(--border-light)" }}>
                <div style={{ fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>Contractor Application Notes:</div>
                <div style={{ color: "var(--text-main)", fontStyle: "italic" }}>
                  "{project.completionCertificateRemarks || "All physical stages completed & certified geotagged evidence uploaded."}"
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                <Button variant="secondary" onClick={onClose}>
                  Close Window
                </Button>
              </div>
            </div>
          ) : (
            /* New Request Form */
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  padding: "12px 14px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  fontSize: "0.78rem",
                  color: "#1e40af",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px"
                }}
              >
                <ShieldCheck size={20} color="#1d4ed8" style={{ flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <strong>Statutory Notice:</strong> Requesting an official Work Completion Certificate initiates formal technical verification by the District Nodal Officer / Superintending Engineer prior to final payment tranche release and security deposit refund.
                </div>
              </div>

              {errorMsg && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    borderRadius: "6px",
                    fontSize: "0.78rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Statutory Acknowledgments Checklist */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--gov-primary, #0a2540)" }}>
                  Mandatory Declarations & Sign-off Checklist:
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    fontSize: "0.78rem",
                    color: "var(--text-main, #0f172a)",
                    cursor: "pointer",
                    background: "var(--bg-surface)",
                    padding: "10px 12px",
                    border: "1px solid var(--border-light)",
                    borderRadius: "6px"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={certifyCompletion}
                    onChange={(e) => setCertifyCompletion(e.target.checked)}
                    style={{ marginTop: "2px", cursor: "pointer", accentColor: "#059669" }}
                  />
                  <span>
                    I confirm that <strong>100% physical construction and site cleanup</strong> has been completed as per statutory specifications and guidelines.
                  </span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    fontSize: "0.78rem",
                    color: "var(--text-main, #0f172a)",
                    cursor: "pointer",
                    background: "var(--bg-surface)",
                    padding: "10px 12px",
                    border: "1px solid var(--border-light)",
                    borderRadius: "6px"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={certifyEvidence}
                    onChange={(e) => setCertifyEvidence(e.target.checked)}
                    style={{ marginTop: "2px", cursor: "pointer", accentColor: "#059669" }}
                  />
                  <span>
                    I confirm that <strong>all stage geotagged evidence photos, MB records, and expenditure logs</strong> have been duly submitted.
                  </span>
                </label>
              </div>

              {/* Contractor Remarks */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--gov-primary, #0a2540)" }}>
                  Contractor Final Sign-off Remarks & Handover Notes:
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "0.82rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-main, #cbd5e1)",
                    color: "#0f172a",
                    background: "#ffffff",
                    fontFamily: "inherit",
                    outline: "none"
                  }}
                  placeholder="Enter technical summary notes for District Collectorate verification..."
                />
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  borderTop: "1px solid var(--border-light)",
                  paddingTop: "14px"
                }}
              >
                <Button variant="secondary" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting || !certifyCompletion || !certifyEvidence}
                  icon={<Award size={15} />}
                  style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", borderColor: "#059669", fontWeight: 700 }}
                >
                  {isSubmitting ? "Submitting Request..." : "Submit Completion Certificate Request"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
