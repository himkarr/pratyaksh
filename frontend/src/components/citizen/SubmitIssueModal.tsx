import React, { useState, useEffect } from "react";
import { 
  Camera, MapPin, Upload, Send, AlertCircle, CheckCircle2, 
  X, Landmark, AlertTriangle, HelpCircle, FileText
} from "lucide-react";
import { CitizenIssue } from "../../data/citizenData";
import { WorkItem, INITIAL_WORKS } from "../../data/mpladsData";
import { Modal, Button, Input, Select, Textarea, Alert } from "../ui";
import { fileToOptimizedDataUrl } from "../../utils/imageUploadHelper";

export interface SubmitIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (issue: CitizenIssue) => void;
  initialWork?: WorkItem | null;
  worksList?: WorkItem[];
  currentConstituency?: string;
}

const PROBLEM_TYPES = [
  { value: "Work not started", label: "Work not started (delayed start)" },
  { value: "Work stopped", label: "Work stopped / abandoned" },
  { value: "Poor quality", label: "Poor quality / substandard work" },
  { value: "Damaged work", label: "Damaged / broken infrastructure" },
  { value: "Not completed in reality", label: "Work shown as completed but not actually completed" },
  { value: "Other", label: "Other local problem" }
];

export const SubmitIssueModal: React.FC<SubmitIssueModalProps> = ({
  isOpen,
  onClose,
  onSubmitted,
  initialWork = null,
  worksList = INITIAL_WORKS,
  currentConstituency = "Pune"
}) => {
  const [selectedWorkId, setSelectedWorkId] = useState<string>(initialWork?.id || "unlisted");
  const [problemType, setProblemType] = useState<string>("Work stopped");
  const [title, setTitle] = useState("");
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [isCapturingGeo, setIsCapturingGeo] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (initialWork) {
      setSelectedWorkId(initialWork.id);
      setTitle(`Issue regarding: ${initialWork.title}`);
      setLocationName(`${initialWork.constituency}, ${initialWork.district}`);
    } else {
      setSelectedWorkId("unlisted");
      setTitle("");
      setLocationName("");
    }
  }, [initialWork, isOpen]);

  const handleWorkSelectionChange = (workId: string) => {
    setSelectedWorkId(workId);
    if (workId !== "unlisted") {
      const found = worksList.find((w) => w.id === workId);
      if (found) {
        setTitle(`Problem with ${found.title}`);
        setLocationName(`${found.constituency} (${found.district})`);
      }
    } else {
      setTitle("");
    }
  };

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGeoMsg("Location services not available on this device.");
      return;
    }
    setIsCapturingGeo(true);
    setGeoMsg("Finding your current location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGeoMsg(`Location pinned: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`);
        setIsCapturingGeo(false);
      },
      (err) => {
        setGeoMsg("Could not detect GPS automatically. Please enter landmark manually.");
        setIsCapturingGeo(false);
      },
      { timeout: 8000 }
    );
  };

  const [isOptimizingPhoto, setIsOptimizingPhoto] = useState(false);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsOptimizingPhoto(true);
      try {
        const dataUrl = await fileToOptimizedDataUrl(file, 1280, 1280, 0.85);
        setPhotoUrl(dataUrl);
      } catch (err) {
        console.error("Failed to process photo:", err);
      } finally {
        setIsOptimizingPhoto(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !locationName.trim()) return;

    setIsSaving(true);
    const linkedWork = worksList.find((w) => w.id === selectedWorkId);
    const finalTitle = title.trim() || (linkedWork ? `Report: ${linkedWork.title}` : `${problemType} at ${locationName}`);
    
    const randomNum = Math.floor(100 + Math.random() * 900);
    const newReport: CitizenIssue = {
      id: `REP-2024-${randomNum}`,
      title: finalTitle,
      description,
      category: linkedWork?.category === "Water" ? "Water Supply" : (linkedWork?.category === "Roads" ? "Road Repair" : "Other"),
      constituency: linkedWork?.constituency || currentConstituency,
      district: linkedWork?.district || currentConstituency,
      state: linkedWork?.state || "Maharashtra",
      locationName,
      latitude: lat || 18.5204,
      longitude: lng || 73.8567,
      problemType,
      linkedWorkId: linkedWork ? linkedWork.id : undefined,
      linkedWorkTitle: linkedWork ? linkedWork.title : undefined,
      photos: photoUrl
        ? [{ id: `photo-${Date.now()}`, url: photoUrl, timestamp: new Date().toLocaleDateString() }]
        : [],
      documents: [],
      status: "SUBMITTED",
      stage: "submitted",
      dateSubmitted: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString().split("T")[0],
      officialResponse: "Report received. Assigned to local development officer for physical verification."
    };

    setTimeout(() => {
      setIsSaving(false);
      setSuccessMsg(`Report #${newReport.id} submitted successfully! You can track its progress in "My Reports".`);
      setTimeout(() => {
        setSuccessMsg("");
        onSubmitted(newReport);
        onClose();
      }, 1400);
    }, 600);
  };

  const workOptions = [
    { value: "unlisted", label: "General Local Issue (Unlisted / Not in list)" },
    ...worksList.map((w) => ({
      value: w.id,
      label: `[${w.id}] ${w.title.slice(0, 55)}${w.title.length > 55 ? "..." : ""}`
    }))
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report a Problem"
      maxWidth="640px"
    >
      {successMsg ? (
        <div style={{ padding: "20px 10px", textAlign: "center" }}>
          <CheckCircle2 size={48} color="var(--status-success-text)" style={{ margin: "0 auto 12px auto" }} />
          <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "6px" }}>
            Report Submitted Successfully
          </h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-body)", margin: 0 }}>
            {successMsg}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          
          {/* Step 1: Select Development Work */}
          <div>
            <label className="gov-label" style={{ fontWeight: 700, marginBottom: "4px", display: "block" }}>
              1. Select Associated Work
            </label>
            <Select
              value={selectedWorkId}
              onChange={(e) => handleWorkSelectionChange(e.target.value)}
              options={workOptions}
            />
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
              Choose a sanctioned MPLADS project or select general unlisted issue.
            </span>
          </div>

          {/* Step 2: Problem Type */}
          <div>
            <label className="gov-label" style={{ fontWeight: 700, marginBottom: "4px", display: "block" }}>
              2. What type of problem are you facing? <span style={{ color: "var(--status-danger-text)" }}>*</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "8px" }}>
              {PROBLEM_TYPES.map((pt) => {
                const isSelected = problemType === pt.value;
                return (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => setProblemType(pt.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-xs)",
                      border: isSelected ? "2px solid var(--gov-accent)" : "1px solid var(--border-main)",
                      background: isSelected ? "var(--status-info-bg)" : "var(--bg-surface)",
                      color: isSelected ? "var(--gov-accent)" : "var(--text-main)",
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: "0.80rem",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        border: isSelected ? "4px solid var(--gov-accent)" : "1.5px solid var(--border-dark)",
                        background: isSelected ? "#fff" : "transparent"
                      }}
                    />
                    <span>{pt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Location / Landmark */}
          <div>
            <label className="gov-label" style={{ fontWeight: 700, marginBottom: "4px", display: "block" }}>
              3. Location & Landmark <span style={{ color: "var(--status-danger-text)" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                <Input
                  placeholder="e.g., Near Bus Depot, Ward 12, Shivajinagar"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleCaptureGPS}
                isLoading={isCapturingGeo}
                icon={<MapPin size={14} />}
                title="Detect GPS coordinates"
              >
                {lat ? "GPS Locked" : "Get GPS"}
              </Button>
            </div>
            {geoMsg && (
              <span style={{ fontSize: "0.72rem", color: "var(--gov-accent)", marginTop: "3px", display: "block" }}>
                {geoMsg}
              </span>
            )}
          </div>

          {/* Step 4: Description */}
          <div>
            <label className="gov-label" style={{ fontWeight: 700, marginBottom: "4px", display: "block" }}>
              4. Short Description of the Problem <span style={{ color: "var(--status-danger-text)" }}>*</span>
            </label>
            <Textarea
              required
              rows={3}
              placeholder="Please describe what is wrong, how long this issue has persisted, or any safety concerns..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Step 5: Photo Evidence (Optional) */}
          <div>
            <label className="gov-label" style={{ fontWeight: 700, marginBottom: "4px", display: "block" }}>
              5. Add a Photo (Optional)
            </label>
            <div
              style={{
                border: "2px dashed var(--border-main)",
                borderRadius: "var(--radius-xs)",
                padding: "12px",
                textAlign: "center",
                background: "var(--bg-surface-subtle)"
              }}
            >
              {photoUrl ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                  <img
                    src={photoUrl}
                    alt="Upload Preview"
                    style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "4px" }}
                  />
                  <span style={{ fontSize: "0.80rem", color: "var(--status-success-text)", fontWeight: 600 }}>
                    ✓ Photo Attached
                  </span>
                  <Button type="button" variant="danger" size="sm" onClick={() => setPhotoUrl("")}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div>
                  <Camera size={22} color="var(--text-muted)" style={{ margin: "0 auto 4px auto" }} />
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Upload or take a photo of the site
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    style={{ marginTop: "6px", fontSize: "0.75rem" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "10px",
              marginTop: "8px",
              paddingTop: "12px",
              borderTop: "1px solid var(--border-light)"
            }}
          >
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              icon={<Send size={15} />}
              style={{ minWidth: "140px" }}
            >
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default SubmitIssueModal;
