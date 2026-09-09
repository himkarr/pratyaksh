import React from "react";
import { User, MapPin, TrendingUp, TrendingDown, Minus, ArrowRight, ShieldCheck } from "lucide-react";
import { MPSummary } from "../../../api/adminDataService";

interface MPCardProps {
  mp: MPSummary;
  onSelectMP: (mp: MPSummary) => void;
}

const MPCardComponent: React.FC<MPCardProps> = ({ mp, onSelectMP }) => {
  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const getUtilizationClass = (pct: number) => {
    if (pct >= 70) return "high";
    if (pct >= 40) return "medium";
    return "low";
  };

  const utilClass = getUtilizationClass(mp.utilizationPercentage);

  return (
    <div
      onClick={() => onSelectMP(mp)}
      className="mp-card cursor-pointer"
      role="button"
      tabIndex={0}
    >
      <div className="mp-card-header">
        <div className="mp-info">
          <div className="mp-avatar">
            <User size={26} />
          </div>
          <div className="mp-details">
            <h3 className="mp-name" title={mp.name}>
              {mp.name}
            </h3>
            <div className="mp-constituency">
              <MapPin size={13} style={{ display: "inline-block", marginRight: "4px" }} />
              <span title={`${mp.constituency}, ${mp.state}`}>
                {mp.constituency}, {mp.state}
              </span>
            </div>
            <div className="mp-party-info" style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
              <span className="house-badge">{mp.house}</span>
              {mp.party && (
                <span className="house-badge" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                  {mp.party}
                </span>
              )}
            </div>
          </div>
        </div>

        {mp.rank > 0 && (
          <div className="mp-rank">
            <span className="rank-number">#{mp.rank}</span>
          </div>
        )}
      </div>

      <div className="mp-stats">
        <div className="stat-row">
          <div className="stat-item">
            <span className="stat-label">Allocated</span>
            <span className="stat-value">{formatCurrency(mp.totalSanctioned)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Utilized</span>
            <span className="stat-value" style={{ color: "#059669" }}>
              {formatCurrency(mp.totalUtilized)}
            </span>
          </div>
        </div>

        <div className="utilization-section">
          <div className="utilization-header">
            <span className="utilization-label">Fund Utilization</span>
            <span className={`utilization-value utilization-${utilClass}`}>
              {mp.utilizationPercentage >= 70 ? (
                <TrendingUp size={14} style={{ display: "inline-block", marginRight: "3px" }} />
              ) : mp.utilizationPercentage >= 40 ? (
                <Minus size={14} style={{ display: "inline-block", marginRight: "3px" }} />
              ) : (
                <TrendingDown size={14} style={{ display: "inline-block", marginRight: "3px" }} />
              )}
              {mp.utilizationPercentage}%
            </span>
          </div>
          <div className="utilization-bar">
            <div
              className={`utilization-fill utilization-${utilClass}`}
              style={{ width: `${Math.min(100, mp.utilizationPercentage)}%` }}
            />
          </div>
        </div>

        <div className="works-section" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "10px" }}>
          <div>
            <strong>{mp.worksRecommendedCount}</strong> Works ({mp.worksCompletedCount} Completed)
          </div>
          {mp.isCompliant && (
            <div style={{ color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
              <ShieldCheck size={14} /> SC/ST Quota Met
            </div>
          )}
        </div>
      </div>

      <div className="mp-card-footer" style={{ borderTop: "1px solid var(--border-color)", marginTop: "12px", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="view-details" style={{ color: "var(--primary-600)", fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
          View Parliamentary Dossier <ArrowRight size={14} />
        </span>
      </div>
    </div>
  );
};

export const MPCard = React.memo(MPCardComponent);
export default MPCard;
