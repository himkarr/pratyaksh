import React, { useState, useRef } from "react";
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  MapPin, 
  FileText, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  FilePlus, 
  Lock 
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { ContractorProject, MonitoringScheduleItem, SubmittedFileItem } from "../../data/contractorData";
import { SubmitStagePayload } from "../../api/contractorApi";
import { fileToOptimizedDataUrl } from "../../utils/imageUploadHelper";

interface EvidenceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ContractorProject;
  stage: MonitoringScheduleItem | null;
  onSubmitSuccess: (stageId: string, payload: SubmitStagePayload) => void;
}

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  isOpen,
  onClose,
  project,
  stage,
  onSubmitSuccess
}) => {
  if (!isOpen || !stage) return null;

  // Form State
  const [evidenceType, setEvidenceType] = useState<string>("Geo-tagged Work Progress Photo");
  const [physicalProgress, setPhysicalProgress] = useState<number>(stage.targetProgressPercent || project.physicalProgress || 0);
  const [expenditureAmount, setExpenditureAmount] = useState<number>(project.utilizedAmountRs || 0);
  const [workStage, setWorkStage] = useState<string>(stage.stageName);
  const [materialStatus, setMaterialStatus] = useState<string>("Sufficient material stock available on site");
  const [notes, setNotes] = useState<string>("");

  // GPS Geolocation State
  const [latitude, setLatitude] = useState<number | null>(18.5204);
  const [longitude, setLongitude] = useState<number | null>(73.8567);
  const [locationText, setLocationText] = useState<string>(`Haveli Circle, ${project.district} (18.5204° N, 73.8567° E)`);
  const [isAcquiringGps, setIsAcquiringGps] = useState<boolean>(false);
  const [gpsAcquiredTime, setGpsAcquiredTime] = useState<string>(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));

  const photoInputRef = useRef<HTMLInputElement>(null);

  // File Upload Lists
  const [photos, setPhotos] = useState<SubmittedFileItem[]>([
    {
      name: `${stage.stageId}_Progress_Geotag.jpg`,
      url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80",
      size: "2.8 MB",
      type: "Geo-tagged Photo",
      lat: 18.5204,
      lng: 73.8567,
      timestamp: new Date().toLocaleDateString("en-GB") + " 10:30 AM"
    }
  ]);

  const [documents, setDocuments] = useState<SubmittedFileItem[]>([
    {
      name: `${stage.stageId}_Measurement_Voucher.pdf`,
      url: "#",
      size: "1.8 MB",
      type: "Measurement Book (MB) Voucher",
      timestamp: new Date().toLocaleDateString("en-GB") + " 10:35 AM"
    }
  ]);

  const [docTypeInput, setDocTypeInput] = useState<string>("Measurement Book (MB) Voucher");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Acquire Live GPS Geolocation
  const handleAcquireGps = () => {
    setIsAcquiringGps(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lng = parseFloat(pos.coords.longitude.toFixed(4));
          const nowStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
          setLatitude(lat);
          setLongitude(lng);
          setLocationText(`Lat: ${lat}° N, Lng: ${lng}° E (${project.district})`);
          setGpsAcquiredTime(nowStr);
          setIsAcquiringGps(false);
        },
        (err) => {
          console.warn("Geolocation warning fallback:", err);
          const lat = 18.5204 + (Math.random() - 0.5) * 0.01;
          const lng = 73.8567 + (Math.random() - 0.5) * 0.01;
          setLatitude(parseFloat(lat.toFixed(4)));
          setLongitude(parseFloat(lng.toFixed(4)));
          setLocationText(`Pune Circle (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`);
          setGpsAcquiredTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
          setIsAcquiringGps(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsAcquiringGps(false);
    }
  };

  const handleCustomPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const filesArr = Array.from(e.target.files);

    for (const file of filesArr) {
      try {
        const dataUrl = await fileToOptimizedDataUrl(file);
        const newP: SubmittedFileItem = {
          name: file.name,
          url: dataUrl,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type: evidenceType.includes("Material") ? "Material Photo" : "Geo-tagged Photo",
          lat: latitude || 18.5204,
          lng: longitude || 73.8567,
          timestamp: new Date().toLocaleDateString("en-GB") + " " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        };
        setPhotos((prev) => [...prev, newP]);
      } catch (err) {
        console.warn("Photo upload error:", err);
      }
    }

    if (e.target) {
      e.target.value = "";
    }
  };

  const handleAddSamplePhoto = () => {
    const newP: SubmittedFileItem = {
      name: `Site_Photo_${stage.stageId}_${photos.length + 1}.jpg`,
      url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
      size: "2.4 MB",
      type: evidenceType.includes("Material") ? "Material Photo" : "Geo-tagged Photo",
      lat: latitude || 18.5204,
      lng: longitude || 73.8567,
      timestamp: new Date().toLocaleDateString("en-GB") + " " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };
    setPhotos((prev) => [...prev, newP]);
  };

  const handleAddDocumentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = (event.target?.result as string) || "#";
        setDocuments((prev) => [
          ...prev,
          {
            name: f.name,
            url: dataUrl,
            size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
            type: docTypeInput,
            timestamp: new Date().toLocaleDateString("en-GB") + " " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      };
      reader.readAsDataURL(f);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleRemoveDocument = (idx: number) => {
    setDocuments(documents.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (photos.length === 0 && documents.length === 0) {
      setErrorMsg("At least 1 photograph or supporting document voucher is required for stage verification.");
      return;
    }

    setIsSubmitting(true);

    const payload: SubmitStagePayload = {
      physicalProgressPercent: physicalProgress,
      expenditureAmountRs: expenditureAmount,
      workStage,
      materialStatus,
      evidenceType,
      files: [...photos, ...documents],
      latitude,
      longitude,
      locationText,
      notes: notes || `Evidence submitted for ${stage.stageName} period (${stage.scheduledStartDate} – ${stage.scheduledEndDate}).`
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSubmitSuccess(stage.stageId, payload);
        setIsSuccess(false);
        onClose();
      }, 900);
    }, 800);
  };

  const formatRs = (amt: number | null) => {
    if (amt === null || amt === undefined) return "Not available";
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    return `₹${(amt / 100000).toFixed(2)} Lakh`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Submit Evidence — ${stage.stageName}`}
      maxWidth="780px"
    >
      {isSuccess ? (
        <div style={{ padding: "36px 20px", textAlign: "center" }}>
          <CheckCircle2 size={52} color="var(--status-success-text)" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "6px" }}>
            Stage Evidence Submitted Successfully
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-body)", maxWidth: "500px", margin: "0 auto" }}>
            Evidence for <strong>{stage.stageName}</strong> (Period: {stage.scheduledStartDate} – {stage.scheduledEndDate}) has been submitted and routed for District Officer verification.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Stage Period Summary Banner */}
          <div
            style={{
              background: "var(--status-info-bg)",
              padding: "12px 14px",
              borderRadius: "var(--radius-xs)",
              border: "1px solid var(--status-info-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px"
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--gov-primary)" }}>
                {stage.stageName}
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-body)", marginTop: "2px" }}>
                Designated Stage Period: <strong>{stage.scheduledStartDate} – {stage.scheduledEndDate}</strong> | Target Progress: <strong>{stage.targetProgressPercent}%</strong>
              </div>
            </div>
            <span className="gov-badge gov-badge-info">ACTIVE STAGE PERIOD</span>
          </div>

          {/* Read-Only Parameter Banner */}
          <div
            style={{
              background: "var(--bg-surface-subtle)",
              padding: "8px 12px",
              borderRadius: "var(--radius-xs)",
              border: "1px solid var(--border-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
              fontSize: "0.74rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--gov-primary)" }}>
              <Lock size={12} color="var(--gov-primary)" />
              <span>Authority Parameters (Read-Only):</span>
            </div>
            <div style={{ color: "var(--text-muted)", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <span>Work ID: <strong style={{ fontFamily: "monospace" }}>{project.id}</strong></span>
              <span>Sanction: <strong>{formatRs(project.sanctionAmountRs)}</strong></span>
              <span>Schedule: <strong>{project.officialStartDate} – {project.officialExpectedCompletionDate}</strong></span>
            </div>
          </div>

          {/* GPS Geolocation Disclosure Notice */}
          <div
            style={{
              padding: "10px 12px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "var(--radius-xs)",
              fontSize: "0.76rem",
              color: "#1e40af",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px"
            }}
          >
            <MapPin size={18} color="#1d4ed8" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: "2px" }}>
                GPS Location Metadata Recording:
              </div>
              <div>
                Location coordinates ({locationText}) will be recorded with photo uploads for this stage period. 
                <strong style={{ marginLeft: "4px" }}>Note:</strong> Presence of GPS metadata does <strong>not</strong> constitute official government verification—final verification requires District Inspection Officer physical sign-off.
              </div>
            </div>
          </div>

          {errorMsg && (
            <div style={{ padding: "8px 12px", background: "var(--status-danger-bg)", border: "1px solid var(--status-danger-border)", color: "var(--status-danger-text)", fontSize: "0.78rem", borderRadius: "4px" }}>
              {errorMsg}
            </div>
          )}

          {/* Required Checklist Items for this Stage */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-main)", padding: "10px 12px", borderRadius: "var(--radius-xs)" }}>
            <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--gov-primary)", marginBottom: "4px" }}>
              Mandatory Stage Evidence Requirements:
            </div>
            <ul style={{ paddingLeft: "18px", fontSize: "0.78rem", margin: 0, color: "var(--text-body)" }}>
              {stage.requiredEvidenceTypes.map((req, idx) => (
                <li key={idx} style={{ marginBottom: "2px" }}>{req}</li>
              ))}
            </ul>
          </div>

          {/* Primary Evidence Type Selector */}
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--gov-primary)", display: "block", marginBottom: "4px" }}>
              Primary Evidence Category *
            </label>
            <select
              className="gov-select"
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
              style={{ width: "100%", fontWeight: 600 }}
            >
              <option value="Geo-tagged Work Progress Photo">Geo-tagged Work Progress Photo</option>
              <option value="Material Stock / Quality Test Photo">Material Stock / Quality Test Photo</option>
              <option value="Invoice / MB Voucher Document">Invoice / MB Voucher Document</option>
              <option value="Stage Progress & Expenditure Update">Stage Progress & Expenditure Update</option>
              <option value="Completion NOC Evidence">Completion NOC Evidence</option>
            </select>
          </div>

          {/* 1. PHOTO UPLOAD SECTION WITH LIVE GPS */}
          <div style={{ border: "1px solid var(--border-light)", padding: "12px", borderRadius: "var(--radius-xs)", background: "var(--bg-surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--gov-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Camera size={15} />
                <span>1. Geo-Tagged Stage Photographs ({photos.length})</span>
              </div>

              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={photoInputRef}
                  onChange={handleCustomPhotoUpload}
                  style={{ display: "none" }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={handleAcquireGps}
                  disabled={isAcquiringGps}
                  icon={isAcquiringGps ? <RefreshCw size={13} className="spin" /> : <MapPin size={13} />}
                >
                  {isAcquiringGps ? "Acquiring GPS..." : "📍 GPS"}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  icon={<Upload size={13} />}
                >
                  Upload Photo
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={handleAddSamplePhoto}
                  icon={<Plus size={13} />}
                >
                  Sample
                </Button>
              </div>
            </div>

            {/* GPS Metadata Badge */}
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "10px", background: "var(--bg-surface-subtle)", padding: "4px 8px", borderRadius: "4px" }}>
              Current Geolocation Tag: <strong>{locationText}</strong> (Captured at {gpsAcquiredTime})
            </div>

            {/* Photo Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
              {photos.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid var(--border-main)",
                    borderRadius: "var(--radius-xs)",
                    overflow: "hidden",
                    background: "var(--bg-surface)",
                    fontSize: "0.7rem",
                    position: "relative"
                  }}
                >
                  <img src={p.url} alt={p.name} style={{ width: "100%", height: "90px", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Trash2 size={11} />
                  </button>
                  <div style={{ padding: "6px" }}>
                    <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.name}
                    </div>
                    <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                      LAT: {p.lat?.toFixed(4)}, LNG: {p.lng?.toFixed(4)}
                    </div>
                    <div style={{ color: "var(--text-muted)" }}>{p.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. SUPPORTING INVOICES / DOCUMENTS UPLOAD */}
          <div style={{ border: "1px solid var(--border-light)", padding: "12px", borderRadius: "var(--radius-xs)", background: "var(--bg-surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--gov-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <FileText size={15} />
                <span>2. Stage Invoices / Vouchers / Test Documents ({documents.length})</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <select
                  className="gov-select"
                  value={docTypeInput}
                  onChange={(e) => setDocTypeInput(e.target.value)}
                  style={{ fontSize: "0.74rem", padding: "4px 8px" }}
                >
                  <option value="Measurement Book (MB) Voucher">Measurement Book (MB) Voucher</option>
                  <option value="Material Purchase Invoice">Material Purchase Invoice</option>
                  <option value="Material Quality Test Certificate">Material Quality Test Certificate</option>
                  <option value="Completion NOC Certificate">Completion NOC Certificate</option>
                  <option value="Other Voucher">Other Voucher</option>
                </select>

                <label className="gov-btn gov-btn-secondary" style={{ fontSize: "0.74rem", padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <FilePlus size={13} />
                  Attach Document
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleAddDocumentFile}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            {/* Document List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {documents.map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 10px",
                    background: "var(--bg-surface-subtle)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "4px",
                    fontSize: "0.76rem"
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700 }}>📄 {d.name}</span>
                    <span style={{ color: "var(--text-muted)", marginLeft: "8px" }}>({d.size || "1.5 MB"})</span>
                    <span className="gov-badge gov-badge-info" style={{ marginLeft: "8px" }}>{d.type}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ color: "var(--status-success-text)", fontWeight: 700, fontSize: "0.7rem" }}>Status: Uploaded</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(idx)}
                      style={{ background: "none", border: "none", color: "var(--status-danger-text)", cursor: "pointer" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. PROGRESS & EXPENDITURE REPORTING FORM */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--gov-primary)", display: "block" }}>
                Current Physical Progress (%) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="gov-input"
                value={physicalProgress}
                onChange={(e) => setPhysicalProgress(Number(e.target.value))}
                style={{ fontWeight: 700, width: "100%", marginTop: "3px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--gov-primary)", display: "block" }}>
                Expenditure Incurred To Date (₹) *
              </label>
              <input
                type="number"
                className="gov-input"
                value={expenditureAmount}
                onChange={(e) => setExpenditureAmount(Number(e.target.value))}
                style={{ fontWeight: 700, width: "100%", marginTop: "3px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--gov-primary)", display: "block" }}>
                Work Stage *
              </label>
              <input
                type="text"
                className="gov-input"
                value={workStage}
                onChange={(e) => setWorkStage(e.target.value)}
                style={{ fontWeight: 600, width: "100%", marginTop: "3px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--gov-primary)", display: "block" }}>
                Material Status *
              </label>
              <select
                className="gov-select"
                value={materialStatus}
                onChange={(e) => setMaterialStatus(e.target.value)}
                style={{ fontWeight: 600, width: "100%", marginTop: "3px" }}
              >
                <option value="Sufficient material stock available on site">Sufficient material stock available on site</option>
                <option value="Material procurement in progress">Material procurement in progress</option>
                <option value="Material quality lab test passed">Material quality lab test passed</option>
                <option value="Material delivery delayed">Material delivery delayed</option>
              </select>
            </div>
          </div>

          {/* Description / Field Remarks */}
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--gov-primary)", display: "block" }}>
              Field Description & Stage Progress Remarks
            </label>
            <textarea
              className="gov-input"
              rows={2}
              placeholder="Provide execution details for this stage period, material consumption logs, roller compaction test results..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: "100%", marginTop: "3px" }}
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
            <Button variant="secondary" size="md" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isSubmitting}
              icon={isSubmitting ? <RefreshCw size={15} className="spin" /> : <ShieldCheck size={15} />}
            >
              {isSubmitting ? "Submitting Stage Evidence Payload..." : "Submit Stage Evidence"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
