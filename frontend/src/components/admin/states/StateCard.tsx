import React from "react";
import { Users, TrendingUp, CheckCircle2, ArrowRight, Building } from "lucide-react";
import { StateSummary } from "../../../api/adminDataService";

interface StateCardProps {
  stateData: StateSummary;
  onSelectState: (stateName: string) => void;
}

export const StateCard: React.FC<StateCardProps> = ({ stateData, onSelectState }) => {
  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) {
      return `₹${(amt / 10000000).toFixed(2)} Cr`;
    }
    if (amt >= 100000) {
      return `₹${(amt / 100000).toFixed(2)} L`;
    }
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const getUtilClass = (pct: number) => {
    if (pct >= 70) return "high";
    if (pct >= 40) return "medium";
    return "low";
  };

  const utilClass = getUtilClass(stateData.utilizationPercentage);

  return (
    <div
      onClick={() => onSelectState(stateData.state)}
      className="civic-card p-5 cursor-pointer flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "0.875rem",
      }}
    >
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600 shrink-0" />
              {stateData.state}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {stateData.mpCount} MPs
              </span>
              <span>•</span>
              <span>{stateData.districtsCount} Districts</span>
              <span>•</span>
              <span>{stateData.projectCount} Works</span>
            </div>
          </div>

          <div
            className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
            style={{
              background: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
          >
            Rank #{stateData.rank}
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-2 gap-3 py-3 my-2 border-t border-b border-slate-100">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Total Sanctioned
            </div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">
              {formatCurrency(stateData.totalAllocated)}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Total Utilized
            </div>
            <div className="text-sm font-bold text-emerald-700 mt-0.5">
              {formatCurrency(stateData.totalExpenditure)}
            </div>
          </div>
        </div>

        {/* Progress Bar & Rate */}
        <div className="mt-3">
          <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
            <span className="text-slate-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Fund Utilization Rate
            </span>
            <span
              className={`font-bold ${
                utilClass === "high"
                  ? "text-emerald-700"
                  : utilClass === "medium"
                  ? "text-amber-700"
                  : "text-rose-700"
              }`}
            >
              {stateData.utilizationPercentage}%
            </span>
          </div>

          <div className="civic-progress-track">
            <div
              className={`civic-progress-fill ${utilClass}`}
              style={{ width: `${Math.min(100, Math.max(0, stateData.utilizationPercentage))}%` }}
            />
          </div>
        </div>

        {/* Project Status Mini Badges */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
            <CheckCircle2 className="w-3 h-3" /> {stateData.statusCounts.Completed} Done
          </span>
          <span>•</span>
          <span className="text-blue-600 font-medium">
            {stateData.statusCounts.InProgress} In Progress
          </span>
          <span>•</span>
          <span className="text-slate-500">
            {stateData.statusCounts.Sanctioned + stateData.statusCounts.Proposed} Pending
          </span>
        </div>
      </div>

      {/* Footer link */}
      <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group">
        <span>Explore State Dossier</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
};
export default StateCard;
