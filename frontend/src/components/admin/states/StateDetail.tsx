import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  MapPin,
  Calendar,
  Layers,
  FileText,
  DollarSign,
} from "lucide-react";
import { StateSummary, MPSummary } from "../../../api/adminDataService";

interface StateDetailProps {
  stateName: string;
  stateData?: StateSummary;
  mps: MPSummary[];
  projects: any[];
  onBack: () => void;
  onSelectProject: (project: any) => void;
  onSelectMP: (mp: MPSummary) => void;
}

export const StateDetail: React.FC<StateDetailProps> = ({
  stateName,
  stateData,
  mps,
  projects,
  onBack,
  onSelectProject,
  onSelectMP,
}) => {
  // Three Tabs: Overview, MPs, Projects
  const [activeTab, setActiveTab] = useState<"overview" | "mps" | "projects">("overview");

  // Project Tab Filters
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");

  // Filter MPs for this state
  const stateMPs = useMemo(() => {
    return mps.filter(
      (m) => m.state.toLowerCase().trim() === stateName.toLowerCase().trim()
    );
  }, [mps, stateName]);

  // Filter projects for this state
  const stateProjects = useMemo(() => {
    return projects.filter(
      (p) => (p.state || "").toLowerCase().trim() === stateName.toLowerCase().trim()
    );
  }, [projects, stateName]);

  // Filtered projects within Tab 3
  const filteredProjects = useMemo(() => {
    return stateProjects.filter((p) => {
      if (projectStatusFilter !== "all" && (p.status || "") !== projectStatusFilter) {
        return false;
      }
      if (projectSearch.trim()) {
        const q = projectSearch.toLowerCase();
        const title = (p.project_name || p.title || "").toLowerCase();
        const dist = (p.district || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        const id = (p.project_id || p.id || "").toLowerCase();
        if (!title.includes(q) && !dist.includes(q) && !cat.includes(q) && !id.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [stateProjects, projectSearch, projectStatusFilter]);

  // Format INR Shorthand
  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const totalAllocated = stateData?.totalAllocated || stateProjects.reduce((s, p) => s + (p.sanctioned_amount || 0), 0);
  const totalExpenditure = stateData?.totalExpenditure || stateProjects.reduce((s, p) => s + (p.utilized_amount || 0), 0);
  const unspentBalance = Math.max(0, totalAllocated - totalExpenditure);
  const utilizationRate = totalAllocated > 0 ? Math.round((totalExpenditure / totalAllocated) * 100) : 0;

  // District distribution
  const districtRollup = useMemo(() => {
    const map = new Map<string, { count: number; sanctioned: number; utilized: number }>();
    for (const p of stateProjects) {
      const d = p.district || "General";
      if (!map.has(d)) map.set(d, { count: 0, sanctioned: 0, utilized: 0 });
      const entry = map.get(d)!;
      entry.count++;
      entry.sanctioned += Number(p.sanctioned_amount || 0);
      entry.utilized += Number(p.utilized_amount || 0);
    }
    return Array.from(map.entries()).map(([district, data]) => ({
      district,
      ...data,
      utilization: data.sanctioned > 0 ? Math.round((data.utilized / data.sanctioned) * 100) : 0,
    }));
  }, [stateProjects]);

  return (
    <div className="space-y-6 animate-civic-fade">
      {/* Top Header with Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Return to States List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                {stateName}
              </h1>
              {stateData && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  National Rank #{stateData.rank}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive state dashboard across {stateMPs.length} Parliamentary Constituencies and {stateProjects.length} MPLADS works.
            </p>
          </div>
        </div>

        {/* Quick KPI badges */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {utilizationRate}% Utilization
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-blue-600" />
            {stateProjects.length} Projects
          </span>
        </div>
      </div>

      {/* The 3 Tabs Navigation Bar */}
      <div className="civic-nav-tabs">
        <button
          onClick={() => setActiveTab("overview")}
          className={`civic-tab-btn ${activeTab === "overview" ? "active" : ""}`}
        >
          <TrendingUp className="w-4 h-4" />
          Tab 1: State Overview & Finances
        </button>

        <button
          onClick={() => setActiveTab("mps")}
          className={`civic-tab-btn ${activeTab === "mps" ? "active" : ""}`}
        >
          <Users className="w-4 h-4" />
          Tab 2: Members of Parliament ({stateMPs.length})
        </button>

        <button
          onClick={() => setActiveTab("projects")}
          className={`civic-tab-btn ${activeTab === "projects" ? "active" : ""}`}
        >
          <Layers className="w-4 h-4" />
          Tab 3: Works & Schemes ({stateProjects.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-civic-fade">
          {/* Main Financial Utilization Gauge Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Gauge */}
            <div className="civic-card p-6 flex flex-col justify-between items-center text-center bg-gradient-to-b from-white to-blue-50/20">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                Fund Utilization Performance
              </h3>

              <div className="relative w-40 h-40 flex items-center justify-center my-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={
                      utilizationRate >= 70
                        ? "text-emerald-500"
                        : utilizationRate >= 40
                        ? "text-amber-500"
                        : "text-rose-500"
                    }
                    strokeDasharray={`${utilizationRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-slate-900">{utilizationRate}%</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Utilized</span>
                </div>
              </div>

              <div className="w-full text-xs text-slate-500 border-t border-slate-100 pt-3">
                {utilizationRate >= 70
                  ? "✅ High absorption rate adhering to central guidelines."
                  : utilizationRate >= 40
                  ? "⚠️ Moderate fund absorption. Active monitoring recommended."
                  : "🔴 Significant unspent balance. Expedite physical certifications."}
              </div>
            </div>

            {/* Financial Ledger Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="civic-card p-5 bg-gradient-to-br from-white to-slate-50">
                <div className="text-xs font-semibold uppercase text-slate-400">
                  Total Sanctioned Outlay
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {formatCurrency(totalAllocated)}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Cumulative approved allocation
                </div>
              </div>

              <div className="civic-card p-5 bg-gradient-to-br from-white to-emerald-50/40">
                <div className="text-xs font-semibold uppercase text-slate-400">
                  Total Expenditure
                </div>
                <div className="text-2xl font-black text-emerald-700 mt-2">
                  {formatCurrency(totalExpenditure)}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Certified disbursements to agencies
                </div>
              </div>

              <div className="civic-card p-5 bg-gradient-to-br from-white to-amber-50/40">
                <div className="text-xs font-semibold uppercase text-slate-400">
                  Unspent Balance
                </div>
                <div className="text-2xl font-black text-amber-700 mt-2">
                  {formatCurrency(unspentBalance)}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Remaining state pool funds
                </div>
              </div>

              {/* Status Breakdown Bar */}
              <div className="sm:col-span-3 civic-card p-5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Project Execution Stages
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <div className="text-xl font-black text-emerald-800">
                      {stateProjects.filter((p) => p.status === "Completed").length}
                    </div>
                    <div className="text-xs text-emerald-600 font-medium mt-0.5">Completed</div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                    <div className="text-xl font-black text-blue-800">
                      {stateProjects.filter((p) => p.status === "InProgress").length}
                    </div>
                    <div className="text-xs text-blue-600 font-medium mt-0.5">In Progress</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-xl font-black text-slate-800">
                      {stateProjects.filter((p) => p.status === "Sanctioned").length}
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-0.5">Sanctioned</div>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-100">
                    <div className="text-xl font-black text-purple-800">
                      {stateProjects.filter((p) => p.status === "Proposed").length}
                    </div>
                    <div className="text-xs text-purple-600 font-medium mt-0.5">Proposed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* District Breakdown Table */}
          <div className="civic-card p-5">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              District-Wise Allocation & Expenditure Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase">
                    <th className="py-2.5 px-4">District</th>
                    <th className="py-2.5 px-4">Works Count</th>
                    <th className="py-2.5 px-4">Sanctioned</th>
                    <th className="py-2.5 px-4">Utilized</th>
                    <th className="py-2.5 px-4 w-48">Utilization %</th>
                  </tr>
                </thead>
                <tbody>
                  {districtRollup.map((d) => (
                    <tr key={d.district} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{d.district}</td>
                      <td className="py-2.5 px-4 text-slate-600">{d.count} Works</td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">{formatCurrency(d.sanctioned)}</td>
                      <td className="py-2.5 px-4 font-medium text-emerald-700">{formatCurrency(d.utilized)}</td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 w-9">{d.utilization}%</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.min(100, d.utilization)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS OF PARLIAMENT */}
      {activeTab === "mps" && (
        <div className="space-y-4 animate-civic-fade">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              MPs Representing {stateName} ({stateMPs.length})
            </h3>
            <span className="text-xs text-slate-500">
              Ranked by parliamentary fund utilization efficiency
            </span>
          </div>

          {stateMPs.length === 0 ? (
            <div className="civic-card p-12 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h4 className="text-base font-bold text-slate-700">No MPs linked directly</h4>
              <p className="text-xs text-slate-400 mt-1">
                MPs for this state are managed under national constituency allocations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {stateMPs.map((mp) => (
                <div
                  key={mp.mpId}
                  onClick={() => onSelectMP(mp)}
                  className="civic-card p-5 cursor-pointer hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-base shrink-0 border border-blue-200">
                        {mp.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{mp.name}</h4>
                        <div className="text-xs text-slate-500">{mp.constituency}</div>
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
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        #{mp.rank}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-2.5 my-2 border-t border-b border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Recommended</span>
                        <span className="font-bold text-slate-800">{formatCurrency(mp.totalSanctioned)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Utilized</span>
                        <span className="font-bold text-emerald-700">{formatCurrency(mp.totalUtilized)}</span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-600">Absorption Rate</span>
                        <span className="text-blue-700">{mp.utilizationPercentage}%</span>
                      </div>
                      <div className="civic-progress-track">
                        <div
                          className="civic-progress-fill primary"
                          style={{ width: `${Math.min(100, mp.utilizationPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                    <span>View MP Portfolio</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROJECTS & WORKS */}
      {activeTab === "projects" && (
        <div className="space-y-4 animate-civic-fade">
          {/* Filter Bar */}
          <div className="civic-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search works by ID, title, or category..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-500">Status:</span>
              <select
                value={projectStatusFilter}
                onChange={(e) => setProjectStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="all">All Statuses ({stateProjects.length})</option>
                <option value="Completed">Completed</option>
                <option value="InProgress">In Progress</option>
                <option value="Sanctioned">Sanctioned</option>
                <option value="Proposed">Proposed</option>
              </select>
            </div>
          </div>

          {/* Projects Table */}
          {filteredProjects.length === 0 ? (
            <div className="civic-card p-12 text-center text-slate-500">
              <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h4 className="text-base font-bold text-slate-700">No projects match filters</h4>
              <p className="text-xs text-slate-400 mt-1">Try resetting the status filter or search keywords.</p>
            </div>
          ) : (
            <div className="civic-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase">
                      <th className="py-3 px-4">Work ID & Description</th>
                      <th className="py-3 px-4">District & Category</th>
                      <th className="py-3 px-4">Sanctioned</th>
                      <th className="py-3 px-4">Progress %</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Details</th>
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
                        <tr
                          key={id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-slate-900 truncate" title={title}>
                              {title}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {id?.substring(0, 8)}...
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="text-slate-800 font-medium">{p.district || "General"}</div>
                            <div className="text-[11px] text-slate-500">{p.category || "Normal/Others"}</div>
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {formatCurrency(cost)}
                          </td>

                          <td className="py-3 px-4 w-36">
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
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default StateDetail;
