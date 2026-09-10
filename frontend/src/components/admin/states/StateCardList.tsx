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
      className="hover:bg-slate-50/90 cursor-pointer transition-all border-b border-slate-200 text-sm group"
      style={{ borderBottom: "1px solid #e2e8f0" }}
    >
      {/* Rank */}
      <td style={{ padding: "22px 24px", width: "80px", verticalAlign: "middle" }} className="font-bold text-slate-500">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 text-slate-700 text-xs font-bold transition-colors">
          #{stateData.rank}
        </span>
      </td>

      {/* State Name & MPs */}
      <td style={{ padding: "22px 24px", verticalAlign: "middle" }}>
        <div className="font-semibold text-slate-900 flex items-center gap-2 text-[0.975rem]">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{stateData.state}</span>
        </div>
        <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">{stateData.mpCount} MPs</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">{stateData.districtsCount} Districts</span>
        </div>
      </td>

      {/* Projects */}
      <td style={{ padding: "22px 24px", verticalAlign: "middle" }} className="text-slate-700">
        <div className="font-semibold text-slate-900 text-[0.95rem]">{stateData.projectCount.toLocaleString("en-IN")} Works</div>
        <div className="text-xs text-slate-500 mt-2">
          <span className="text-emerald-600 font-semibold">{stateData.statusCounts.Completed} done</span>
          <span className="text-slate-300 mx-1.5">•</span>
          <span className="text-amber-600 font-semibold">{stateData.statusCounts.InProgress} ongoing</span>
        </div>
      </td>

      {/* Total Sanctioned */}
      <td style={{ padding: "22px 24px", verticalAlign: "middle" }} className="font-semibold text-slate-900" title={`Exact: ₹${stateData.totalAllocated.toLocaleString("en-IN")}`}>
        <div className="text-[0.95rem]">{formatCurrency(stateData.totalAllocated)}</div>
        <div className="text-[11px] text-slate-400 font-normal mt-1.5">Sanctioned Outlay</div>
      </td>

      {/* Total Utilized */}
      <td style={{ padding: "22px 24px", verticalAlign: "middle" }} className="font-semibold text-emerald-700" title={`Exact: ₹${stateData.totalExpenditure.toLocaleString("en-IN")}`}>
        <div className="text-[0.95rem]">{formatCurrency(stateData.totalExpenditure)}</div>
        <div className="text-[11px] text-slate-400 font-normal mt-1.5">Certified Spent</div>
      </td>

      {/* Utilization % */}
      <td style={{ padding: "22px 24px", width: "220px", verticalAlign: "middle" }}>
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="font-bold text-slate-900 text-sm">
            {stateData.utilizationPercentage}%
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getUtilColor(
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
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${stateData.utilizationPercentage >= 70
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
      <td style={{ padding: "22px 24px", textAlign: "right", verticalAlign: "middle" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectState(stateData.state);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 hover:text-blue-800 transition-all border border-blue-200/60 shadow-xs cursor-pointer"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
};

export const StateCardList = React.memo(StateCardListComponent);
export default StateCardList;
