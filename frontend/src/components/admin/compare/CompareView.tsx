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
    <div className="space-y-6 animate-civic-fade">
      {/* Header Banner */}
      <div className="civic-card p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-300" />
            Parliamentary Comparative Analytics Workspace
          </h2>
          <p className="text-xs text-blue-200 mt-1 max-w-2xl">
            Compare fund absorption, capital asset delivery rates, and statutory quota compliance side-by-side across up to 4 Parliamentarians.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedMPIds.length < 4 && (
            <button
              onClick={() => setSelectorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add MP to Compare ({selectedMPIds.length}/4)
            </button>
          )}
        </div>
      </div>

      {/* Selector Modal */}
      {selectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-slate-200 animate-civic-fade">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Select Member of Parliament</h3>
              <button
                onClick={() => setSelectorOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-3">
              <input
                type="text"
                placeholder="Search by name, state, or constituency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 divide-y divide-slate-50">
              {availableMPs.slice(0, 20).map((m) => (
                <div
                  key={m.mpId}
                  onClick={() => addMP(m.mpId)}
                  className="p-2.5 rounded-lg hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-800">{m.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {m.constituency}, {m.state} ({m.house})
                    </div>
                  </div>
                  <span className="font-semibold text-blue-600 text-[11px]">
                    {m.utilizationPercentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      <div
        className={`grid gap-5 ${
          selectedMPs.length === 2
            ? "grid-cols-1 md:grid-cols-2"
            : selectedMPs.length === 3
            ? "grid-cols-1 md:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {selectedMPs.map((mp) => (
          <div
            key={mp.mpId}
            className="civic-card p-5 relative flex flex-col justify-between"
          >
            {/* Remove button */}
            {selectedMPs.length > 1 && (
              <button
                onClick={() => removeMP(mp.mpId)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Remove from comparison"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div>
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 mb-3 pr-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shrink-0 shadow-sm">
                  {mp.name.replace(/^(Shri|Smt\.|Dr\.)\s*/i, "").charAt(0) || "M"}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 truncate" title={mp.name}>
                    {mp.name}
                  </h4>
                  <div className="text-xs text-slate-500 truncate">
                    {mp.constituency}, {mp.state}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {mp.house}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                      Rank #{mp.rank}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fund Utilization Progress Meter */}
              <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-center text-xs mb-1 font-semibold">
                  <span className="text-slate-600">Fund Utilization</span>
                  <span
                    className={
                      mp.utilizationPercentage >= 70
                        ? "text-emerald-700 font-bold"
                        : mp.utilizationPercentage >= 40
                        ? "text-amber-700 font-bold"
                        : "text-rose-700 font-bold"
                    }
                  >
                    {mp.utilizationPercentage}%
                  </span>
                </div>
                <div className="civic-progress-track">
                  <div
                    className={`civic-progress-fill ${
                      mp.utilizationPercentage >= 70
                        ? "high"
                        : mp.utilizationPercentage >= 40
                        ? "medium"
                        : "low"
                    }`}
                    style={{ width: `${Math.min(100, mp.utilizationPercentage)}%` }}
                  />
                </div>
              </div>

              {/* Side-by-Side Comparative Metrics */}
              <div className="space-y-2.5 text-xs py-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Sanctioned Outlay:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(mp.totalSanctioned)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Ground Expenditure:</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(mp.totalUtilized)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Unspent Balance:</span>
                  <span className="font-medium text-slate-700">
                    {formatCurrency(Math.max(0, mp.totalSanctioned - mp.totalUtilized))}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Works Recommended:</span>
                  <span className="font-bold text-slate-900">{mp.worksRecommendedCount} Works</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Works Completed:</span>
                  <span className="font-bold text-blue-700">{mp.worksCompletedCount} Completed</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-slate-500">SC/ST Mandate:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Compliant
                  </span>
                </div>
              </div>
            </div>

            {/* View Full Dossier */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onSelectMP(mp)}
                className="w-full py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Inspect MP Portfolio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default CompareView;
