import React, { useState } from "react";
import { 
  Plus, Camera, MapPin, Upload, Send, AlertCircle, CheckCircle2, 
  X, Landmark, Sparkles, AlertTriangle, FileText, Image as ImageIcon,
  Building, Check, Info, Users, HelpCircle
} from "lucide-react";
import { CitizenIssue, IssuePhoto } from "../../data/citizenData";
import { Modal, Button, Input, Select, Textarea, Alert } from "../ui";
import { fileToOptimizedDataUrl, extractOcrAndGisLocation } from "../../utils/imageUploadHelper";

export interface SubmitRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (recommendation: CitizenIssue) => void;
  currentConstituency?: string;
  currentState?: string;
}

const CATEGORY_OPTIONS = [
  { value: "Road Repair", label: "Roads, Bridges & Footpaths" },
  { value: "Water Supply", label: "Drinking Water Supply & RO Plants" },
  { value: "School Facility", label: "School Classrooms & Education Facilities" },
  { value: "Health Center", label: "Primary Health Clinics & Medical Centers" },
  { value: "Street Solar", label: "Solar Street Lighting & High-Mast Poles" },
  { value: "Sanitation & Drainage", label: "Covered Storm Drainage & Public Sanitation" },
  { value: "Community Hall", label: "Community Centers & Public Bhavans" },
  { value: "Other", label: "Other Local Public Asset" }
];

const URGENCY_OPTIONS = [
  { value: "URGENT", label: "Urgent (Severe safety or health hazard)" },
  { value: "HIGH", label: "High Priority (Critical community necessity)" },
  { value: "MEDIUM", label: "Medium Priority (Public amenity enhancement)" }
];

// Presets for rapid demo testing with pre-filled evidence
const SAMPLE_EVIDENCE_PRESETS = [
  {
    label: "Damaged Road / Severe Potholes",
    category: "Road Repair",
    title: "Reconstruction of Damaged Connecting Road with Covered Drainage",
    situation: "Main access road is severely eroded with 1.5-foot craters and washed-out shoulders. School vans and ambulances cannot pass safely during rains.",
    proposed: "Construct 1.2 km Cement Concrete (CC) Road with covered RCC side drains and solar lighting.",
    photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=800&auto=format&fit=crop&q=60",
    photoCaption: "Severe waterlogged craters and eroded asphalt on main stretch"
  },
  {
    label: "Lack of Drinking Water Facility",
    category: "Water Supply",
    title: "Installation of Community Solar-Powered RO Drinking Water Kiosk",
    situation: "Existing groundwater has high salinity and contamination (TDS > 950 ppm). Over 500 households have no municipal piped water access.",
    proposed: "Install 1,000 LPH Solar RO Filtration Plant with 5,000-liter overhead storage tank and automated dispensing taps.",
    photoUrl: "https://images.unsplash.com/photo-1584467746872-9599a0e5324e?w=800&auto=format&fit=crop&q=60",
    photoCaption: "Dry community tap stand and designated land for new RO kiosk"
  },
  {
    label: "Dark / Unlit Street Hazards",
    category: "Street Solar",
    title: "Installation of Solar High-Mast Street Lighting System",
    situation: "800-meter corridor between village square and bus stop remains pitch dark after sunset, leading to theft and safety issues for women & seniors.",
    proposed: "Install 4 units of 12-meter Octagonal Solar LED High-Mast light poles with battery backup.",
    photoUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=60",
    photoCaption: "Unlit dark stretch creating safety hazards after dusk"
  }
];

