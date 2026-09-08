import React, { useState, useMemo } from "react";
import {
  Search,
  LayoutGrid,
  List,
  TrendingUp,
  ArrowUpDown,
  Building,
  DollarSign,
  PieChart,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { StateSummary } from "../../../api/adminDataService";
import { StateCard } from "./StateCard";
import { StateCardList } from "./StateCardList";

interface StateListProps {
  states: StateSummary[];
  onSelectState: (stateName: string) => void;
  isLoading?: boolean;
}

export const StateList: React.FC<StateListProps> = ({
  states,
  onSelectState,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "utilizationPercentage" | "totalAllocated" | "totalExpenditure" | "projectCount"
  >("utilizationPercentage");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterRange, setFilterRange] = useState<"all" | "high" | "medium" | "low">("all");

  // Format INR shorthand
  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(1)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(1)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  // National Rollup Header Stats
  const nationalStats = useMemo(() => {
    const totalStates = states.length;
    const totalAllocated = states.reduce((sum, s) => sum + s.totalAllocated, 0);
    const totalExpenditure = states.reduce((sum, s) => sum + s.totalExpenditure, 0);
    const avgUtilization =
      totalAllocated > 0 ? Math.round((totalExpenditure / totalAllocated) * 100) : 0;
    const totalWorks = states.reduce((sum, s) => sum + s.projectCount, 0);

    return {
      totalStates,
      totalAllocated,
      totalExpenditure,
      avgUtilization,
      totalWorks,
    };
  }, [states]);

  // Filter & Sort
  const filteredStates = useMemo(() => {
    return states
      .filter((s) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!s.state.toLowerCase().includes(q)) return false;
        }
        if (filterRange === "high" && s.utilizationPercentage < 70) return false;
        if (
          filterRange === "medium" &&
          (s.utilizationPercentage < 40 || s.utilizationPercentage >= 70)
        )
          return false;
        if (filterRange === "low" && s.utilizationPercentage >= 40) return false;
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === "utilizationPercentage") {
          diff = a.utilizationPercentage - b.utilizationPercentage;
        } else if (sortBy === "totalAllocated") {
          diff = a.totalAllocated - b.totalAllocated;
        } else if (sortBy === "totalExpenditure") {
          diff = a.totalExpenditure - b.totalExpenditure;
        } else if (sortBy === "projectCount") {
          diff = a.projectCount - b.projectCount;
        }
        return sortOrder === "desc" ? -diff : diff;
      });
  }, [states, searchQuery, sortBy, sortOrder, filterRange]);

  return (
    <div className="space-y-6">
      {/* 1. National Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="civic-card p-5 bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>States & UTs</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {nationalStats.totalStates}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Covering {nationalStats.totalWorks.toLocaleString("en-IN")} total works
          </div>
        </div>

        <div className="civic-card p-5 bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Outlay</span>
            <DollarSign className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(nationalStats.totalAllocated)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Sanctioned MPLADS funds</div>
        </div>

        <div className="civic-card p-5 bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Expenditure</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {formatCurrency(nationalStats.totalExpenditure)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Disbursed on ground</div>
        </div>

        <div className="civic-card p-5 bg-gradient-to-br from-white to-indigo-50/40">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>National Utilization</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">
            {nationalStats.avgUtilization}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Weighted average efficiency</div>
        </div>
      </div>

      {/* 2. Control Toolbar (Search, Filter, Sort, View Mode Toggle) */}
      <div className="civic-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search states or territories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Utilization Range Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterRange}
              onChange={(e: any) => setFilterRange(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Efficiency Tiers</option>
              <option value="high">High (&gt;= 70%)</option>
              <option value="medium">Moderate (40% - 69%)</option>
              <option value="low">Low (&lt; 40%)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="utilizationPercentage">Utilization Rate</option>
              <option value="totalAllocated">Allocated Funds</option>
              <option value="totalExpenditure">Expenditure</option>
              <option value="projectCount">Total Works</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              title={`Sort ${sortOrder === "desc" ? "Ascending" : "Descending"}`}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
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

      {/* 3. States Content Rendering */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading state governance data from Supabase...
        </div>
      ) : filteredStates.length === 0 ? (
        <div className="civic-card p-12 text-center text-slate-500">
          <Building className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h4 className="text-base font-bold text-slate-700">No states found</h4>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search criteria or filter options.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-civic-fade">
          {filteredStates.map((st) => (
            <StateCard
              key={st.state}
              stateData={st}
              onSelectState={onSelectState}
            />
          ))}
        </div>
      ) : (
        <div className="civic-card overflow-hidden animate-civic-fade">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">State & Constituencies</th>
                  <th className="py-3 px-4">Projects</th>
                  <th className="py-3 px-4">Sanctioned</th>
                  <th className="py-3 px-4">Utilized</th>
                  <th className="py-3 px-4 w-44">Utilization Rate</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStates.map((st) => (
                  <StateCardList
                    key={st.state}
                    stateData={st}
                    onSelectState={onSelectState}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default StateList;
