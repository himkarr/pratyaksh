import React from "react";
import { FileText, MapPin, CheckCircle2, Clock, ShieldCheck, Download } from "lucide-react";
import { EvidenceSubmissionRecord } from "../../data/contractorData";

interface SubmissionHistoryProps {
  history: EvidenceSubmissionRecord[];
}

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({ history }) => {
  const formatRs = (amtRs: number) => {
    if (amtRs >= 10000000) return `₹${(amtRs / 10000000).toFixed(2)} Cr`;
    return `₹${(amtRs / 100000).toFixed(2)} Lakh`;
  };

  return (
    <div className="gov-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
            Evidence Submission History & Verification Records
          </h3>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Complete audit trail of uploaded geo-tagged photos, vouchers, progress reports, and verification statuses
          </div>
        </div>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          Total Submissions Logged: <strong>{history.length}</strong>
        </span>
      </div>

      {history.length === 0 ? (
        <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
          No evidence submission records logged for this project yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {history.map((rec) => {
            const isVerified = rec.verificationStatus === "Verified";
            return (
              <div
                key={rec.id}
                style={{
                  border: "1px solid var(--border-main)",
                  borderRadius: "var(--radius-xs)",
                  background: "var(--bg-surface)",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}
              >
                {/* Record Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid var(--border-light)", paddingBottom: "8px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem", color: "var(--gov-primary)" }}>
                        WORK ID: {rec.workId}
                      </span>
                      <span className="gov-badge gov-badge-info">
                        {rec.evidenceType}
                      </span>
                      <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} />
                        Uploaded: <strong>{rec.uploadTimestamp}</strong>
                      </span>
                    </div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-main)", marginTop: "4px" }}>
                      Checkpoint: {rec.checkpointActionName}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      Contractor: <strong>{rec.contractorName}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    <span className={`gov-badge ${isVerified ? "gov-badge-success" : "gov-badge-warning"}`}>
                      VERIFICATION: {rec.verificationStatus.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      Submission: <strong>{rec.submissionStatus}</strong>
                    </span>
                  </div>
                </div>

                {/* Submissions Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", fontSize: "0.78rem" }}>
                  <div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700 }}>REPORTED PHYSICAL PROGRESS</div>
                    <div style={{ fontWeight: 800, color: "var(--gov-accent)", marginTop: "2px" }}>{rec.physicalProgressPercent}%</div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700 }}>EXPENDITURE INCURRED</div>
                    <div style={{ fontWeight: 700, color: "var(--gov-primary)", marginTop: "2px" }}>{formatRs(rec.expenditureAmountRs)}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700 }}>WORK STAGE</div>
                    <div style={{ fontWeight: 600, color: "var(--text-main)", marginTop: "2px" }}>{rec.workStage}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700 }}>MATERIAL STATUS</div>
                    <div style={{ fontWeight: 600, color: "var(--text-body)", marginTop: "2px" }}>{rec.materialStatus}</div>
                  </div>
                </div>

                {/* Geolocation Tag Badge if available */}
                {rec.locationText && (
                  <div style={{ fontSize: "0.74rem", background: "var(--status-info-bg)", border: "1px solid var(--status-info-border)", padding: "4px 10px", borderRadius: "4px", color: "var(--status-info-text)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={13} color="#1d4ed8" />
                    <span><strong>Geo-location Recorded:</strong> {rec.locationText}</span>
                  </div>
                )}

                {/* Description & Remarks */}
                <div style={{ fontSize: "0.76rem", color: "var(--text-body)", background: "var(--bg-surface-subtle)", padding: "8px 10px", borderRadius: "4px" }}>
                  <div><strong>Description / Field Remarks:</strong> {rec.description}</div>
                  {rec.verificationRemarks && (
                    <div style={{ marginTop: "4px", color: "var(--gov-primary)", fontWeight: 600 }}>
                      <strong>Officer Scrutiny Remarks:</strong> {rec.verificationRemarks}
                    </div>
                  )}
                </div>

                {/* Attached Files Grid */}
                {rec.files && rec.files.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                      Attached Files ({rec.files.length}):
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {rec.files.map((file, fIdx) => (
                        <div
                          key={fIdx}
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border-main)",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            fontSize: "0.72rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <span>{file.type.includes("Photo") ? "📷" : "📄"} {file.name}</span>
                          {file.lat && file.lng && (
                            <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
                              ({file.lat.toFixed(2)}, {file.lng.toFixed(2)})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