export const SubmitRecommendationModal: React.FC<SubmitRecommendationModalProps> = ({
  isOpen,
  onClose,
  onSubmitted,
  currentConstituency = "Rohtak",
  currentState = "Haryana"
}) => {
  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Road Repair");
  const [locationName, setLocationName] = useState("");
  const [pincode, setPincode] = useState("");
  const [currentSituation, setCurrentSituation] = useState("");
  const [proposedWork, setProposedWork] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<"URGENT" | "HIGH" | "MEDIUM">("HIGH");
  const [estimatedBeneficiaries, setEstimatedBeneficiaries] = useState("");
  const [citizenName, setCitizenName] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // Location / GPS
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [isCapturingGeo, setIsCapturingGeo] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");

  // Photo Evidence State
  const [photos, setPhotos] = useState<IssuePhoto[]>([]);
  const [customPhotoInput, setCustomPhotoInput] = useState("");
  const [photoCaptionInput, setPhotoCaptionInput] = useState("");

  // UI / Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [submittedItem, setSubmittedItem] = useState<CitizenIssue | null>(null);

  const resetForm = () => {
    setTitle("");
    setCategory("Road Repair");
    setLocationName("");
    setPincode("");
    setCurrentSituation("");
    setProposedWork("");
    setUrgencyLevel("HIGH");
    setEstimatedBeneficiaries("");
    setCitizenName("");
    setContactNumber("");
    setLat(undefined);
    setLng(undefined);
    setGeoMsg("");
    setPhotos([]);
    setCustomPhotoInput("");
    setPhotoCaptionInput("");
    setSubmittedItem(null);
  };

  const handleApplyPreset = (preset: typeof SAMPLE_EVIDENCE_PRESETS[0]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setCurrentSituation(preset.situation);
    setProposedWork(preset.proposed);
    if (!locationName) {
      setLocationName(`Near Main Square, ${currentConstituency}`);
    }
    setPhotos([
      {
        id: `ev-${Date.now()}`,
        url: preset.photoUrl,
        timestamp: new Date().toLocaleString(),
        caption: preset.photoCaption,
        lat: lat || 18.5204,
        lng: lng || 73.8567
      }
    ]);
  };

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGeoMsg("Location services not supported on this browser.");
      return;
    }
    setIsCapturingGeo(true);
    setGeoMsg("Detecting current coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGeoMsg(`GPS Pinned: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`);
        setIsCapturingGeo(false);
      },
      () => {
        setGeoMsg("Could not detect GPS automatically. Please enter location manually.");
        setIsCapturingGeo(false);
      },
      { timeout: 7000 }
    );
  };

  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [detectedGisNote, setDetectedGisNote] = useState<string | null>(null);

  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingPhoto(true);
      setIsScanningOcr(true);
      try {
        const [dataUrl, geoInfo] = await Promise.all([
          fileToOptimizedDataUrl(file, 1280, 1280, 0.85),
          extractOcrAndGisLocation(file, currentConstituency, currentState)
        ]);

        let photoLat = lat;
        let photoLng = lng;

        if (geoInfo) {
          if (geoInfo.latitude && geoInfo.longitude) {
            photoLat = geoInfo.latitude;
            photoLng = geoInfo.longitude;
            setLat(geoInfo.latitude);
            setLng(geoInfo.longitude);
            setGeoMsg(`📍 Auto-pinned via Photo GIS: ${geoInfo.latitude.toFixed(4)}° N, ${geoInfo.longitude.toFixed(4)}° E`);
          }
          if (!locationName.trim() && geoInfo.locationName) {
            setLocationName(geoInfo.locationName);
          }
          if (!pincode.trim() && geoInfo.pincode) {
            setPincode(geoInfo.pincode);
          }
          if (geoInfo.locationName || geoInfo.latitude) {
            setDetectedGisNote(
              `GIS / OCR detected: ${geoInfo.locationName || "Site"} ${geoInfo.latitude ? `(${geoInfo.latitude.toFixed(4)}° N, ${geoInfo.longitude?.toFixed(4)}° E)` : ""}`
            );
          }
        }

        const newPhoto: IssuePhoto = {
          id: `photo-${Date.now()}`,
          url: dataUrl,
          timestamp: new Date().toLocaleString(),
          caption: photoCaptionInput.trim() || `Site evidence photo taken on ${new Date().toLocaleDateString()}`,
          lat: photoLat,
          lng: photoLng
        };
        setPhotos((prev) => [...prev, newPhoto]);
        setPhotoCaptionInput("");
      } catch (err) {
        console.error("Failed to process photo upload:", err);
      } finally {
        setIsProcessingPhoto(false);
        setIsScanningOcr(false);
      }
    }
  };

  const handleAddPhotoByUrl = () => {
    if (!customPhotoInput.trim()) return;
    const newPhoto: IssuePhoto = {
      id: `photo-${Date.now()}`,
      url: customPhotoInput.trim(),
      timestamp: new Date().toLocaleString(),
      caption: photoCaptionInput.trim() || "Ground situation evidence photo",
      lat,
      lng
    };
    setPhotos([...photos, newPhoto]);
    setCustomPhotoInput("");
    setPhotoCaptionInput("");
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim() || !currentSituation.trim()) return;

    setIsSaving(true);
    const trackingNum = Math.floor(100 + Math.random() * 900);
    const statePrefix = currentState.slice(0, 2).toUpperCase();
    const newRec: CitizenIssue = {
      id: `REC-CIT-${statePrefix}-${trackingNum}`,
      type: "work_recommendation",
      title: title.trim(),
      description: currentSituation.trim(),
      currentSituation: currentSituation.trim(),
      proposedWork: proposedWork.trim() || `Proposed new infrastructure work: ${title.trim()}`,
      category,
      constituency: currentConstituency,
      district: currentConstituency,
      state: currentState,
      locationName: locationName.trim(),
      pincode: pincode.trim() || undefined,
      latitude: lat || 18.5204,
      longitude: lng || 73.8567,
      urgencyLevel,
      estimatedBeneficiaries: estimatedBeneficiaries.trim() || "Local ward residents",
      submittedBy: citizenName.trim() || "Resident Citizen",
      contactNumber: contactNumber.trim() || undefined,
      photos,
      documents: [],
      status: "SUBMITTED",
      stage: "submitted",
      dateSubmitted: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString().split("T")[0],
      officialResponse: "Recommendation proposal received by MP Constituency Office. Scheduled for technical viability review."
    };

    setTimeout(() => {
      setIsSaving(false);
      setSubmittedItem(newRec);
      onSubmitted(newRec);
    }, 700);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Propose Work Recommendation to MP"
      maxWidth="780px"
    >
      {submittedItem ? (
        <div style={{ padding: "20px 10px", textAlign: "center", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", color: "#059669" }}>
            <CheckCircle2 size={40} />
          </div>

          <div>
            <span className="gov-badge gov-badge-success" style={{ fontSize: "0.78rem", padding: "4px 12px", marginBottom: "8px" }}>
              Request Transmitted to MP Office
            </span>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--gov-primary)", margin: "8px 0 4px 0", fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              Work Recommendation Submitted Successfully!
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "560px", margin: "0 auto", lineHeight: "1.5" }}>
              Your proposal along with on-ground evidence has been submitted to the Hon'ble Member of Parliament for <strong>{currentConstituency}</strong>. The MP office will review the evidence for inclusion in official MPLADS recommendations.
            </p>
          </div>

          {/* Receipt Card */}
          <div style={{ background: "var(--bg-surface-subtle)", border: "1px solid var(--border-main)", borderRadius: "8px", padding: "16px 20px", textAlign: "left", maxWidth: "560px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-light)", paddingBottom: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>Tracking Proposal ID:</span>
              <strong style={{ fontSize: "0.86rem", color: "var(--gov-primary)", fontFamily: "monospace" }}>{submittedItem.id}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-light)", paddingBottom: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>Project Title:</span>
              <strong style={{ fontSize: "0.82rem", color: "var(--text-main)", maxWidth: "320px", textAlign: "right" }}>{submittedItem.title}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-light)", paddingBottom: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>Constituency & Sector:</span>
              <span style={{ fontSize: "0.80rem", color: "var(--text-main)" }}>{submittedItem.constituency} &bull; {submittedItem.category}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>Evidence Attached:</span>
              <span style={{ fontSize: "0.80rem", color: "#059669", fontWeight: 700 }}>
                {submittedItem.photos.length > 0 ? `${submittedItem.photos.length} Photo(s) Attached` : "No Photos Attached"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "8px" }}>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                resetForm();
                onClose();
              }}
              style={{ minWidth: "160px" }}
            >
              Done & View My Reports
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Top Banner with Context */}
          <div style={{ background: "linear-gradient(135deg, rgba(10, 37, 64, 0.05) 0%, rgba(217, 119, 6, 0.08) 100%)", border: "1px solid var(--border-main)", borderRadius: "8px", padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Landmark size={20} color="var(--gov-accent)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--gov-primary)", margin: 0 }}>
                  Submit Infrastructure Proposal to Hon'ble MP for {currentConstituency}
                </h4>
                <p style={{ fontSize: "0.76rem", color: "var(--text-body)", margin: "3px 0 0 0", lineHeight: "1.4" }}>
                  Provide photos and description of the current situation (e.g. damaged road, lack of drinking water). The MP will evaluate your evidence to recommend this work under MPLADS funds.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Demo Sample Fillers */}
          <div style={{ background: "var(--bg-surface-subtle)", padding: "10px 14px", borderRadius: "6px", border: "1px dashed var(--border-light)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "6px" }}>
              <Sparkles size={13} color="var(--gov-accent)" />
              <span>Quick Demo Fillers (Click to autofill sample evidence):</span>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {SAMPLE_EVIDENCE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "4px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-main)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "var(--gov-primary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gov-accent)"; e.currentTarget.style.background = "var(--status-info-bg)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-main)"; e.currentTarget.style.background = "var(--bg-surface)"; }}
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Title & Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="gov-label" style={{ fontWeight: 700, marginBottom: "4px", display: "block" }}>
                1. Proposed Work / Project Name <span style={{ color: "var(--status-danger-text)" }}>*</span>
              </label>
              <Input
                placeholder="e.g. Reconstruction of Damaged 1.2km Main Connecting Road & Drain"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="gov-label" style={{ fontWeight: 700, marginBottom: "4px", display: "block" }}>
                2. Development Sector / Category <span style={{ color: "var(--status-danger-text)" }}>*</span>
              </label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORY_OPTIONS}
              />
            </div>

            <div>
              <label className="gov-label" style={{ fontWeight: 700, marginBottom: "4px", display: "block" }}>
                3. Urgency Level <span style={{ color: "var(--status-danger-text)" }}>*</span>
              </label>
              <Select
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value as any)}
                options={URGENCY_OPTIONS}
              />
            </div>
          </div>

          {/* Section 2: Location & GPS */}
          <div>
            <label className="gov-label" style={{ fontWeight: 700, marginBottom: "4px", display: "block" }}>
              4. Specific Location, Ward / Village & Landmark <span style={{ color: "var(--status-danger-text)" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                <Input
                  placeholder="e.g. Shivane Gaon Main Road, Near Primary School, Ward 24"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />
              </div>
              <div style={{ width: "120px" }}>
                <Input
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
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
                {lat ? "GPS Pinned" : "Pin GPS"}
              </Button>
            </div>
            {geoMsg && (
              <span style={{ fontSize: "0.72rem", color: "var(--gov-accent)", marginTop: "3px", display: "block", fontWeight: 600 }}>
                {geoMsg}
              </span>
            )}
          </div>

          {/* Section 3: Current Situation & Damage Details */}
          <div>
            <label className="gov-label" style={{ fontWeight: 700, marginBottom: "4px", display: "block" }}>
              5. Current Ground Reality & Situation Details <span style={{ color: "var(--status-danger-text)" }}>*</span>
            </label>
            <Textarea
              required
              rows={3}
              placeholder="Describe what is currently broken, damaged, or lacking (e.g. Road is full of deep potholes, mud flooding during rains, ambulances cannot reach village)..."
              value={currentSituation}
              onChange={(e) => setCurrentSituation(e.target.value)}
            />
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
              This information gives the MP exact details on why this project is critically required.
            </span>
          </div>

          {/* Section 4: Photo / Video Evidence Upload */}
          <div>
            <label className="gov-label" style={{ fontWeight: 700, marginBottom: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>6. Upload Ground Evidence (Photos of Damaged Site / Condition)</span>
              <span style={{ fontSize: "0.72rem", color: "var(--gov-accent)", fontWeight: 600 }}>Recommended</span>
            </label>

            {/* Photo List Preview */}
            {photos.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "10px" }}>
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    style={{
                      position: "relative",
                      borderRadius: "6px",
                      overflow: "hidden",
                      border: "1px solid var(--border-main)",
                      background: "var(--bg-surface)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
                    }}
                  >
                    <img
                      src={photo.url}
                      alt="Evidence preview"
                      style={{ width: "100%", height: "110px", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      style={{
                        position: "absolute",
                        top: "6px",
                        right: "6px",
                        background: "rgba(0,0,0,0.7)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: "22px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                      }}
                      title="Remove Photo"
                    >
                      <X size={12} />
                    </button>
                    <div style={{ padding: "6px 8px", fontSize: "0.70rem", color: "var(--text-main)" }}>
                      <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {photo.caption || "Site Evidence"}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.66rem" }}>
                        {photo.timestamp} {photo.lat ? `&bull; Geotagged` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Photo Upload Options */}
            <div
              style={{
                border: "2px dashed var(--border-main)",
                borderRadius: "8px",
                padding: "14px",
                background: "var(--bg-surface-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Camera size={20} color="var(--gov-accent)" />
                  <span style={{ fontSize: "0.80rem", fontWeight: 600, color: "var(--text-main)" }}>
                    Attach photo from your device or camera
                  </span>
                </div>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: "var(--gov-primary)",
                    color: "#fff",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <Upload size={13} />
                  <span>Choose Photo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {/* Or Add Image URL */}
              <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px dashed var(--border-light)" }}>
                <div style={{ flex: 1 }}>
                  <Input
                    placeholder="Or enter image URL (e.g. https://...)"
                    value={customPhotoInput}
                    onChange={(e) => setCustomPhotoInput(e.target.value)}
                  />
                </div>
                <div style={{ width: "160px" }}>
                  <Input
                    placeholder="Photo caption..."
                    value={photoCaptionInput}
                    onChange={(e) => setPhotoCaptionInput(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleAddPhotoByUrl}
                  disabled={!customPhotoInput.trim()}
                >
                  Add Photo
                </Button>
              </div>

              {/* OCR Scanning & GIS Detection Feedback */}
              {isScanningOcr && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--gov-accent)", fontWeight: 600 }}>
                  <Sparkles size={13} className="spin-animate" />
                  <span>AI OCR & EXIF GIS engine extracting coordinates and location...</span>
                </div>
              )}

              {detectedGisNote && !isScanningOcr && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", color: "var(--status-success-text)", background: "rgba(16, 185, 129, 0.1)", padding: "4px 8px", borderRadius: "4px" }}>
                  <Check size={13} />
                  <span>{detectedGisNote}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Proposed Project Scope & Beneficiaries */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="gov-label" style={{ fontWeight: 700, marginBottom: "4px", display: "block" }}>
                7. Specific Work Citizen Wants MP to Recommend
              </label>
              <Input
                placeholder="e.g. Sanction 1.5km CC Road with RCC drain under MPLADS FY 24-25"
                value={proposedWork}
                onChange={(e) => setProposedWork(e.target.value)}
              />
            </div>

            <div>
              <label className="gov-label" style={{ fontWeight: 700, marginBottom: "4px", display: "block" }}>
                8. Estimated Beneficiaries / Impact
              </label>
              <Input
                placeholder="e.g. 5,000+ village residents & school students"
                value={estimatedBeneficiaries}
                onChange={(e) => setEstimatedBeneficiaries(e.target.value)}
              />
            </div>
          </div>

          {/* Section 6: Citizen Contact Details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "6px", border: "1px solid var(--border-light)" }}>
            <div>
              <label className="gov-label" style={{ fontWeight: 600, fontSize: "0.78rem", marginBottom: "3px", display: "block" }}>
                Your Name / Organization (Optional)
              </label>
              <Input
                placeholder="e.g. Suresh Shinde / Residents Welfare Group"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
              />
            </div>

            <div>
              <label className="gov-label" style={{ fontWeight: 600, fontSize: "0.78rem", marginBottom: "3px", display: "block" }}>
                Mobile Number for SMS Status Updates (Optional)
              </label>
              <Input
                placeholder="e.g. +91 98230 XXXXX"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
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
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              icon={<Send size={15} />}
              style={{ minWidth: "190px", background: "#059669", borderColor: "#047857", fontWeight: 700 }}
            >
              Submit Recommendation to MP
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default SubmitRecommendationModal;
