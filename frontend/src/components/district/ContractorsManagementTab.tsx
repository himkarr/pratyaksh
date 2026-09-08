import React, { useState, useEffect } from "react";
import { 
  Building2, 
  UserCheck, 
  Search, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  ShieldCheck,
  Star,
  Phone,
  Mail,
  MapPin,
  X
} from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { districtContractorSync, VendorDetails } from "../../api/districtContractorSync";
import { EvidenceSubmissionRecord } from "../../data/contractorData";
import { Button } from "../ui/Button";

interface ContractorsManagementTabProps {
  works: WorkItem[];
  onSelectWork: (work: WorkItem) => void;
  onUpdateWorks: (updatedWorks: WorkItem[]) => void;
}

export const ContractorsManagementTab: React.FC<ContractorsManagementTabProps> = ({
  works,
  onSelectWork,
  onUpdateWorks
}) => {
  const [vendors, setVendors] = useState<VendorDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>("all");

  // Assignment Modal
  const [assigningWork, setAssigningWork] = useState<WorkItem | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [targetDate, setTargetDate] = useState<string>("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setVendors(districtContractorSync.getRegisteredVendors());
  }, []);

  const handleOpenAssignModal = (work: WorkItem) => {
    setAssigningWork(work);
    const existingVendor = vendors.find(v => v.firmName === work.contractor);
    setSelectedVendorId(existingVendor ? existingVendor.vendorId : vendors[0]?.vendorId || "");
    setStartDate(work.dateSanctioned || "2024-04-01");
    setTargetDate(work.targetCompletion || "2025-03-31");
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningWork || !selectedVendorId) return;

    try {
      const { work: updatedWork } = await districtContractorSync.assignContractorToWork(
        assigningWork.id,
        selectedVendorId,
        startDate,
        targetDate
      );

      const newWorks = works.map(w => w.id === updatedWork.id ? updatedWork : w);
      onUpdateWorks(newWorks);

      setNotice(`Empanelled Contractor assigned successfully to Work #${assigningWork.id}. Notifications transmitted.`);
      setAssigningWork(null);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      console.error("Error assigning contractor:", err);
    }
  };

  const filteredVendors = vendors.filter(v => {
    const q = searchQuery.toLowerCase();
    return v.firmName.toLowerCase().includes(q) || v.vendorId.toLowerCase().includes(q) || v.contactPerson.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast Notice */}
      {notice && (
        <div style={{ 
          background: "#ecfdf5", 
          color: "#065f46", 
          padding: "12px 16px", 
          borderRadius: "8px", 
          border: "1px solid #a7f3d0",
          fontSize: "0.85rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {/* 1. Empanelled Contractor Directory Header */}
      <div className="gov-card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--border-light)", paddingBottom: "14px", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "1.10rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Building2 size={18} />
              Empanelled Contractor Directory & Vendor Registry ({vendors.length})
            </h3>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Registered Class A, B & C contractors assigned to MPLADS public works execution
            </div>
          </div>

          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: "10px" }} />
            <input
              type="text"
              placeholder="Search vendor name, ID, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "240px",
                padding: "7px 12px 7px 30px",
                borderRadius: "6px",
                border: "1px solid var(--border-main)",
                fontSize: "0.80rem"
              }}
            />
          </div>
        </div>

        {/* Vendors Card Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {filteredVendors.map((v) => (
            <div 
              key={v.vendorId} 
              style={{ 
                background: "var(--bg-surface-subtle)", 
                border: "1px solid var(--border-main)", 
                borderRadius: "8px", 
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-main)" }}>{v.firmName}</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--gov-primary)", fontWeight: 700, fontFamily: "monospace" }}>
                    ID: {v.vendorId}
                  </div>
                </div>
                <span className="gov-badge gov-badge-info" style={{ fontSize: "0.68rem" }}>
                  {v.registrationClass}
                </span>
              </div>

              <div style={{ fontSize: "0.76rem", color: "var(--text-body)", display: "flex", flexDirection: "column", gap: "3px" }}>
                <div><strong>Nodal Contact:</strong> {v.contactPerson}</div>
                <div style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span><Phone size={10} style={{ display: "inline", marginRight: "3px" }} />{v.phone}</span>
                  <span><Mail size={10} style={{ display: "inline", marginRight: "3px" }} />{v.email}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed var(--border-main)", paddingTop: "8px", marginTop: "4px", fontSize: "0.74rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#d97706", fontWeight: 700 }}>
                  <Star size={12} fill="#d97706" />
                  <span>{v.performanceRating} / 5.0 Rating</span>
                </div>
                <div style={{ color: "var(--text-muted)" }}>
                  Active Works: <strong style={{ color: "var(--gov-primary)" }}>{v.activeWorksCount}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. District Works & Contractor Assignment Table */}
      <div className="gov-card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <UserCheck size={18} />
              Works-to-Contractor Assignments & Schedule Status ({works.length})
            </h3>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Assign registered vendors and inspect stage monitoring evidence submissions
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="gov-table" style={{ width: "100%", fontSize: "0.80rem" }}>
            <thead>
              <tr>
                <th>Work ID & Category</th>
                <th>Project Title & Location</th>
                <th>Assigned Contractor</th>
                <th>Official Dates</th>
                <th>Physical %</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {works.map((w) => {
                const vendorObj = vendors.find(v => v.firmName === w.contractor);
                return (
                  <tr key={w.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: "var(--gov-primary)", fontFamily: "monospace" }}>{w.id}</div>
                      <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.68rem" }}>
                        {w.sectorName || w.category || "Public Infra"}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--text-main)", maxWidth: "260px" }}>{w.title}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={10} />
                        <span>{w.district}, {w.state} ({w.constituency})</span>
                      </div>
                    </td>
                    <td>
                      {w.contractor ? (
                        <div>
                          <div style={{ fontWeight: 800, color: "var(--text-main)" }}>{w.contractor}</div>
                          {vendorObj && (
                            <div style={{ fontSize: "0.70rem", color: "#0284c7", fontWeight: 700 }}>
                              {vendorObj.vendorId} • {vendorObj.registrationClass}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="gov-badge gov-badge-warning" style={{ fontSize: "0.70rem" }}>
                          Unassigned Vendor
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: "0.74rem" }}>
                        <div><strong>Start:</strong> {w.dateSanctioned || "Not set"}</div>
                        <div><strong>Target:</strong> {w.targetCompletion || "Not set"}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`gov-badge ${
                        (w.physicalProgress || 0) >= 100 ? "gov-badge-success" :
                        (w.physicalProgress || 0) > 0 ? "gov-badge-info" : "gov-badge-neutral"
                      }`} style={{ fontWeight: 800 }}>
                        {w.physicalProgress || 0}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="gov-btn gov-btn-secondary"
                          onClick={() => handleOpenAssignModal(w)}
                          style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                        >
                          {w.contractor ? "Reassign" : "Assign Contractor"}
                        </button>

                        <button
                          type="button"
                          className="gov-btn gov-btn-primary"
                          onClick={() => onSelectWork(w)}
                          style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                        >
                          Inspect Dossier
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contractor Assignment Modal */}
      {assigningWork && (
        <div className="gov-modal-backdrop" onClick={() => setAssigningWork(null)}>
          <div className="gov-modal-content" style={{ maxWidth: "540px", padding: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border-light)", paddingBottom: "10px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
                Assign Empanelled Contractor: #{assigningWork.id}
              </h3>
              <button type="button" onClick={() => setAssigningWork(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "var(--bg-surface-subtle)", padding: "10px 12px", borderRadius: "6px", fontSize: "0.80rem" }}>
                <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{assigningWork.title}</div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>District: {assigningWork.district} • Sanctioned Amt: ₹{assigningWork.sanctionedAmt} Cr</div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px" }}>
                  Select Empanelled Vendor:
                </label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.85rem" }}
                >
                  {vendors.map(v => (
                    <option key={v.vendorId} value={v.vendorId}>
                      {v.firmName} ({v.vendorId} • {v.registrationClass})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "4px" }}>
                    Official Start Date:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.82rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, marginBottom: "4px" }}>
                    Expected Completion Date:
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    required
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid var(--border-main)", fontSize: "0.82rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                <button type="button" className="gov-btn gov-btn-secondary" onClick={() => setAssigningWork(null)}>
                  Cancel
                </button>
                <button type="submit" className="gov-btn gov-btn-primary">
                  Transmit Official Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
