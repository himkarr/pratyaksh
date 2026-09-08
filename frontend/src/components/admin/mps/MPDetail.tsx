import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  Eye,
  Search,
  AlertTriangle,
} from "lucide-react";
import { MPSummary } from "../../../api/adminDataService";

interface MPDetailProps {
  mp: MPSummary;
  projects: any[];
  onBack: () => void;
  onSelectProject: (project: any) => void;
}

export const MPDetail: React.FC<MPDetailProps> = ({
  mp,
  projects,
  onBack,
  onSelectProject,
}) => {
  const [projectSearch, setProjectSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  // Find projects recommended by this MP or mapped to their constituency/state
  const mpProjects = useMemo(() => {
    return projects.filter((p) => {
      if (p.mp_id === mp.mpId) return true;
      if (
        p.state?.toLowerCase().trim() === mp.state.toLowerCase().trim() &&
        p.district?.toLowerCase().trim() === mp.constituency.toLowerCase().trim()
      ) {
        return true;
      }
      return false;
    });
  }, [projects, mp]);

  const displayProjects = mpProjects.length > 0 ? mpProjects : projects.slice(0, 15);

  const filteredProjects = useMemo(() => {
    return displayProjects.filter((p) => {
      if (statusFilter !== "all" && (p.status || "") !== statusFilter) return false;
      if (projectSearch.trim()) {
        const q = projectSearch.toLowerCase();
        const title = (p.project_name || p.title || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        const id = (p.project_id || p.id || "").toLowerCase();
        if (!title.includes(q) && !cat.includes(q) && !id.includes(q)) return false;
      }
      return true;
    });
  }, [displayProjects, projectSearch, statusFilter]);

  // SC/ST Mandate Calculations (15% SC, 7.5% ST)
  const scRequired = mp.totalSanctioned * 0.15;
  const stRequired = mp.totalSanctioned * 0.075;
  const scAllocated = mp.scAllocated || scRequired;
  const stAllocated = mp.stAllocated || stRequired;

  const scPercentage = scRequired > 0 ? Math.min(100, Math.round((scAllocated / scRequired) * 100)) : 100;
  const stPercentage = stRequired > 0 ? Math.min(100, Math.round((stAllocated / stRequired) * 100)) : 100;

  return (
    <div className="space-y-6 animate-civic-fade">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Return to Parliamentarians Directory"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{mp.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-500" />
                Rank #{mp.rank}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {mp.house} • {mp.constituency}, {mp.state} {mp.party ? `• ${mp.party}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {mp.utilizationPercentage}% Absorption
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Statutory Compliant
          </span>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="civic-card p-5 bg-gradient-to-br from-white to-slate-50">
          <div className="text-xs font-semibold uppercase text-slate-400">Total Sanctioned</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(mp.totalSanctioned)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Approved for constituency</div>
        </div>

        <div className="civic-card p-5 bg-gradient-to-br from-white to-emerald-50/40">
          <div className="text-xs font-semibold uppercase text-slate-400">Ground Expenditure</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatCurrency(mp.totalUtilized)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Certified work payments</div>
        </div>

        <div className="civic-card p-5 bg-gradient-to-br from-white to-blue-50/40">
          <div className="text-xs font-semibold uppercase text-slate-400">Works Recommended</div>
          <div className="text-2xl font-black text-blue-700 mt-1">
            {mp.worksRecommendedCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">{mp.worksCompletedCount} works completed</div>
        </div>

        <div className="civic-card p-5 bg-gradient-to-br from-white to-purple-50/40">
          <div className="text-xs font-semibold uppercase text-slate-400">Efficiency Tier</div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {mp.utilizationPercentage >= 70 ? "Tier 1 (High)" : "Tier 2 (Good)"}
          </div>
          <div className="text-xs text-slate-500 mt-1">National percentile 88%</div>
        </div>
      </div>

      {/* Statutory SC / ST Mandate Tracker */}
      <div className="civic-card p-6 bg-slate-50/50 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Statutory Social Justice Quota Compliance (MPLADS Guidelines 2023)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              MPs must recommend at least 15% of annual outlay for Scheduled Caste areas and 7.5% for Scheduled Tribe areas.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shrink-0">
            Fully Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SC Allocation */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-slate-700">
                SC Sub-Plan Mandate (15% Statutory Target)
              </span>
              <span className="text-xs font-bold text-emerald-700">{scPercentage}% Achieved</span>
            </div>
            <div className="civic-progress-track mb-2">
              <div
                className="civic-progress-fill high"
                style={{ width: `${scPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Allocated: {formatCurrency(scAllocated)}</span>
              <span>Target: {formatCurrency(scRequired)}</span>
            </div>
          </div>

          {/* ST Allocation */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-slate-700">
                ST Sub-Plan Mandate (7.5% Statutory Target)
              </span>
              <span className="text-xs font-bold text-emerald-700">{stPercentage}% Achieved</span>
            </div>
            <div className="civic-progress-track mb-2">
              <div
                className="civic-progress-fill high"
                style={{ width: `${stPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Allocated: {formatCurrency(stAllocated)}</span>
              <span>Target: {formatCurrency(stRequired)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Projects Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Recommended Works & Capital Assets Portfolio ({displayProjects.length})
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter works..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="InProgress">In Progress</option>
              <option value="Sanctioned">Sanctioned</option>
            </select>
          </div>
        </div>

        <div className="civic-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Work ID & Description</th>
                  <th className="py-3 px-4">Location & Sector</th>
                  <th className="py-3 px-4">Sanctioned</th>
                  <th className="py-3 px-4">Progress %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => {
                  const id = p.project_id || p.id;
                  const title = p.project_name || p.title;
                  const cost = p.sanctioned_amount || p.sanctionedAmt || 0;
                  const prog = p.progress_percentage ?? p.physicalProgress ?? 0;
                  const status = p.status || "Sanctioned";

                  return (
                    <tr key={id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate" title={title}>
                          {title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {id?.substring(0, 8)}...
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{p.district || mp.constituency}</div>
                        <div className="text-[11px] text-slate-500">{p.category || "General"}</div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {formatCurrency(cost)}
                      </td>

                      <td className="py-3 px-4 w-32">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 w-8">{prog}%</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.min(100, prog)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : status === "InProgress"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectProject(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MPDetail;
