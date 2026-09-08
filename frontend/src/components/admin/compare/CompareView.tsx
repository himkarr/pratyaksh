import React, { useState } from "react";
import {
  Users,
  Plus,
  X,
  TrendingUp,
  Award,
  CheckCircle2,
  Building,
  BarChart2,
  ArrowRight,
  ShieldCheck,
  LayoutGrid,
  Table as TableIcon,
  HelpCircle,
} from "lucide-react";
import { MPSummary } from "../../../api/adminDataService";

interface CompareViewProps {
  mps: MPSummary[];
  onSelectMP: (mp: MPSummary) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({ mps, onSelectMP }) => {
  // Pre-select 2 top MPs by default
  const [selectedMPIds, setSelectedMPIds] = useState<string[]>(() => {
    return mps.slice(0, 2).map((m) => m.mpId);
  });
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const selectedMPs = selectedMPIds
    .map((id) => mps.find((m) => m.mpId === id))
    .filter(Boolean) as MPSummary[];

  const addMP = (mpId: string) => {
    if (selectedMPIds.length < 4 && !selectedMPIds.includes(mpId)) {
      setSelectedMPIds([...selectedMPIds, mpId]);
    }
    setSelectorOpen(false);
  };

  const removeMP = (mpId: string) => {
    if (selectedMPIds.length > 1) {
      setSelectedMPIds(selectedMPIds.filter((id) => id !== mpId));
    }
  };

  // Available MPs to add
  const availableMPs = mps.filter(
    (m) =>
      !selectedMPIds.includes(m.mpId) &&
      (m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.constituency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.state.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid var(--border-color, #e2e8f0)",
          boxShadow: "var(--shadow-card, 0 2px 8px rgba(0,0,0,0.04))",
          padding: "20px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BarChart2 size={18} />
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#0f172a",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              Compare Members of Parliament
            </h2>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "9999px",
                background: "#f1f5f9",
                color: "#475569",
              }}
            >
              {selectedMPIds.length} of 4 Selected
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
            Side-by-side comparison of budget allocation, actual expenditure, and project delivery
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* View Mode Switcher */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#f1f5f9",
              borderRadius: "8px",
              padding: "3px",
              gap: "2px",
            }}
          >
            <button
              onClick={() => setViewMode("cards")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                background: viewMode === "cards" ? "#ffffff" : "transparent",
                color: viewMode === "cards" ? "#1e40af" : "#64748b",
                boxShadow: viewMode === "cards" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                background: viewMode === "table" ? "#ffffff" : "transparent",
                color: viewMode === "table" ? "#1e40af" : "#64748b",
                boxShadow: viewMode === "table" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              <TableIcon size={13} />
              <span>Matrix Table</span>
            </button>
          </div>

          {selectedMPIds.length < 4 && (
            <button
              onClick={() => setSelectorOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "0.8rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(37,99,235,0.2)",
              }}
            >
              <Plus size={15} />
              <span>Add MP to Compare</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector Modal */}
      {selectorOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
              maxWidth: "460px",
              width: "100%",
              padding: "20px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "12px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <h3 style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                Select Member of Parliament
              </h3>
              <button
                onClick={() => setSelectorOpen(false)}
                style={{
                  padding: "4px",
                  borderRadius: "6px",
                  border: "none",
                  background: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ margin: "12px 0" }}>
              <input
                type="text"
                placeholder="Search by MP name, state, or constituency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.82rem",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                autoFocus
              />
            </div>

            <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
              {availableMPs.slice(0, 25).map((m) => (
                <div
                  key={m.mpId}
                  onClick={() => addMP(m.mpId)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.82rem" }}>{m.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      {m.constituency}, {m.state} ({m.house})
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: "#2563eb", fontSize: "0.78rem" }}>
                    {m.utilizationPercentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: CARDS VIEW */}
      {viewMode === "cards" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              selectedMPs.length === 2
                ? "repeat(auto-fit, minmax(360px, 1fr))"
                : selectedMPs.length === 3
                ? "repeat(auto-fit, minmax(300px, 1fr))"
                : "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {selectedMPs.map((mp) => (
            <div
              key={mp.mpId}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid var(--border-color, #e2e8f0)",
                boxShadow: "var(--shadow-card, 0 2px 8px rgba(0,0,0,0.04))",
                padding: "20px",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Remove button */}
              {selectedMPs.length > 1 && (
                <button
                  onClick={() => removeMP(mp.mpId)}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    padding: "6px",
                    borderRadius: "50%",
                    border: "none",
                    background: "#f1f5f9",
                    color: "#94a3b8",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fee2e2";
                    e.currentTarget.style.color = "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.color = "#94a3b8";
                  }}
                  title="Remove from comparison"
                >
                  <X size={14} />
                </button>
              )}

              <div>
                {/* MP Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", paddingRight: "28px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                      color: "#ffffff",
                      fontWeight: 800,
                      fontSize: "1.1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 2px 6px rgba(37,99,235,0.2)",
                    }}
                  >
                    {mp.name.replace(/^(Shri|Smt\.|Dr\.)\s*/i, "").charAt(0) || "M"}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: "0.95rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontFamily: "Outfit, sans-serif",
                      }}
                      title={mp.name}
                    >
                      {mp.name}
                    </h4>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "1px" }}>
                      {mp.constituency}, {mp.state}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          background: "#f1f5f9",
                          color: "#475569",
                        }}
                      >
                        {mp.house}
                      </span>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "9999px",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          background: "#eff6ff",
                          color: "#1d4ed8",
                        }}
                      >
                        Rank #{mp.rank}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Spending Progress Box - Clear visible track, no misleading underlines */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>Fund Spending</span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        background:
                          mp.utilizationPercentage >= 70
                            ? "#ecfdf5"
                            : mp.utilizationPercentage >= 40
                            ? "#fffbeb"
                            : "#fef2f2",
                        color:
                          mp.utilizationPercentage >= 70
                            ? "#047857"
                            : mp.utilizationPercentage >= 40
                            ? "#b45309"
                            : "#dc2626",
                      }}
                    >
                      {mp.utilizationPercentage}% Spent
                    </span>
                  </div>

                  {/* Fully visible background track */}
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      background: "#e2e8f0",
                      borderRadius: "9999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(4, Math.min(100, mp.utilizationPercentage))}%`,
                        height: "100%",
                        borderRadius: "9999px",
                        background:
                          mp.utilizationPercentage >= 70
                            ? "linear-gradient(90deg, #10b981, #059669)"
                            : mp.utilizationPercentage >= 40
                            ? "linear-gradient(90deg, #f59e0b, #d97706)"
                            : "linear-gradient(90deg, #f43f5e, #e11d48)",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Structured Metrics Table */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "0.78rem",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b" }}>Total Budget Approved</span>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{formatCurrency(mp.totalSanctioned)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b" }}>Actual Money Spent</span>
                    <span style={{ fontWeight: 700, color: "#059669" }}>{formatCurrency(mp.totalUtilized)}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b" }}>Remaining Funds</span>
                    <span style={{ fontWeight: 600, color: "#475569" }}>
                      {formatCurrency(Math.max(0, mp.totalSanctioned - mp.totalUtilized))}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b" }}>Projects Recommended</span>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>{mp.worksRecommendedCount} Works</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b" }}>Projects Finished</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#1d4ed8",
                        background: "#eff6ff",
                        padding: "2px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      {mp.worksCompletedCount} Completed
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: "6px",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Community Focus (SC/ST)</span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        color: "#059669",
                        background: "#ecfdf5",
                        padding: "2px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      <ShieldCheck size={13} />
                      Quota Met
                    </span>
                  </div>
                </div>
              </div>

              {/* View MP Profile Button */}
              <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                <button
                  onClick={() => onSelectMP(mp)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "8px",
                    background: "#f1f5f9",
                    color: "#1e40af",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    border: "1px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#2563eb";
                    e.currentTarget.style.color = "#ffffff";
                    e.currentTarget.style.borderColor = "#2563eb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.color = "#1e40af";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                >
                  <span>View MP Profile</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VIEW MODE 2: SIDE-BY-SIDE MATRIX TABLE */
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid var(--border-color, #e2e8f0)",
            boxShadow: "var(--shadow-card, 0 2px 8px rgba(0,0,0,0.04))",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "16px 20px", fontWeight: 700, color: "#475569", width: "240px" }}>
                    Metric / Indicator
                  </th>
                  {selectedMPs.map((mp) => (
                    <th key={mp.mpId} style={{ padding: "16px 20px", minWidth: "220px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>{mp.name}</div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
                            {mp.constituency}, {mp.state}
                          </div>
                          <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                            <span
                              style={{
                                padding: "1px 6px",
                                borderRadius: "4px",
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                background: "#f1f5f9",
                                color: "#475569",
                              }}
                            >
                              {mp.house}
                            </span>
                            <span
                              style={{
                                padding: "1px 6px",
                                borderRadius: "9999px",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                background: "#eff6ff",
                                color: "#1d4ed8",
                              }}
                            >
                              Rank #{mp.rank}
                            </span>
                          </div>
                        </div>
                        {selectedMPs.length > 1 && (
                          <button
                            onClick={() => removeMP(mp.mpId)}
                            style={{
                              padding: "4px",
                              borderRadius: "4px",
                              border: "none",
                              background: "#f1f5f9",
                              color: "#94a3b8",
                              cursor: "pointer",
                            }}
                            title="Remove"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#475569", background: "#fafbfc" }}>
                    Fund Spending
                  </td>
                  {selectedMPs.map((mp) => (
                    <td key={mp.mpId} style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            flex: 1,
                            height: "8px",
                            background: "#e2e8f0",
                            borderRadius: "9999px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(4, Math.min(100, mp.utilizationPercentage))}%`,
                              height: "100%",
                              borderRadius: "9999px",
                              background:
                                mp.utilizationPercentage >= 70
                                  ? "#10b981"
                                  : mp.utilizationPercentage >= 40
                                  ? "#f59e0b"
                                  : "#ef4444",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            color:
                              mp.utilizationPercentage >= 70
                                ? "#059669"
                                : mp.utilizationPercentage >= 40
                                ? "#d97706"
                                : "#dc2626",
                          }}
                        >
                          {mp.utilizationPercentage}%
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fbfcfd" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#475569", background: "#fafbfc" }}>
                    Total Budget Approved
                  </td>
                  {selectedMPs.map((mp) => (
                    <td key={mp.mpId} style={{ padding: "14px 20px", fontWeight: 700, color: "#0f172a" }}>
                      {formatCurrency(mp.totalSanctioned)}
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#475569", background: "#fafbfc" }}>
                    Actual Money Spent
                  </td>
                  {selectedMPs.map((mp) => (
                    <td key={mp.mpId} style={{ padding: "14px 20px", fontWeight: 700, color: "#059669" }}>
                      {formatCurrency(mp.totalUtilized)}
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fbfcfd" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#475569", background: "#fafbfc" }}>
                    Remaining Funds
                  </td>
                  {selectedMPs.map((mp) => (
                    <td key={mp.mpId} style={{ padding: "14px 20px", fontWeight: 600, color: "#475569" }}>
                      {formatCurrency(Math.max(0, mp.totalSanctioned - mp.totalUtilized))}
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#475569", background: "#fafbfc" }}>
                    Projects Recommended
                  </td>
                  {selectedMPs.map((mp) => (
                    <td key={mp.mpId} style={{ padding: "14px 20px", fontWeight: 700, color: "#1e293b" }}>
                      {mp.worksRecommendedCount} Works
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fbfcfd" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#475569", background: "#fafbfc" }}>
                    Projects Finished
                  </td>
                  {selectedMPs.map((mp) => (
                    <td key={mp.mpId} style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#1d4ed8",
                          background: "#eff6ff",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                        }}
                      >
                        {mp.worksCompletedCount} Completed
                      </span>
                    </td>
                  ))}
                </tr>

                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#475569", background: "#fafbfc" }}>
                    Community Quota (SC/ST)
                  </td>
                  {selectedMPs.map((mp) => (
                    <td key={mp.mpId} style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          color: "#059669",
                          background: "#ecfdf5",
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        <ShieldCheck size={13} />
                        Quota Met
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#475569", background: "#fafbfc" }}>
                    Action
                  </td>
                  {selectedMPs.map((mp) => (
                    <td key={mp.mpId} style={{ padding: "14px 20px" }}>
                      <button
                        onClick={() => onSelectMP(mp)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          background: "#2563eb",
                          color: "#ffffff",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>View Profile</span>
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareView;
