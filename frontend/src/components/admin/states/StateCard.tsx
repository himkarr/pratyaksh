import React from "react";
import { Users, TrendingUp, CheckCircle2, MapPin, ArrowRight, Clock, AlertTriangle, Layers, Building2 } from "lucide-react";
import { StateSummary } from "../../../api/adminDataService";

interface StateCardProps {
  stateData: StateSummary;
  onSelectState: (stateName: string) => void;
}

const StateCardComponent: React.FC<StateCardProps> = ({ stateData, onSelectState }) => {
  const formatPreciseCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const unspentBalance = Math.max(0, stateData.totalAllocated - stateData.totalExpenditure);
  const completionRate =
    stateData.projectCount > 0
      ? Math.round((stateData.statusCounts.Completed / stateData.projectCount) * 100)
      : 0;

  return (
    <div
      onClick={() => onSelectState(stateData.state)}
      className="state-card cursor-pointer"
      role="button"
      tabIndex={0}
      style={{
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        minHeight: "260px",
      }}
    >
      {/* Header: State Name, Rank, MPs & Districts */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {stateData.state}
              </h3>
              {stateData.rank > 0 && (
                <span style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  border: "1px solid #bfdbfe",
                }}>
                  Rank #{stateData.rank}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px", fontSize: "0.78rem", color: "#64748b" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Users size={13} color="#475569" />
                <b>{stateData.mpCount}</b> MPs
              </span>
              <span>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={13} color="#475569" />
                <b>{stateData.districtsCount || 1}</b> Districts
              </span>
            </div>
          </div>

          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "#f0fdf4",
            border: "1px solid #dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#15803d",
            flexShrink: 0
          }}>
            <Building2 size={18} />
          </div>
        </div>

        {/* 3-Column Financial Breakdown with precise 2-decimal display and exact tooltips */}
        <div style={{
          background: "#f8fafc",
          borderRadius: "10px",
          padding: "10px 12px",
          border: "1px solid #e2e8f0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          marginBottom: "14px",
        }}>
          <div>
            <div style={{ fontSize: "0.70rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
              Allocated
            </div>
            <div
              style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1e293b", marginTop: "2px" }}
              title={`Full Outlay: ₹${stateData.totalAllocated.toLocaleString("en-IN")}`}
            >
              {formatPreciseCurrency(stateData.totalAllocated)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.70rem", color: "#059669", fontWeight: 600, textTransform: "uppercase" }}>
              Spent
            </div>
            <div
              style={{ fontSize: "0.92rem", fontWeight: 800, color: "#047857", marginTop: "2px" }}
              title={`Full Expenditure: ₹${stateData.totalExpenditure.toLocaleString("en-IN")}`}
            >
              {formatPreciseCurrency(stateData.totalExpenditure)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.70rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
              Unspent
            </div>
            <div
              style={{ fontSize: "0.92rem", fontWeight: 800, color: "#b45309", marginTop: "2px" }}
              title={`Remaining Balance: ₹${unspentBalance.toLocaleString("en-IN")}`}
            >
              {formatPreciseCurrency(unspentBalance)}
            </div>
          </div>
        </div>

        {/* Utilization Progress Bar */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px", fontSize: "0.78rem" }}>
            <span style={{ color: "#475569", fontWeight: 600 }}>Fund Utilization</span>
            <span style={{
              fontWeight: 800,
              color: stateData.utilizationPercentage >= 70 ? "#047857" : stateData.utilizationPercentage >= 40 ? "#b45309" : "#be123c",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <TrendingUp size={13} />
              {stateData.utilizationPercentage}%
            </span>
          </div>
          <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: "9999px",
                width: `${Math.min(100, stateData.utilizationPercentage)}%`,
                background: stateData.utilizationPercentage >= 70 ? "#10b981" : stateData.utilizationPercentage >= 40 ? "#f59e0b" : "#f43f5e",
                transition: "width 0.4s ease"
              }}
            />
          </div>
        </div>

        {/* Works Status Breakdown Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
          <div style={{
            fontSize: "0.72rem",
            padding: "3px 8px",
            borderRadius: "6px",
            background: "#f1f5f9",
            color: "#334155",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            <Layers size={11} />
            <span>{stateData.projectCount} Works</span>
          </div>

          <div style={{
            fontSize: "0.72rem",
            padding: "3px 8px",
            borderRadius: "6px",
            background: "#ecfdf5",
            color: "#065f46",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            <CheckCircle2 size={11} color="#059669" />
            <span>{stateData.statusCounts.Completed} Done ({completionRate}%)</span>
          </div>

          {stateData.statusCounts.InProgress > 0 && (
            <div style={{
              fontSize: "0.72rem",
              padding: "3px 8px",
              borderRadius: "6px",
              background: "#eff6ff",
              color: "#1e40af",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <Clock size={11} color="#2563eb" />
              <span>{stateData.statusCounts.InProgress} Ongoing</span>
            </div>
          )}

          {stateData.statusCounts.Delayed > 0 && (
            <div style={{
              fontSize: "0.72rem",
              padding: "3px 8px",
              borderRadius: "6px",
              background: "#fff1f2",
              color: "#9f1239",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <AlertTriangle size={11} color="#e11d48" />
              <span>{stateData.statusCounts.Delayed} Delayed</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer link */}
      <div style={{
        borderTop: "1px solid #f1f5f9",
        paddingTop: "10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "0.80rem",
        fontWeight: 700,
        color: "#2563eb",
      }}>
        <span>Explore State Dossier</span>
        <ArrowRight size={14} />
      </div>
    </div>
  );
};

export const StateCard = React.memo(StateCardComponent);
export default StateCard;
