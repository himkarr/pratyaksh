import React from "react";
import { Users, TrendingUp, CheckCircle2, MapPin, ArrowRight } from "lucide-react";
import { StateSummary } from "../../../api/adminDataService";

interface StateCardProps {
  stateData: StateSummary;
  onSelectState: (stateName: string) => void;
}

export const StateCard: React.FC<StateCardProps> = ({ stateData, onSelectState }) => {
  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const getUtilizationClass = (pct: number) => {
    if (pct >= 80) return "high";
    if (pct >= 50) return "medium";
    return "low";
  };

  const utilClass = getUtilizationClass(stateData.utilizationPercentage);
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
    >
      <div className="state-card-header">
        <div className="state-info">
          <h3 className="state-name" title={stateData.state}>
            {stateData.state}
          </h3>
          <div className="state-meta">
            <span className="state-mps">
              <Users size={14} style={{ display: "inline-block", marginRight: "4px" }} />
              {stateData.mpCount} MPs
            </span>
            {stateData.rank > 0 && (
              <span className="state-rank">
                Rank #{stateData.rank}
              </span>
            )}
          </div>
        </div>
        <div className="state-icon">
          <MapPin size={22} />
        </div>
      </div>

      <div className="state-metrics">
        <div className="metric-row">
          <div className="metric">
            <span className="metric-label">Allocated</span>
            <span className="metric-value">{formatCurrency(stateData.totalAllocated)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Recorded Expenditure</span>
            <span className="metric-value">{formatCurrency(stateData.totalExpenditure)}</span>
          </div>
        </div>

        <div className="utilization-section">
          <div className="utilization-header">
            <span className="utilization-label">Fund Utilization</span>
            <span className={`utilization-value utilization-${utilClass}`}>
              <TrendingUp size={13} style={{ display: "inline-block", marginRight: "3px" }} />
              {stateData.utilizationPercentage}%
            </span>
          </div>
          <div className="utilization-bar">
            <div
              className={`utilization-fill utilization-${utilClass}`}
              style={{ width: `${Math.min(100, stateData.utilizationPercentage)}%` }}
            />
          </div>
        </div>

        <div className="works-section">
          <div className="works-stat">
            <CheckCircle2 size={18} className="works-icon" />
            <div className="works-info">
              <span className="works-value">{stateData.statusCounts.Completed}</span>
              <span className="works-label">Works Completed</span>
            </div>
          </div>
          <div className="completion-rate">
            <span className="rate-label">Completion</span>
            <span className="rate-value">{completionRate}%</span>
          </div>
        </div>
      </div>

      <div className="state-card-footer">
        <span className="view-details">
          View Details <ArrowRight size={14} style={{ display: "inline-block", marginLeft: "4px" }} />
        </span>
      </div>
    </div>
  );
};
export default StateCard;
