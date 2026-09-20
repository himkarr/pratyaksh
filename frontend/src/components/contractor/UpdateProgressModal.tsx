import React, { useState, useRef } from "react";
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  MapPin, 
  FileText, 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Plus, 
  Trash2, 
  ShieldCheck 
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { WorkItem } from "../../data/mpladsData";
import { fileToOptimizedDataUrl } from "../../utils/imageUploadHelper";

export interface ProgressUpdateSubmission {
  workId: string;
  physicalProgress: number;
  expenditureIncurredAmt: number;
  stageName: string;
  notes: string;
  photos: Array<{ name: string; url: string; lat?: number; lng?: number; timestamp: string }>;
  documents: Array<{ name: string; size: string; type: string }>;
  isCompletionReport: boolean;
  timestamp: string;
}

interface UpdateProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  work: WorkItem | null;
  onSubmitted: (update: ProgressUpdateSubmission) => void;
}

export const UpdateProgressModal: React.FC<UpdateProgressModalProps> = ({
  isOpen,
  onClose,
  work,
  onSubmitted
}) => {
  if (!work) return null;

  const [physicalProgress, setPhysicalProgress] = useState<number>(work.physicalProgress || 0);
  const [expenditureAmt, setExpenditureAmt] = useState<number>(work.expenditureAmt || 0);
  const [stageName, setStageName] = useState<string>("Structural Execution Phase");
  const [notes, setNotes] = useState<string>("");
  
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Camera & GPS State
  const [photos, setPhotos] = useState<Array<{ name: string; url: string; lat?: number; lng?: number; timestamp: string }>>([
    {
      name: "Site_Foundation_Geotagged_01.jpg",
      url: "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=800&auto=format&fit=crop&q=60",
      lat: 18.5204,
      lng: 73.8567,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    }
  ]);
  
  const [documents, setDocuments] = useState<Array<{ name: string; size: string; type: string }>>([
    { name: "Measurement_Book_Stage2_Sign.pdf", size: "2.4 MB", type: "Measurement Book (MB)" }
  ]);

  const [isCompletionReport, setIsCompletionReport] = useState<boolean>(false);
  const [isCapturingGps, setIsCapturingGps] = useState<boolean>(false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(!navigator.onLine);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleCustomPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const filesArr = Array.from(e.target.files);

    for (const file of filesArr) {
      try {
        const dataUrl = await fileToOptimizedDataUrl(file);
        setPhotos((prev) => [
          ...prev,
          {
            name: file.name,
            url: dataUrl,
            lat: 18.5204 + (Math.random() - 0.5) * 0.01,
            lng: 73.8567 + (Math.random() - 0.5) * 0.01,
            timestamp: new Date().toLocaleString("en-IN")
          }
        ]);
      } catch (err) {
        console.warn("Photo upload error:", err);
      }
    }

    if (e.target) e.target.value = "";
  };

  const handleAddSamplePhoto = () => {
    setIsCapturingGps(true);
    setTimeout(() => {
      const newPhoto = {
        name: `Progress_Photo_Stage_${photos.length + 1}.jpg`,
        url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=60",
        lat: 18.5204 + (Math.random() - 0.5) * 0.01,
        lng: 73.8567 + (Math.random() - 0.5) * 0.01,
        timestamp: new Date().toLocaleString("en-IN")
      };
      setPhotos((prev) => [...prev, newPhoto]);
      setIsCapturingGps(false);
    }, 400);
  };

  const handleAddDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocuments([
        ...documents,
        {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type: "Official Voucher / Invoice"
        }
      ]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (photos.length === 0) {
      setErrorMessage("At least 1 geo-tagged photograph is required for milestone verification.");
      return;
    }

    setIsSubmitting(true);

    const updatePayload: ProgressUpdateSubmission = {
      workId: work.id,
      physicalProgress,
      expenditureIncurredAmt: expenditureAmt,
      stageName,
      notes,
      photos,
      documents,
      isCompletionReport,
      timestamp: new Date().toLocaleString("en-IN")
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSubmitted(updatePayload);
        setIsSuccess(false);
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Project Progress & Submit Evidence — ${work.id}`}
      maxWidth="760px"
    >
      {isSuccess ? (
        <div style={{ padding: "36px 20px", textAlign: "center" }}>
          <CheckCircle2 size={52} color="var(--status-success-text)" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "6px" }}>
            Progress Milestone Update Submitted Successfully
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-body)", maxWidth: "480px", margin: "0 auto" }}>
            The physical progress update ({physicalProgress}%) and geotagged evidence have been routed to the Senior Field Inspection Officer & District Collectorate for technical scrutiny.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Work Summary Header Banner */}
          <div 
            style={{ 
              background: "var(--bg-surface-subtle)", 
              padding: "12px 14px", 
              borderRadius: "var(--radius-sm)", 
              border: "1px solid var(--border-light)" 
            }}
          >
            <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--gov-primary)" }}>
              {work.title}
            </div>
            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
              District: <strong>{work.district}, {work.state}</strong> | Sanctioned Outlay: <strong>₹{work.sanctionedAmt.toFixed(2)} Cr</strong> | Target: <strong>{work.targetCompletion}</strong>
            </div>
          </div>

          {/* Network Connection Banner */}
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              padding: "8px 12px", 
              background: isOfflineMode ? "var(--status-warning-bg)" : "var(--status-info-bg)", 
              border: `1px solid ${isOfflineMode ? "var(--status-warning-border)" : "var(--status-info-border)"}`,
              borderRadius: "var(--radius-xs)",
              fontSize: "0.76rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
              {isOfflineMode ? (
                <>
                  <WifiOff size={14} color="var(--status-warning-text)" />
                  <span style={{ color: "var(--status-warning-text)" }}>OFFLINE DRAFT MODE — Update will queue locally and upload when reconnected</span>
                </>
              ) : (
                <>
                  <Wifi size={14} color="var(--status-info-text)" />
                  <span style={{ color: "var(--status-info-text)" }}>ONLINE PWA GATEWAY — Instant Sync Enabled</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              style={{ background: "none", border: "none", color: "var(--gov-accent)", fontSize: "0.72rem", cursor: "pointer", textDecoration: "underline" }}
            >
              Simulate {isOfflineMode ? "Online" : "Offline"}
            </button>
          </div>

          {errorMessage && (
            <div style={{ padding: "10px 12px", background: "var(--status-danger-bg)", border: "1px solid var(--status-danger-border)", color: "var(--status-danger-text)", borderRadius: "var(--radius-xs)", fontSize: "0.78rem" }}>
              {errorMessage}
            </div>
          )}

          {/* Progress Controls */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px" }}>
                Physical Progress Completed (%): <span style={{ color: "var(--gov-primary)" }}>{physicalProgress}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5" 
                value={physicalProgress} 
                onChange={(e) => setPhysicalProgress(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--gov-accent)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                <span>0% (Commenced)</span>
                <span>50% (Midway)</span>
                <span>100% (Fully Complete)</span>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px" }}>
                Cumulative Expenditure Incurred (₹ Cr)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={work.sanctionedAmt * 1.5}
                className="gov-input"
                style={{ width: "100%" }}
                value={expenditureAmt}
                onChange={(e) => setExpenditureAmt(Number(e.target.value))}
                required
              />
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Sanction Ceiling: ₹{work.sanctionedAmt.toFixed(2)} Cr
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px" }}>
              Current Execution Phase / Milestone Stage
            </label>
            <select
              className="gov-select"
              style={{ width: "100%" }}
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
            >
              <option value="Site Preparation & Layout">Site Preparation & Layout</option>
              <option value="Foundation & Plinth Excavation">Foundation & Plinth Excavation</option>
              <option value="Structural Superstructure Execution">Structural Superstructure Execution</option>
              <option value="Electrical & Plumbing Fitting">Electrical & Plumbing Fitting</option>
              <option value="Finishing, Painting & Road Surface">Finishing, Painting & Road Surface</option>
              <option value="Final Quality Handover Verification">Final Quality Handover Verification</option>
            </select>
          </div>

          {/* Photo Upload Section with Camera Capture */}
          <div style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", padding: "12px 14px", background: "var(--text-white)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--gov-primary)" }}>
                  Mandatory Geotagged Progress Photographs ({photos.length})
                </span>
                <div style={{ fontSize: "0.70rem", color: "var(--text-muted)" }}>
                  GPS metadata and timestamp are automatically embedded for audit compliance.
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={photoInputRef}
                  onChange={handleCustomPhotoSelect}
                  style={{ display: "none" }}
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  icon={<Upload size={13} />}
                >
                  Upload Photo
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddSamplePhoto}
                  disabled={isCapturingGps}
                  icon={isCapturingGps ? <RefreshCw size={13} className="spin" /> : <Camera size={13} />}
                >
                  {isCapturingGps ? "Acquiring..." : "Sample"}
                </Button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", marginTop: "10px" }}>
              {photos.map((p, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    border: "1px solid var(--border-main)", 
                    borderRadius: "var(--radius-xs)", 
                    overflow: "hidden", 
                    position: "relative",
                    background: "var(--bg-surface-subtle)"
                  }}
                >
                  <img src={p.url} alt={p.name} style={{ width: "100%", height: "90px", objectFit: "cover" }} />
                  <div style={{ padding: "6px 8px", fontSize: "0.68rem" }}>
                    <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      <MapPin size={10} color="var(--gov-accent)" />
                      <span>{p.lat?.toFixed(4)}, {p.lng?.toFixed(4)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "rgba(220, 38, 38, 0.9)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Document Attachments */}
          <div style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", padding: "12px 14px", background: "var(--text-white)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--gov-primary)" }}>
                  Supporting Vouchers & Measurement Books (MB)
                </span>
                <div style={{ fontSize: "0.70rem", color: "var(--text-muted)" }}>
                  Upload signed MB extracts, test laboratory reports, or material invoices.
                </div>
              </div>

              <label 
                style={{ 
                  cursor: "pointer", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "4px", 
                  padding: "4px 10px", 
                  background: "var(--gov-subtle)", 
                  border: "1px solid var(--border-main)", 
                  borderRadius: "var(--radius-xs)",
                  fontSize: "0.76rem",
                  fontWeight: 600
                }}
              >
                <Upload size={13} />
                <span>Upload PDF</span>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleAddDocument} style={{ display: "none" }} />
              </label>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {documents.map((d, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", fontSize: "0.74rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText size={14} color="var(--gov-primary)" />
                    <span style={{ fontWeight: 600 }}>{d.name}</span>
                    <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.62rem" }}>{d.type}</span>
                    <span style={{ color: "var(--text-muted)" }}>({d.size})</span>
                  </div>
                  <button type="button" onClick={() => handleRemoveDocument(idx)} style={{ background: "none", border: "none", color: "var(--status-danger-text)", cursor: "pointer" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Remarks & Completion Checkbox */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px" }}>
              Contractor Work Notes & Technical Remarks
            </label>
            <textarea
              className="gov-input"
              rows={2}
              style={{ width: "100%", fontSize: "0.80rem" }}
              placeholder="Describe work completed during this cycle, quality tests performed, or material supply status..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "var(--status-info-bg)", border: "1px solid var(--status-info-border)", borderRadius: "var(--radius-xs)" }}>
            <input 
              type="checkbox" 
              id="completionCheck" 
              checked={isCompletionReport || physicalProgress === 100}
              onChange={(e) => {
                setIsCompletionReport(e.target.checked);
                if (e.target.checked) setPhysicalProgress(100);
              }}
              style={{ accentColor: "var(--gov-primary)", width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label htmlFor="completionCheck" style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--status-info-text)", cursor: "pointer" }}>
              Mark Project as 100% Complete & Submit Statutory Completion Certificate
            </label>
          </div>

          {/* Action Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isSubmitting}
              icon={isSubmitting ? <RefreshCw size={14} className="spin" /> : <ShieldCheck size={14} />}
            >
              {isSubmitting ? "Submitting Milestone..." : isOfflineMode ? "Save to Offline Queue" : "Submit Progress Update"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
