import React, { useState } from "react";
import { Camera, MapPin, Upload, Save, Send, AlertCircle, CheckCircle } from "lucide-react";
import { CitizenIssue, saveOfflineDraft } from "../../data/citizenData";
import { Modal, Button, Input, Select, Textarea, Alert } from "../ui";

export interface SubmitIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (issue: CitizenIssue) => void;
}

export const SubmitIssueModal: React.FC<SubmitIssueModalProps> = ({
  isOpen,
  onClose,
  onSubmitted
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CitizenIssue["category"]>("Water Supply");
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [isCapturingGeo, setIsCapturingGeo] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGeoMsg("Geolocation is not supported by your browser.");
      return;
    }
    setIsCapturingGeo(true);
    setGeoMsg("Acquiring GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGeoMsg(`GPS Locked: ${pos.coords.latitude.toFixed(4)}°, ${pos.coords.longitude.toFixed(4)}°`);
        setIsCapturingGeo(false);
      },
      (err) => {
        setGeoMsg(`GPS error: ${err.message}. Using fallback location.`);
        setLat(18.5204);
        setLng(73.8567);
        setIsCapturingGeo(false);
      },
      { timeout: 8000 }
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setPhotoUrl(fakeUrl);
    }
  };

  const handleSaveDraft = () => {
    const draft = saveOfflineDraft({
      title: title || "Draft Issue",
      category,
      locationName,
      description,
      latitude: lat,
      longitude: lng,
      photos: photoUrl ? [{ id: "p1", url: photoUrl, timestamp: new Date().toISOString() }] : []
    });
    setSuccessMsg("Draft saved locally! It will sync automatically when online.");
    setTimeout(() => {
      onSubmitted(draft);
      onClose();
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !locationName) return;

    setIsSaving(true);
    const newIssue: CitizenIssue = {
      id: `ISSUE-MH-2024-${Math.floor(100 + Math.random() * 900)}`,
      title,
      description,
      category,
      constituency: "Pune",
      district: "Pune",
      state: "Maharashtra",
      locationName,
      latitude: lat || 18.5204,
      longitude: lng || 73.8567,
      photos: photoUrl
        ? [{ id: `photo-${Date.now()}`, url: photoUrl, timestamp: new Date().toLocaleString(), lat, lng }]
        : [],
      documents: [],
      status: "SUBMITTED",
      dateSubmitted: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString().split("T")[0],
      officialResponse: "Issue registered successfully. Assigned to District Nodal Officer for review."
    };

    setTimeout(() => {
      setIsSaving(false);
      onSubmitted(newIssue);
      onClose();
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit New Citizen Issue / Grievance"
      maxWidth="680px"
    >
      {successMsg && <Alert type="success">{successMsg}</Alert>}

      <form onSubmit={handleSubmit}>
        <Input
          label="Issue Summary / Title"
          required
          placeholder="e.g., Incomplete Drinking Water Pipeline in Shivajinagar"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Select
            label="Category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as CitizenIssue["category"])}
            options={[
              { value: "Water Supply", label: "Drinking Water & Sanitation" },
              { value: "Road Repair", label: "Roads & Rural Bridges" },
              { value: "School Facility", label: "Education & Classrooms" },
              { value: "Health Center", label: "Healthcare Facilities" },
              { value: "Street Solar", label: "Street Lights & Solar Assets" },
              { value: "Other", label: "Other Community Asset" }
            ]}
          />

          <Input
            label="Specific Location / Landmark"
            required
            placeholder="e.g., Near Bus Stand, Ward 12"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />
        </div>

        {/* GPS Geolocation Capture Box */}
        <div style={{ marginBottom: "14px", padding: "10px", background: "var(--bg-surface-subtle)", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-main)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--gov-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={15} /> Geotagged Location Capture
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={handleCaptureGPS} isLoading={isCapturingGeo}>
              Get GPS Location
            </Button>
          </div>
          {geoMsg && <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>{geoMsg}</div>}
        </div>

        <Textarea
          label="Detailed Problem Description"
          required
          rows={3}
          placeholder="Provide specific details about the issue, duration of non-completion, or safety impact..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Camera / Photo Evidence Upload Box */}
        <div className="gov-form-group">
          <label className="gov-label">Upload Site Photograph / Evidence</label>
          <div style={{ border: "2px dashed var(--border-main)", padding: "14px", borderRadius: "var(--radius-xs)", textAlign: "center", background: "var(--bg-surface-subtle)" }}>
            {photoUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                <img src={photoUrl} alt="Preview" style={{ width: "80px", height: "60px", objectFit: "cover", borderRadius: "4px" }} />
                <span style={{ fontSize: "0.78rem", color: "var(--status-success-text)", fontWeight: 600 }}>Photo Attached</span>
                <Button type="button" variant="danger" size="sm" onClick={() => setPhotoUrl("")}>Remove</Button>
              </div>
            ) : (
              <div>
                <Camera size={24} color="var(--text-muted)" style={{ marginBottom: "4px" }} />
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Click to capture photo using device camera or upload image file
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  style={{ marginTop: "8px", fontSize: "0.78rem" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Footers */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-light)" }}>
          <Button type="button" variant="secondary" onClick={handleSaveDraft} icon={<Save size={14} />}>
            Save Offline Draft
          </Button>

          <div style={{ display: "flex", gap: "8px" }}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving} icon={<Send size={14} />}>
              Submit Issue
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default SubmitIssueModal;
