import React from "react";
import { Users, ArrowRight, Building2 } from "lucide-react";
import { StateSummary } from "../../../api/adminDataService";

interface StateCardListProps {
  stateData: StateSummary;
  onSelectState: (stateName: string) => void;
}

const StateCardListComponent: React.FC<StateCardListProps> = ({ stateData, onSelectState }) => {
  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const getUtilColor = (pct: number) => {
    if (pct >= 70) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (pct >= 40) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  return (
    <tr
      onClick={() => onSelectState(stateData.state)}
      className="hover:bg-blue-50/40 cursor-pointer transition-colors border-b border-slate-200 text-sm"
    >
      {/* Rank */}
      <td className="py-3.5 px-4 font-bold text-slate-500 w-16">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs">
          #{stateData.rank}
        </span>
      </td>

      {/* State Name & MPs */}
      <td className="py-3.5 px-4">
        <div className="font-semibold text-slate-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
          {stateData.state}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
          <Users className="w-3 h-3" />
          {stateData.mpCount} MPs • {stateData.districtsCount} Districts
        </div>
      </td>

      {/* Projects */}
      <td className="py-3.5 px-4 text-slate-700">
        <span className="font-semibold">{stateData.projectCount}</span> Works
        <div className="text-[11px] text-slate-400">
          {stateData.statusCounts.Completed} completed
        </div>
      </td>

      {/* Total Sanctioned */}
      <td className="py-3.5 px-4 font-medium text-slate-800">
        {formatCurrency(stateData.totalAllocated)}
      </td>

      {/* Total Utilized */}
      <td className="py-3.5 px-4 font-medium text-emerald-700">
        {formatCurrency(stateData.totalExpenditure)}
      </td>

      {/* Utilization % */}
      <td className="py-3.5 px-4 w-44">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-slate-700">
            {stateData.utilizationPercentage}%
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getUtilColor(
              stateData.utilizationPercentage
            )}`}
          >
            {stateData.utilizationPercentage >= 70
              ? "High"
              : stateData.utilizationPercentage >= 40
              ? "Moderate"
              : "Low"}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              stateData.utilizationPercentage >= 70
                ? "bg-emerald-500"
                : stateData.utilizationPercentage >= 40
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
            style={{ width: `${Math.min(100, stateData.utilizationPercentage)}%` }}
          />
        </div>
      </td>

      {/* Action */}
      <td className="py-3.5 px-4 text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectState(stateData.state);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
};

export const StateCardList = React.memo(StateCardListComponent);
export default StateCardList;
