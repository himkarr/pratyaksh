import React from "react";
import { Users, TrendingUp, CheckCircle2, ArrowRight, ShieldCheck, Award } from "lucide-react";
import { MPSummary } from "../../../api/adminDataService";

interface MPCardProps {
  mp: MPSummary;
  onSelectMP: (mp: MPSummary) => void;
}

export const MPCard: React.FC<MPCardProps> = ({ mp, onSelectMP }) => {
  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const getEfficiencyTier = (pct: number) => {
    if (pct >= 70) return { label: "High Efficiency", class: "civic-badge-high", color: "high" };
    if (pct >= 40) return { label: "Moderate", class: "civic-badge-medium", color: "medium" };
    return { label: "Low Efficiency", class: "civic-badge-low", color: "low" };
  };

  const tier = getEfficiencyTier(mp.utilizationPercentage);

  return (
    <div
      onClick={() => onSelectMP(mp)}
      className="civic-card p-5 cursor-pointer flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "0.875rem",
      }}
    >
      <div>
        {/* Header with Avatar & Rank */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shrink-0 shadow-sm">
              {mp.name.replace(/^(Shri|Smt\.|Dr\.)\s*/i, "").charAt(0) || "M"}
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-bold text-slate-900 truncate" title={mp.name}>
                {mp.name}
              </h4>
              <div className="text-xs text-slate-500 truncate">
                {mp.constituency}, {mp.state}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                  {mp.house}
                </span>
                {mp.party && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                    {mp.party}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-500" />
              #{mp.rank}
            </span>
          </div>
        </div>

        {/* Efficiency Badge */}
        <div className="my-2.5">
          <span className={`civic-badge ${tier.class}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {tier.label} ({mp.utilizationPercentage}%)
          </span>
        </div>

        {/* Allocation Breakdown */}
        <div className="grid grid-cols-2 gap-2 py-2.5 my-2 border-t border-b border-slate-100 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Sanctioned</span>
            <span className="text-sm font-bold text-slate-800">{formatCurrency(mp.totalSanctioned)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Utilized</span>
            <span className="text-sm font-bold text-emerald-700">{formatCurrency(mp.totalUtilized)}</span>
          </div>
        </div>

        {/* Utilization Progress Meter */}
        <div className="mt-2">
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-slate-500">Fund Utilization</span>
            <span className="font-bold text-slate-800">{mp.utilizationPercentage}%</span>
          </div>
          <div className="civic-progress-track">
            <div
              className={`civic-progress-fill ${tier.color}`}
              style={{ width: `${Math.min(100, mp.utilizationPercentage)}%` }}
            />
          </div>
        </div>

        {/* Works Stats & SC/ST Compliance */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-50">
          <div>
            <span className="font-semibold text-slate-700">{mp.worksRecommendedCount}</span> works recommended
            ({mp.worksCompletedCount} completed)
          </div>
          {mp.isCompliant && (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              SC/ST Compliant
            </span>
          )}
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group">
        <span>View Parliamentary Dossier</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
};
export default MPCard;
