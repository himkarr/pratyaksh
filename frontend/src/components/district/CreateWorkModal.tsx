import React, { useState } from "react";
import { 
  Building2, 
  X, 
  Calendar, 
  IndianRupee, 
  UserCheck, 
  FileText, 
  CheckCircle2, 
  MapPin, 
  Layers 
} from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { districtContractorSync, VendorDetails } from "../../api/districtContractorSync";

interface CreateWorkModalProps {
  districtName: string;
  stateName: string;
  onClose: () => void;
  onWorkCreated: (newWork: WorkItem) => void;
}

export const CreateWorkModal: React.FC<CreateWorkModalProps> = ({
  districtName,
  stateName,
  onClose,
  onWorkCreated
}) => {
  const registeredVendors = districtContractorSync.getRegisteredVendors();

  // Form State
  const [workId, setWorkId] = useState<string>(`WORK-${stateName.slice(0, 2).toUpperCase()}-2024-00${Math.floor(Math.random() * 90 + 10)}`);
  const [title, setTitle] = useState<string>("Construction of Sub-Health Center Building & Allied Infrastructure");
  const [category, setCategory] = useState<"Roads" | "Drinking Water" | "Education" | "Health" | "Community Assets">("Roads");
  const [sanctionedAmt, setSanctionedAmt] = useState<string>("0.25"); // in Cr
  const [constituency, setConstituency] = useState<string>(`${districtName} (Gen-01)`);
  const [mpName, setMpName] = useState<string>("Hon'ble Member of Parliament");
  const [selectedVendorId, setSelectedVendorId] = useState<string>(registeredVendors[0]?.vendorId || "");
  const [startDate, setStartDate] = useState<string>("2024-04-01");
  const [targetDate, setTargetDate] = useState<string>("2025-03-31");
  const [justification, setJustification] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedVendorId) {
      setErrorMsg("Please provide project title and select an empanelled contractor.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const vendorObj = registeredVendors.find(v => v.vendorId === selectedVendorId);

      const newWorkItem: WorkItem = {
        id: workId,
        title: title.trim(),
        category,
        sectorName: category,
        house: "Lok Sabha",
        constituency_code: "PC-01",
        state: stateName,
        district: districtName,
        constituency,
        mpName,
        sanctionedAmt: parseFloat(sanctionedAmt) || 0.25,
        recommendedAmt: parseFloat(sanctionedAmt) || 0.25,
        expenditureAmt: 0,
        physicalProgress: 0,
        financialProgress: 0,
        status: "Sanctioned",
        dateSanctioned: startDate,
        targetCompletion: targetDate,
        agency: "DRDA / Executive Engineer",
        contractor: vendorObj ? vendorObj.firmName : "Empanelled Vendor",
        justification: justification.trim() || "Sanctioned under statutory MPLADS annual development allocation.",
        attachments: [],
        reviews: [],
        rating: 4.5,
        reviewsCount: 0
      };

      // Assign contractor and generate 4-5 stage monitoring schedule in sync service
      await districtContractorSync.assignContractorToWork(
        newWorkItem.id,
        selectedVendorId,
        startDate,
        targetDate,
        "District Magistrate & Collector",
        newWorkItem
      );

      onWorkCreated(newWorkItem);
      onClose();
    } catch (err: any) {
      console.error("Error creating new work order:", err);
      setErrorMsg(err.message || "Failed to create work order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gov-modal-backdrop" onClick={onClose}>
      <div 
        className="gov-modal-content" 
        style={{ 
          maxWidth: "680px", 
          padding: "0", 
          borderRadius: "10px", 
          overflow: "hidden",
          border: "1px solid var(--border-dark)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div style={{
          background: "var(--gov-header)",
          color: "var(--text-white)",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.12)", padding: "8px", borderRadius: "6px" }}>
              <Building2 size={22} color="#93c5fd" />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                Issue Administrative Sanction & Work Order
              </h3>
              <div style={{ fontSize: "0.74rem", color: "#cbd5e1" }}>
                Office of District Magistrate • {districtName}, {stateName}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", background: "var(--bg-surface)" }}>
          
          {errorMsg && (
            <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px 14px", borderRadius: "6px", fontSize: "0.80rem", border: "1px solid #fecaca" }}>
              {errorMsg}
            </div>
          )}

          {/* Work ID & Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                Work ID (Statutory Ref):
              </label>
              <input
                type="text"
                value={workId}
                onChange={(e) => setWorkId(e.target.value)}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.84rem", fontFamily: "monospace", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                Sector / Development Category:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.84rem" }}
              >
                <option value="Roads">Roads & Connectivity</option>
                <option value="Drinking Water">Drinking Water & Sanitation</option>
                <option value="Education">Education & School Infra</option>
                <option value="Health">Healthcare & Medical Assets</option>
                <option value="Community Assets">Community Assets & Halls</option>
              </select>
            </div>
          </div>

          {/* Project Title */}
          <div>
            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
              Project Title / Official Work Description:
            </label>
            <textarea
              rows={2}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Construction of Concrete Rural Link Road connecting Village Center to Main Highway"
              required
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.84rem" }}
            />
          </div>

          {/* Sanction Amount & Constituency */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                Sanction Outlay (₹ Cr):
              </label>
              <input
                type="number"
                step="0.01"
                value={sanctionedAmt}
                onChange={(e) => setSanctionedAmt(e.target.value)}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.84rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                Constituency:
              </label>
              <input
                type="text"
                value={constituency}
                onChange={(e) => setConstituency(e.target.value)}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.84rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                Hon'ble MP Name:
              </label>
              <input
                type="text"
                value={mpName}
                onChange={(e) => setMpName(e.target.value)}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.84rem" }}
              />
            </div>
          </div>

          {/* Empanelled Contractor Assignment */}
          <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "6px", border: "1px solid var(--border-light)" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <UserCheck size={16} />
              Assign Empanelled Contractor / Vendor:
            </label>
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              required
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.85rem", fontWeight: 700, background: "#ffffff" }}
            >
              {registeredVendors.map((v) => (
                <option key={v.vendorId} value={v.vendorId}>
                  {v.firmName} ({v.vendorId} • {v.registrationClass} • Rating: {v.performanceRating}★)
                </option>
              ))}
            </select>
          </div>

          {/* Official Schedule Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                Official Project Start Date:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.84rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                Official Target Completion Date:
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.84rem" }}
              />
            </div>
          </div>

          {/* Public Justification */}
          <div>
            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
              Administrative Scrutiny Notes & Public Justification:
            </label>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Sanctioned based on MP recommendation & DRDA technical feasibility report..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.82rem" }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px", borderTop: "1px solid var(--border-light)", paddingTop: "14px" }}>
            <button
              type="button"
              className="gov-btn gov-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="gov-btn gov-btn-primary"
              disabled={isSubmitting}
              style={{ padding: "8px 18px", fontWeight: 700 }}
            >
              {isSubmitting ? "Transmitting Sanction Order..." : "Issue Official Work Order & Assign Contractor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
