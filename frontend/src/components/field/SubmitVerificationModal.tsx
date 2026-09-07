import React, { useState } from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  MapPin, 
  ShieldAlert, 
  FileText, 
  Layers, 
  RefreshCw, 
  Upload, 
  Trash2, 
  Info, 
  Search, 
  UserCheck 
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { WorkItem } from "../../data/mpladsData";

export interface VerificationReportSubmission {
  workId: string;
  verificationStatus: "VERIFIED" | "FLAGGED" | "REQUIRES_MORE_EVIDENCE";
  verificationOutcome: string;
  verifiedBy: string;
  verificationDate: string;
  verificationNotes: string;
  verifiedPhysicalProgress: number;
  evidenceAvailable: boolean;
  issueType?: string;
  fieldPhotos: Array<{ url: string; lat?: number; lng?: number; timestamp: string }>;
}

interface SubmitVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  work: WorkItem | null;
  officerName: string;
  onSubmitted: (report: VerificationReportSubmission) => void;
}

export const SubmitVerificationModal: React.FC<SubmitVerificationModalProps> = ({
  isOpen,
  onClose,
  work,
  officerName,
  onSubmitted
}) => {
  if (!work) return null;

  const [activeStep, setActiveStep] = useState<number>(1);
  const [outcome, setOutcome] = useState<"VERIFIED" | "FLAGGED" | "REQUIRES_MORE_EVIDENCE">("VERIFIED");
  const [verifiedProgress, setVerifiedProgress] = useState<number>(work.physicalProgress || 50);
  const [notes, setNotes] = useState<string>("");
  const [issueType, setIssueType] = useState<string>("Cost Overrun Risk");
  
  // Field Photos with GPS
  const [fieldPhotos, setFieldPhotos] = useState<Array<{ url: string; lat?: number; lng?: number; timestamp: string }>>([
    {
      url: "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=800&auto=format&fit=crop&q=60",
      lat: 18.5204,
      lng: 73.8567,
      timestamp: new Date().toLocaleString("en-IN")
    }
  ]);
  
  const [isCapturingGps, setIsCapturingGps] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleCapturePhoto = () => {
    setIsCapturingGps(true);
    setTimeout(() => {
      setFieldPhotos([
        ...fieldPhotos,
        {
          url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=60",
          lat: 18.5204 + (Math.random() - 0.5) * 0.01,
          lng: 73.8567 + (Math.random() - 0.5) * 0.01,
          timestamp: new Date().toLocaleString("en-IN")
        }
      ]);
      setIsCapturingGps(false);
    }, 700);
  };

  const handleRemovePhoto = (index: number) => {
    setFieldPhotos(fieldPhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!notes.trim()) {
      setErrorMessage("Please enter detailed field inspection notes before submitting report.");
      return;
    }

    if (fieldPhotos.length === 0) {
      setErrorMessage("At least 1 geo-tagged field photograph is mandatory for verification audit.");
      return;
    }

    setIsSubmitting(true);

    const report: VerificationReportSubmission = {
      workId: work.id,
      verificationStatus: outcome,
      verificationOutcome: outcome === "VERIFIED" ? "Work Physically Verified on Site" : outcome === "FLAGGED" ? `Flagged: ${issueType}` : "Additional Evidence Required",
      verifiedBy: officerName,
      verificationDate: new Date().toISOString().split("T")[0],
      verificationNotes: notes,
      verifiedPhysicalProgress: verifiedProgress,
      evidenceAvailable: true,
      issueType: outcome === "FLAGGED" ? issueType : undefined,
      fieldPhotos
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSubmitted(report);
        setIsSuccess(false);
        setActiveStep(1);
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Field Inspection Dossier & Verification Report — ${work.id}`}
      maxWidth="800px"
    >
      {isSuccess ? (
        <div style={{ padding: "36px 20px", textAlign: "center" }}>
          <CheckCircle2 size={52} color="var(--status-success-text)" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "6px" }}>
            Field Verification Report Submitted to District Authority
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-body)", maxWidth: "480px", margin: "0 auto" }}>
            Outcome ({outcome}) and geotagged field observations recorded by {officerName}. Logged into append-only audit trail.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Workflow Step Bar */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px", gap: "8px", overflowX: "auto" }}>
            {[
              { id: 1, label: "1. Project Info" },
              { id: 2, label: "2. AI & Rule Signals" },
              { id: 3, label: "3. Contractor Evidence" },
              { id: 4, label: "4. Field Verification & Photos" }
            ].map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-xs)",
                  fontSize: "0.76rem",
                  fontWeight: activeStep === step.id ? 800 : 500,
                  background: activeStep === step.id ? "var(--gov-primary)" : "var(--bg-surface-subtle)",
                  color: activeStep === step.id ? "var(--text-white)" : "var(--text-body)",
                  border: "1px solid var(--border-main)",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {step.label}
              </button>
            ))}
          </div>

          {/* STEP 1: PROJECT INFO */}
          {activeStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "12px 14px", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Work Identification
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--gov-primary)", margin: "2px 0 4px 0" }}>
                  {work.title}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-body)" }}>
                  Category: <strong>{work.category}</strong> | Constituency: <strong>{work.constituency} ({work.constituency_code})</strong> | MP: <strong>{work.mpName}</strong>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="gov-card" style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Sanctioned Financial Outlay</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>₹{work.sanctionedAmt.toFixed(2)} Cr</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>Disbursed Expenditure: ₹{work.expenditureAmt.toFixed(2)} Cr ({work.financialProgress}%)</div>
                </div>

                <div className="gov-card" style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Reported Physical Progress</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--status-info-text)", marginTop: "2px" }}>{work.physicalProgress}%</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>Target Date: {work.targetCompletion}</div>
                </div>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-body)", padding: "10px 12px", background: "var(--text-white)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)" }}>
                Implementing Agency / Contractor: <strong>{work.agency || "Maharashtra State PWD Infrastructure Agency"}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="primary" size="sm" onClick={() => setActiveStep(2)}>
                  Next: Review AI & Rule Signals $\rightarrow$
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: AI & RULE FINDINGS */}
          {activeStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Mandatory AI Risk Semantics Banner */}
              <Alert type="info" title="Statutory Verification Notice">
                <strong>IMPORTANT:</strong> Risk level indicates <strong>verification priority</strong> for field inspection, NOT proof of fraud or non-compliance.
              </Alert>

              <div className="gov-card" style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div>
                    <span className={`gov-badge ${work.status === "Delayed" || work.financialProgress > work.physicalProgress + 15 ? "gov-badge-danger" : "gov-badge-info"}`}>
                      {work.status === "Delayed" ? "HIGH RISK (PRIORITY 1)" : "MEDIUM RISK (PRIORITY 2)"}
                    </span>
                    <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginLeft: "8px" }}>
                      AI Signal Model & Rule Pipeline Output
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ padding: "8px 10px", background: "var(--bg-surface-subtle)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>ML Isolation Forest Score</div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>0.784 (Anomaly)</div>
                  </div>

                  <div style={{ padding: "8px 10px", background: "var(--bg-surface-subtle)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Triggered Rule Failures</div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--status-danger-text)", marginTop: "2px" }}>2 Rules Flagged</div>
                  </div>

                  <div style={{ padding: "8px 10px", background: "var(--bg-surface-subtle)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Deadline Risk Forecast</div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--status-warning-text)", marginTop: "2px" }}>+45 Days Delay</div>
                  </div>
                </div>

                <div style={{ fontSize: "0.78rem", background: "var(--status-warning-bg)", border: "1px solid var(--status-warning-border)", padding: "10px 12px", borderRadius: "var(--radius-xs)", color: "var(--status-warning-text)" }}>
                  <strong>Triggered Rule Reasons:</strong>
                  <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                    <li>Financial outlay expenditure rate exceeds physical execution by {work.financialProgress - work.physicalProgress}%</li>
                    <li>Geotagged milestone photo submission frequency lower than MoSPI threshold</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Button variant="secondary" size="sm" onClick={() => setActiveStep(1)}>
                  $\leftarrow$ Back to Info
                </Button>
                <Button variant="primary" size="sm" onClick={() => setActiveStep(3)}>
                  Next: Inspect Contractor Evidence $\rightarrow$
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: CONTRACTOR EVIDENCE */}
          {activeStep === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="gov-card" style={{ padding: "14px 16px" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "8px" }}>
                  Contractor Milestone Photo Submissions
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                  <div style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", overflow: "hidden" }}>
                    <img src="https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=800&auto=format&fit=crop&q=60" alt="Site Photo" style={{ width: "100%", height: "110px", objectFit: "cover" }} />
                    <div style={{ padding: "6px 8px", fontSize: "0.70rem" }}>
                      <div style={{ fontWeight: 700 }}>Foundation_Stage_01.jpg</div>
                      <div style={{ color: "var(--text-muted)" }}>Submitted by Agency: 12 May 2024</div>
                    </div>
                  </div>

                  <div style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", overflow: "hidden" }}>
                    <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=60" alt="Site Photo" style={{ width: "100%", height: "110px", objectFit: "cover" }} />
                    <div style={{ padding: "6px 8px", fontSize: "0.70rem" }}>
                      <div style={{ fontWeight: 700 }}>Superstructure_Stage_02.jpg</div>
                      <div style={{ color: "var(--text-muted)" }}>Submitted by Agency: 28 May 2024</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Button variant="secondary" size="sm" onClick={() => setActiveStep(2)}>
                  $\leftarrow$ Back to AI Signals
                </Button>
                <Button variant="primary" size="sm" onClick={() => setActiveStep(4)}>
                  Next: Record Field Observations & Photos $\rightarrow$
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: FIELD VERIFICATION FORM */}
          {activeStep === 4 && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {errorMessage && (
                <div style={{ padding: "10px 12px", background: "var(--status-danger-bg)", border: "1px solid var(--status-danger-border)", color: "var(--status-danger-text)", borderRadius: "var(--radius-xs)", fontSize: "0.78rem" }}>
                  {errorMessage}
                </div>
              )}

              {/* Verification Outcome Selector */}
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px" }}>
                  Official Field Inspection Outcome Determination
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setOutcome("VERIFIED")}
                    style={{
                      padding: "10px",
                      borderRadius: "var(--radius-xs)",
                      border: `2px solid ${outcome === "VERIFIED" ? "var(--status-success-text)" : "var(--border-main)"}`,
                      background: outcome === "VERIFIED" ? "var(--status-success-bg)" : "var(--bg-surface)",
                      color: outcome === "VERIFIED" ? "var(--status-success-text)" : "var(--text-main)",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      cursor: "pointer"
                    }}
                  >
                    VERIFIED (Clean)
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutcome("FLAGGED")}
                    style={{
                      padding: "10px",
                      borderRadius: "var(--radius-xs)",
                      border: `2px solid ${outcome === "FLAGGED" ? "var(--status-danger-text)" : "var(--border-main)"}`,
                      background: outcome === "FLAGGED" ? "var(--status-danger-bg)" : "var(--bg-surface)",
                      color: outcome === "FLAGGED" ? "var(--status-danger-text)" : "var(--text-main)",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      cursor: "pointer"
                    }}
                  >
                    FLAGGED (Issue Found)
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutcome("REQUIRES_MORE_EVIDENCE")}
                    style={{
                      padding: "10px",
                      borderRadius: "var(--radius-xs)",
                      border: `2px solid ${outcome === "REQUIRES_MORE_EVIDENCE" ? "var(--status-warning-text)" : "var(--border-main)"}`,
                      background: outcome === "REQUIRES_MORE_EVIDENCE" ? "var(--status-warning-bg)" : "var(--bg-surface)",
                      color: outcome === "REQUIRES_MORE_EVIDENCE" ? "var(--status-warning-text)" : "var(--text-main)",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                      cursor: "pointer"
                    }}
                  >
                    MORE EVIDENCE REQ.
                  </button>
                </div>
              </div>

              {outcome === "FLAGGED" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px" }}>
                    Select Flagged Issue Category
                  </label>
                  <select
                    className="gov-select"
                    style={{ width: "100%" }}
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                  >
                    <option value="Cost Overrun Risk">Cost Overrun / Mismatched Outlay</option>
                    <option value="Severe Physical Delay">Severe Physical Delay vs Milestone</option>
                    <option value="Quality Standard Non-Compliance">Quality Standard Non-Compliance</option>
                    <option value="Work Location Discrepancy">Work Location Discrepancy</option>
                    <option value="Duplicate Project Risk">Duplicate Project Risk</option>
                  </select>
                </div>
              )}

              {/* Physically Verified Progress */}
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px" }}>
                  Officer Physically Verified Progress (%): <span style={{ color: "var(--gov-primary)" }}>{verifiedProgress}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5" 
                  value={verifiedProgress} 
                  onChange={(e) => setVerifiedProgress(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--gov-accent)", cursor: "pointer" }}
                />
                <div style={{ fontSize: "0.70rem", color: "var(--text-muted)" }}>
                  Contractor Reported Progress: <strong>{work.physicalProgress}%</strong>
                </div>
              </div>

              {/* Field Camera Photo Capture */}
              <div style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", padding: "12px 14px", background: "var(--text-white)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--gov-primary)" }}>
                      Geotagged Inspection Photographs ({fieldPhotos.length})
                    </span>
                    <div style={{ fontSize: "0.70rem", color: "var(--text-muted)" }}>
                      Mandatory photo evidence captured on-site by field officer.
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCapturePhoto}
                    disabled={isCapturingGps}
                    icon={isCapturingGps ? <RefreshCw size={13} className="spin" /> : <Camera size={13} />}
                  >
                    {isCapturingGps ? "Acquiring GPS..." : "Capture On-Site Photo"}
                  </Button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
                  {fieldPhotos.map((p, idx) => (
                    <div key={idx} style={{ border: "1px solid var(--border-main)", borderRadius: "var(--radius-xs)", overflow: "hidden", position: "relative" }}>
                      <img src={p.url} alt="Field Photo" style={{ width: "100%", height: "85px", objectFit: "cover" }} />
                      <div style={{ padding: "4px 6px", fontSize: "0.66rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "2px", color: "var(--text-muted)" }}>
                          <MapPin size={10} color="var(--gov-accent)" />
                          <span>{p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(220,38,38,0.9)", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inspection Notes */}
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px" }}>
                  Official Field Inspection Findings & Notes
                </label>
                <textarea
                  className="gov-input"
                  rows={3}
                  style={{ width: "100%", fontSize: "0.80rem" }}
                  placeholder="Record physical inspection observations, material quality verification, labor count, site obstacles, or reasons for flagging..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Button type="button" variant="secondary" onClick={() => setActiveStep(3)}>
                  $\leftarrow$ Back to Evidence
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  icon={isSubmitting ? <RefreshCw size={14} className="spin" /> : <CheckCircle2 size={14} />}
                >
                  {isSubmitting ? "Transmitting Report..." : "Submit Official Verification Report"}
                </Button>
              </div>
            </form>
          )}

        </div>
      )}
    </Modal>
  );
};
