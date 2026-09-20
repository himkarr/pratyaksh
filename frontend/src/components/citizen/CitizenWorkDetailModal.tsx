import React, { useState } from "react";
import { 
  X, Landmark, MapPin, Calendar, CheckCircle2, Clock, 
  FileText, ArrowRight, AlertTriangle, Image as ImageIcon,
  IndianRupee, Building, User, ChevronRight, AlertCircle
} from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { useBodyScrollLock } from "../../utils/scrollLock";
import { Button, Badge } from "../ui";

export interface CitizenWorkDetailModalProps {
  work: WorkItem | null;
  onClose: () => void;
  onReportProblem: (work: WorkItem) => void;
}

export const CitizenWorkDetailModal: React.FC<CitizenWorkDetailModalProps> = ({
  work,
  onClose,
  onReportProblem
}) => {
  useBodyScrollLock(!!work);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!work) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <span className="gov-badge gov-badge-success" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>Completed</span>;
      case "Delayed":
        return <span className="gov-badge gov-badge-danger" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>Delayed</span>;
      case "Ongoing":
        return <span className="gov-badge gov-badge-info" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>In Progress</span>;
      case "Sanctioned":
      case "Recommended":
        return <span className="gov-badge gov-badge-warning" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>Sanctioned</span>;
      default:
        return <span className="gov-badge gov-badge-neutral" style={{ padding: "4px 10px", fontSize: "0.78rem" }}>{status}</span>;
    }
  };

  const sanctioned = work.sanctionedAmt || work.recommendedAmt || 0;
  const spent = work.expenditureAmt || 0;
  const remaining = Math.max(0, sanctioned - spent);
  const progress = work.physicalProgress || 0;

  return (
    <div className="gov-modal-backdrop" onClick={onClose}>
      <div
        className="gov-modal-content"
        style={{
          maxWidth: "760px",
          width: "min(760px, 94vw)",
          maxHeight: "min(92vh, 850px)",
          padding: 0,
          borderRadius: "var(--radius-sm)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid var(--border-main)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          boxSizing: "border-box"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            background: "var(--gov-header)",
            color: "var(--text-white)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            flexShrink: 0
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                padding: "8px",
                borderRadius: "var(--radius-xs)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Landmark size={18} color="var(--text-white)" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-white)", margin: 0 }}>
                  Development Work Details
                </h3>
                <span className="gov-badge gov-badge-info" style={{ fontSize: "0.68rem" }}>
                  {work.id}
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#cbd5e1", margin: "2px 0 0 0" }}>
                MPLADS Local Area Development Project
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "var(--text-white)",
              padding: "6px",
              borderRadius: "var(--radius-xs)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          className="gov-modal-body"
          style={{
            padding: "20px",
            background: "var(--bg-surface)",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            overflowY: "auto",
            flex: "1 1 auto",
            minHeight: 0
          }}
        >
          {/* Main Work Title Card */}
          <div
            style={{
              background: "var(--bg-surface-subtle)",
              padding: "16px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-main)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ flex: 1, minWidth: "240px" }}>
                <span className="gov-badge gov-badge-neutral" style={{ marginBottom: "6px" }}>
                  {work.sectorName || work.category || "Community Asset"}
                </span>
                <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--gov-primary)", margin: "4px 0 8px 0", lineHeight: 1.3 }}>
                  {work.title}
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", fontSize: "0.80rem", color: "var(--text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={14} color="var(--gov-accent)" /> 
                    {work.constituency} ({work.district}, {work.state})
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <User size={14} color="var(--text-muted)" /> 
                    Hon'ble MP: <strong>{work.mpName}</strong>
                  </span>
                </div>
              </div>

              <div>{getStatusBadge(work.status)}</div>
            </div>

            {/* Visual Progress Bar */}
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-light)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Physical Work Progress
                </span>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--gov-accent)" }}>
                  {progress}% Completed
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "10px",
                  background: "var(--border-light)",
                  borderRadius: "5px",
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, progress))}%`,
                    height: "100%",
                    background: work.status === "Completed" ? "var(--status-success-text)" : (work.status === "Delayed" ? "var(--status-warning-text)" : "var(--gov-accent)"),
                    borderRadius: "5px",
                    transition: "width 0.4s ease"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Funding Summary (Citizen View) */}
          <div>
            <h5 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Funding & Budget
            </h5>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              <div
                style={{
                  padding: "12px 14px",
                  background: "var(--bg-surface-subtle)",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border-light)"
                }}
              >
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Sanctioned Budget</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
                  ₹{sanctioned.toFixed(2)} Cr
                </div>
                <div style={{ fontSize: "0.70rem", color: "var(--text-muted)" }}>Total approved allocation</div>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  background: "var(--bg-surface-subtle)",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border-light)"
                }}
              >
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Amount Spent</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--status-success-text)", marginTop: "2px" }}>
                  ₹{spent.toFixed(2)} Cr
                </div>
                <div style={{ fontSize: "0.70rem", color: "var(--text-muted)" }}>Disbursed to contractor</div>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  background: "var(--bg-surface-subtle)",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border-light)"
                }}
              >
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Remaining Funds</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)", marginTop: "2px" }}>
                  ₹{remaining.toFixed(2)} Cr
                </div>
                <div style={{ fontSize: "0.70rem", color: "var(--text-muted)" }}>Balance for completion</div>
              </div>
            </div>
          </div>

          {/* Project Details & Timelines */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            <div
              style={{
                padding: "12px 14px",
                background: "var(--bg-surface-subtle)",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--border-light)"
              }}
            >
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
                <Calendar size={13} /> Key Dates
              </div>
              <div style={{ fontSize: "0.80rem", color: "var(--text-body)" }}>
                <div>Date Sanctioned: <strong>{work.dateSanctioned || "2024-03-31"}</strong></div>
                <div style={{ marginTop: "3px" }}>Expected Completion: <strong>{work.targetCompletion || "2025-03-31"}</strong></div>
              </div>
            </div>

            <div
              style={{
                padding: "12px 14px",
                background: "var(--bg-surface-subtle)",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--border-light)"
              }}
            >
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
                <Building size={13} /> Executing Agency
              </div>
              <div style={{ fontSize: "0.80rem", color: "var(--text-body)" }}>
                <div>Agency: <strong>{work.agency || "Public Works Department"}</strong></div>
                {work.contractor && <div style={{ marginTop: "3px" }}>Contractor: <strong>{work.contractor}</strong></div>}
              </div>
            </div>
          </div>

          {/* Description & Public Purpose */}
          {work.justification && (
            <div
              style={{
                padding: "12px 14px",
                background: "var(--status-info-bg)",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--status-info-border)"
              }}
            >
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--status-info-text)", marginBottom: "4px" }}>
                Public Purpose & Community Need
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-body)", margin: 0, lineHeight: 1.45 }}>
                {work.justification}
              </p>
            </div>
          )}

          {/* Site Photos Gallery */}
          {work.attachments && work.attachments.length > 0 && (
            <div>
              <h5 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                <ImageIcon size={14} /> Site Inspection Photographs ({work.attachments.length})
              </h5>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px" }}>
                {work.attachments.map((att) => (
                  <div
                    key={att.id}
                    onClick={() => setSelectedPhoto(att.url)}
                    style={{
                      borderRadius: "6px",
                      overflow: "hidden",
                      border: "1px solid var(--border-main)",
                      cursor: "pointer",
                      position: "relative",
                      height: "85px"
                    }}
                  >
                    <img
                      src={att.url}
                      alt={att.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "rgba(0,0,0,0.65)",
                        color: "#fff",
                        fontSize: "0.65rem",
                        padding: "2px 4px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {att.title || att.stage}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Photo Preview Modal */}
          {selectedPhoto && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: "20px"
              }}
              onClick={() => setSelectedPhoto(null)}
            >
              <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }}>
                <img
                  src={selectedPhoto}
                  alt="Site Evidence"
                  style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}
                />
                <button
                  onClick={() => setSelectedPhoto(null)}
                  style={{
                    position: "absolute",
                    top: "-12px",
                    right: "-12px",
                    background: "#ffffff",
                    color: "#000",
                    border: "none",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold"
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div
          style={{
            padding: "14px 20px",
            background: "var(--bg-surface-subtle)",
            borderTop: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            flexShrink: 0
          }}
        >
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={() => {
              onClose();
              onReportProblem(work);
            }}
            icon={<AlertTriangle size={15} />}
          >
            Report a Problem with this Work
          </Button>

          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CitizenWorkDetailModal;
