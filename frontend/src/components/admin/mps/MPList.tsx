import React, { useState, useMemo } from "react";
import {
  Search,
  Users,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  Award,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { MPSummary } from "../../../api/adminDataService";
import { MPCard } from "./MPCard";

interface MPListProps {
  mps: MPSummary[];
  onSelectMP: (mp: MPSummary) => void;
  isLoading?: boolean;
}

export const MPList: React.FC<MPListProps> = ({ mps, onSelectMP, isLoading = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [houseFilter, setHouseFilter] = useState<"All" | "Lok Sabha" | "Rajya Sabha">("All");
  const [stateFilter, setStateFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<
    "rank" | "utilizationPercentage" | "totalSanctioned" | "name"
  >("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Format currency
  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  // Distinct states list for filter dropdown
  const statesList = useMemo(() => {
    const set = new Set<string>();
    mps.forEach((m) => {
      if (m.state) set.add(m.state);
    });
    return Array.from(set).sort();
  }, [mps]);

  // Filter & Sort MPs
  const filteredMPs = useMemo(() => {
    return mps
      .filter((m) => {
        if (houseFilter !== "All" && m.house !== houseFilter) return false;
        if (stateFilter !== "All" && m.state !== stateFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = m.name.toLowerCase().includes(q);
          const matchConst = m.constituency.toLowerCase().includes(q);
          const matchState = m.state.toLowerCase().includes(q);
          const matchParty = (m.party || "").toLowerCase().includes(q);
          if (!matchName && !matchConst && !matchState && !matchParty) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === "rank") diff = a.rank - b.rank;
        else if (sortBy === "utilizationPercentage")
          diff = a.utilizationPercentage - b.utilizationPercentage;
        else if (sortBy === "totalSanctioned")
          diff = a.totalSanctioned - b.totalSanctioned;
        else if (sortBy === "name") diff = a.name.localeCompare(b.name);

        return sortOrder === "desc" ? -diff : diff;
      });
  }, [mps, searchQuery, houseFilter, stateFilter, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Header Summary Banner */}
      <div className="civic-card p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-300" />
            Members of Parliament Directory & Performance Index
          </h2>
          <p className="text-xs text-blue-200 mt-1 max-w-2xl">
            Ranked parliamentary oversight of recommended works, certified ground expenditure, and statutory SC/ST quota allocations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-2xl font-black text-white">{mps.length}</div>
            <div className="text-[11px] text-blue-300 uppercase tracking-wider font-semibold">
              Active Parliamentarians
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="civic-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by MP name, constituency, state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* House Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400">House:</span>
            <select
              value={houseFilter}
              onChange={(e: any) => setHouseFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="All">Both Houses</option>
              <option value="Lok Sabha">Lok Sabha</option>
              <option value="Rajya Sabha">Rajya Sabha</option>
            </select>
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400">State:</span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 max-w-[150px] truncate"
            >
              <option value="All">All States ({statesList.length})</option>
              {statesList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="rank">Efficiency Rank</option>
              <option value="utilizationPercentage">Utilization %</option>
              <option value="totalSanctioned">Sanctioned Outlay</option>
              <option value="name">MP Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
              title="Toggle Sort Direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded ${
                viewMode === "grid"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading MP rosters from Supabase...
        </div>
      ) : filteredMPs.length === 0 ? (
        <div className="civic-card p-12 text-center text-slate-500">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h4 className="text-base font-bold text-slate-700">No Parliamentarians Found</h4>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search criteria or filter options.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-civic-fade">
          {filteredMPs.map((mp) => (
            <MPCard key={mp.mpId} mp={mp} onSelectMP={onSelectMP} />
          ))}
        </div>
      ) : (
        <div className="civic-card overflow-hidden animate-civic-fade">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Member of Parliament</th>
                  <th className="py-3 px-4">House & Party</th>
                  <th className="py-3 px-4">Constituency</th>
                  <th className="py-3 px-4">Sanctioned</th>
                  <th className="py-3 px-4">Utilized</th>
                  <th className="py-3 px-4 w-40">Utilization Rate</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMPs.map((mp) => (
                  <tr
                    key={mp.mpId}
                    onClick={() => onSelectMP(mp)}
                    className="border-b border-slate-100 hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-xs">
                        #{mp.rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{mp.name}</div>
                      <div className="text-xs text-slate-500">{mp.state}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 mr-1">
                        {mp.house}
                      </span>
                      {mp.party && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                          {mp.party}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{mp.constituency}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {formatCurrency(mp.totalSanctioned)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">
                      {formatCurrency(mp.totalUtilized)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-800">
                          {mp.utilizationPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            mp.utilizationPercentage >= 70
                              ? "bg-emerald-500"
                              : mp.utilizationPercentage >= 40
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(100, mp.utilizationPercentage)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMP(mp);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100"
                      >
                        Dossier
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default MPList;
