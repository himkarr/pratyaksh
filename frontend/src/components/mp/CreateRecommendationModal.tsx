import React, { useState, useEffect } from "react";
import { Plus, X, Landmark, FileText, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon } from "lucide-react";
import { Modal, Button, Input } from "../ui";
import { MPRecommendation } from "../../data/mpData";
import { CitizenIssue } from "../../data/citizenData";

interface CreateRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (recommendation: MPRecommendation) => void;
  mpName?: string;
  constituency?: string;
  constituencyCode?: string;
  district?: string;
  initialCitizenId?: string;
  initialCitizenIssue?: CitizenIssue | null;
}

const CATEGORIES = [
  "Drinking Water",
  "Education",
  "Roads",
  "Health",
  "Community Assets",
  "Renewable Energy",
  "Sports"
] as const;

export const CreateRecommendationModal: React.FC<CreateRecommendationModalProps> = ({
  isOpen,
  onClose,
  onSubmitted,
  mpName = "Shri Deepender Singh Hooda",
  constituency = "Rohtak",
  constituencyCode = "HR-ROH-01",
  district = "Rohtak",
  initialCitizenId = "",
  initialCitizenIssue = null
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<MPRecommendation["category"]>("Drinking Water");
  const [estimatedCost, setEstimatedCost] = useState<string>("0.50");
  const [location, setLocation] = useState("");
  const [justification, setJustification] = useState("");
  const [citizenRequestId, setCitizenRequestId] = useState(initialCitizenId);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (initialCitizenIssue) {
      setTitle(initialCitizenIssue.proposedWork || initialCitizenIssue.title || "");
      const mapCat = (c: string): MPRecommendation["category"] => {
        if (c.toLowerCase().includes("road")) return "Roads";
        if (c.toLowerCase().includes("water")) return "Drinking Water";
        if (c.toLowerCase().includes("solar")) return "Renewable Energy";
        if (c.toLowerCase().includes("school") || c.toLowerCase().includes("education")) return "Education";
        if (c.toLowerCase().includes("health")) return "Health";
        return "Community Assets";
      };
      setCategory(mapCat(initialCitizenIssue.category));
      setLocation(initialCitizenIssue.locationName || "");
      setCitizenRequestId(initialCitizenIssue.id);
      
      const citizenEvidenceText = initialCitizenIssue.currentSituation 
        ? `Adopting public demand from Citizen Proposal #${initialCitizenIssue.id}. Current Ground Reality: ${initialCitizenIssue.currentSituation}. Beneficiaries: ${initialCitizenIssue.estimatedBeneficiaries || "Local Community"}.`
        : `Adopting citizen demand from #${initialCitizenIssue.id}: ${initialCitizenIssue.description}`;
      setJustification(citizenEvidenceText);
      setEstimatedCost("0.60");
    } else if (initialCitizenId) {
      setCitizenRequestId(initialCitizenId);
    }
  }, [initialCitizenIssue, initialCitizenId, isOpen]);

  const resetForm = () => {
    setTitle("");
    setCategory("Drinking Water");
    setEstimatedCost("0.50");
    setLocation("");
    setJustification("");
    setCitizenRequestId("");
    setErrorMsg("");
    setIsSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Please provide a descriptive title for the recommended work.");
      return;
    }

    const costNum = parseFloat(estimatedCost);
    if (isNaN(costNum) || costNum <= 0) {
      setErrorMsg("Please enter a valid estimated cost (in ₹ Crores).");
      return;
    }

    if (costNum > 5.0) {
      setErrorMsg("A single work recommendation cannot exceed the annual constituency ceiling of ₹5.00 Cr.");
      return;
    }

    if (!location.trim()) {
      setErrorMsg("Please specify the exact location / Ward / Panchayat.");
      return;
    }

    if (!justification.trim()) {
      setErrorMsg("Please provide public necessity & justification notes.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newRec: MPRecommendation = {
        id: `REC-${constituencyCode || "REC"}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        title: title.trim(),
        category,
        estimatedCost: Number(costNum.toFixed(2)),
        location: location.trim(),
        district,
        constituency,
        constituency_code: constituencyCode,
        mpName,
        justification: justification.trim(),
        status: "PROPOSED",
        dateProposed: new Date().toISOString().split("T")[0],
        citizenRequestId: citizenRequestId.trim() || undefined,
        districtNotes: "Submitted to District Collector / Nodal Authority for technical scrutiny."
      };

      setIsSubmitting(false);
      setIsSuccess(true);
      onSubmitted(newRec);

      setTimeout(() => {
        setIsSuccess(false);
        resetForm();
        onClose();
      }, 1400);
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recommend Local Development Work (MPLADS)" maxWidth="720px">
      {isSuccess ? (
        <div style={{ padding: "32px 16px", textAlign: "center" }}>
          <CheckCircle2 size={48} color="var(--status-success-text)" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "6px" }}>
            Recommendation Successfully Submitted
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: "460px", margin: "0 auto" }}>
            The proposal has been transmitted to District Authority ({district}) for technical verification and sanction processing.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          
          <div style={{ padding: "10px 12px", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", fontSize: "0.78rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
              <span>Proposing MP: <strong style={{ color: "var(--text-main)" }}>{mpName}</strong></span>
              <span>Constituency: <strong style={{ color: "var(--text-main)" }}>{constituency} ({constituencyCode})</strong></span>
            </div>
          </div>

          {/* Citizen Evidence Banner if adopted */}
          {initialCitizenIssue && (
            <div style={{ background: "rgba(5, 150, 105, 0.08)", border: "1px solid rgba(5, 150, 105, 0.3)", borderRadius: "6px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Sparkles size={18} color="#059669" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: "0.78rem", color: "var(--text-main)" }}>
                <strong>Adopting Citizen Proposal #{initialCitizenIssue.id}</strong>
                {initialCitizenIssue.photos && initialCitizenIssue.photos.length > 0 && (
                  <span style={{ color: "#059669", marginLeft: "6px", fontWeight: 600 }}>
                    &bull; {initialCitizenIssue.photos.length} Site Evidence Photo(s) Attached
                  </span>
                )}
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Submitted by {initialCitizenIssue.submittedBy || "Resident Citizen"} from {initialCitizenIssue.locationName}
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: "8px 12px", background: "var(--status-danger-bg)", border: "1px solid var(--status-danger-border)", color: "var(--status-danger-text)", borderRadius: "var(--radius-xs)", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="gov-form-group">
            <label className="gov-label">
              Work Title <span className="gov-label-required">*</span>
            </label>
            <input
              type="text"
              className="gov-input"
              placeholder="e.g. Construction of Community Water Purification Plant & Distribution Pipeline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="gov-form-group">
              <label className="gov-label">
                Development Category <span className="gov-label-required">*</span>
              </label>
              <select
                className="gov-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as MPRecommendation["category"])}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="gov-form-group">
              <label className="gov-label">
                Estimated Outlay (₹ in Crores) <span className="gov-label-required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.05"
                max="5.00"
                className="gov-input"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                required
              />
              <span className="gov-form-hint">Cap: ₹5.00 Cr total annual entitlement</span>
            </div>
          </div>

          <div className="gov-form-group">
            <label className="gov-label">
              Specific Location / Ward / Village <span className="gov-label-required">*</span>
            </label>
            <input
              type="text"
              className="gov-input"
              placeholder="e.g. Village Shivane, Haveli Taluka, Ward 24"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="gov-form-group">
            <label className="gov-label">
              Public Necessity & Justification <span className="gov-label-required">*</span>
            </label>
            <textarea
              className="gov-textarea"
              rows={3}
              placeholder="Detail how this project fulfills public necessity, social benefit, or constituency demands..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              required
            />
          </div>

          <div className="gov-form-group">
            <label className="gov-label">
              Link Citizen Public Grievance / Proposal (Optional)
            </label>
            <input
              type="text"
              className="gov-input"
              placeholder="e.g. REC-CIT-2024-819"
              value={citizenRequestId}
              onChange={(e) => setCitizenRequestId(e.target.value)}
            />
            <span className="gov-form-hint">If this recommendation addresses a submitted citizen grievance or proposal</span>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <Button variant="secondary" onClick={onClose} type="button" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting} icon={<Plus size={15} />}>
              {isSubmitting ? "Transmitting Recommendation..." : "Submit Recommendation"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default CreateRecommendationModal;
