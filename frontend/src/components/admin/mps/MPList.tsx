import React, { useState, useMemo, useDeferredValue } from "react";
import {
  Search,
  Users,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowRight,
  X,
  User,
} from "lucide-react";
import { MPSummary } from "../../../api/adminDataService";
import { MPCard } from "./MPCard";
import { TableColumnHeader } from "../../common/TableColumnHeader";

interface MPListProps {
  mps: MPSummary[];
  onSelectMP: (mp: MPSummary) => void;
  isLoading?: boolean;
}

export const MPList: React.FC<MPListProps> = ({ mps, onSelectMP, isLoading = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [houseFilter, setHouseFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [partyFilter, setPartyFilter] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Format currency
  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const formatExactCurrency = (amt: number) => {
    return `₹${Math.round(amt).toLocaleString("en-IN")}`;
  };

  const getUtilColor = (pct: number) => {
    if (pct >= 70) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (pct >= 40) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  // Distinct states list
  const statesList = useMemo(() => {
    const set = new Set<string>();
    mps.forEach((m) => {
      if (m.state) set.add(m.state);
    });
    return Array.from(set).sort();
  }, [mps]);

  // Distinct parties list
  const partyList = useMemo(() => {
    const set = new Set<string>();
    mps.forEach((m) => {
      if (m.party) set.add(m.party);
    });
    return Array.from(set).sort();
  }, [mps]);

  // Memoized national aggregate stats (Exact figures)
  const aggregateStats = useMemo(() => {
    let totalSanctioned = 0;
    let totalUtilized = 0;
    let highEfficiency = 0;
    let moderate = 0;
    let needsAttention = 0;
    let lsCount = 0;
    let rsCount = 0;
    let totalWorks = 0;
    let completedWorks = 0;

    for (let i = 0; i < mps.length; i++) {
      const m = mps[i];
      totalSanctioned += m.totalSanctioned || 0;
      totalUtilized += m.totalUtilized || 0;
      totalWorks += m.worksRecommendedCount || 0;
      completedWorks += m.worksCompletedCount || 0;

      if (m.house === "Lok Sabha") lsCount++;
      else if (m.house === "Rajya Sabha") rsCount++;

      if (m.utilizationPercentage >= 70) highEfficiency++;
      else if (m.utilizationPercentage >= 40) moderate++;
      else needsAttention++;
    }

    const unspentBalance = totalSanctioned - totalUtilized;
    const exactUtilization =
      totalSanctioned > 0 ? ((totalUtilized / totalSanctioned) * 100).toFixed(2) : "0.00";

    return {
      totalMps: mps.length,
      lsCount,
      rsCount,
      totalSanctioned,
      totalUtilized,
      unspentBalance,
      exactUtilization,
      totalWorks,
      completedWorks,
      highEfficiency,
      moderate,
      needsAttention,
    };
  }, [mps]);

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "name" || field === "state" || field === "constituency" ? "asc" : "desc");
    }
  };

  // Filter & Sort MPs
  const filteredMPs = useMemo(() => {
    return mps
      .filter((m) => {
        if (houseFilter !== "all" && m.house.toLowerCase() !== houseFilter.toLowerCase()) return false;
        if (stateFilter !== "all" && m.state.toLowerCase() !== stateFilter.toLowerCase()) return false;
        if (partyFilter !== "all" && (m.party || "").toLowerCase() !== partyFilter.toLowerCase()) return false;

        if (filterTier === "high" && m.utilizationPercentage < 70) return false;
        if (filterTier === "medium" && (m.utilizationPercentage < 40 || m.utilizationPercentage >= 70)) return false;
        if (filterTier === "low" && m.utilizationPercentage >= 40) return false;

        if (deferredSearchQuery.trim()) {
          const q = deferredSearchQuery.toLowerCase();
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
        if (sortField === "rank") diff = a.rank - b.rank;
        else if (sortField === "utilizationPercentage")
          diff = a.utilizationPercentage - b.utilizationPercentage;
        else if (sortField === "totalSanctioned")
          diff = a.totalSanctioned - b.totalSanctioned;
        else if (sortField === "totalUtilized")
          diff = a.totalUtilized - b.totalUtilized;
        else if (sortField === "worksRecommendedCount")
          diff = (a.worksRecommendedCount || 0) - (b.worksRecommendedCount || 0);
        else if (sortField === "name") diff = a.name.localeCompare(b.name);
        else if (sortField === "state") diff = a.state.localeCompare(b.state);
        else if (sortField === "constituency") diff = a.constituency.localeCompare(b.constituency);
        else if (sortField === "house") diff = a.house.localeCompare(b.house);

        return sortOrder === "desc" ? -diff : diff;
      });
  }, [mps, deferredSearchQuery, houseFilter, stateFilter, partyFilter, filterTier, sortField, sortOrder]);

  return (
    <div className="mps-page">
      {/* 1. Header & Live Statistics (Normal Text View - Matching States & UTs) */}
      <div
        className="mps-header"
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "1.5rem 1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ marginBottom: "1.25rem" }}>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Members of Parliament Performance & Allocations
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "4px 0 0 0" }}>
            Exact verified financial disbursements, certified expenditures, and works progress across Lok Sabha and Rajya Sabha Parliamentarians.
          </p>
        </div>

        {/* Normal Text Metrics Summary (Clean High-Precision Layout) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          {/* Exact Sanctioned Outlay */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Sanctioned Outlay
            </span>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              {formatExactCurrency(aggregateStats.totalSanctioned)}
            </span>
            <span style={{ fontSize: "0.775rem", color: "#64748b" }}>
              Across {aggregateStats.totalMps} MPs ({aggregateStats.lsCount} LS · {aggregateStats.rsCount} RS)
            </span>
          </div>

          {/* Exact Recorded Expenditure */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Recorded Expenditure
            </span>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#059669" }}>
              {formatExactCurrency(aggregateStats.totalUtilized)}
            </span>
            <span style={{ fontSize: "0.775rem", color: "#64748b" }}>
              Certified Disbursed
            </span>
          </div>

          {/* Exact Unspent Treasury Balance */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Unspent Balance
            </span>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#d97706" }}>
              {formatExactCurrency(aggregateStats.unspentBalance)}
            </span>
            <span style={{ fontSize: "0.775rem", color: "#64748b" }}>
              Available with District Nodal Auth
            </span>
          </div>

          {/* Exact Utilization Rate */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Fund Utilization
            </span>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2563eb" }}>
              {aggregateStats.exactUtilization}%
            </span>
            <span style={{ fontSize: "0.775rem", color: "#64748b" }}>
              Weighted National Benchmark
            </span>
          </div>

          {/* Exact Works Portfolio */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Works Portfolio
            </span>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              {aggregateStats.totalWorks.toLocaleString("en-IN")} Total Works
            </span>
            <span style={{ fontSize: "0.775rem", color: "#64748b" }}>
              {aggregateStats.completedWorks.toLocaleString("en-IN")} Completed Works
            </span>
          </div>
        </div>
      </div>

      {/* 2. Controls Toolbar */}
      <div className="mps-controls">
        {/* Search */}
        <div className="search-section">
          <div className="search-box" style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <input
              type="text"
              placeholder="Search by MP name, constituency, state, party..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                paddingLeft: "38px",
                paddingRight: searchQuery ? "36px" : "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.875rem",
                background: "#ffffff",
                color: "#1e293b",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2563eb";
                e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "none";
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="control-buttons">
          <div className="filter-controls">
            {/* House Filter */}
            <div className="filter-group">
              <label>House:</label>
              <select
                value={houseFilter}
                onChange={(e) => setHouseFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Both Houses</option>
                <option value="lok sabha">Lok Sabha ({aggregateStats.lsCount})</option>
                <option value="rajya sabha">Rajya Sabha ({aggregateStats.rsCount})</option>
              </select>
            </div>

            {/* State Filter */}
            <div className="filter-group">
              <label>State:</label>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="filter-select"
                style={{ maxWidth: "160px" }}
              >
                <option value="all">All States ({statesList.length})</option>
                {statesList.map((st) => (
                  <option key={st} value={st.toLowerCase()}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Performance Tier */}
            <div className="filter-group">
              <label>Tier:</label>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Tiers</option>
                <option value="high">High (≥ 70%)</option>
                <option value="medium">Average (40% - 69%)</option>
                <option value="low">Needs Attention (&lt; 40%)</option>
              </select>
            </div>

            {/* Sort Control */}
            <div className="sort-controls">
              <label>Sort:</label>
              <select
                value={sortField}
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select"
              >
                <option value="rank">Efficiency Rank</option>
                <option value="utilizationPercentage">Fund Utilization %</option>
                <option value="totalSanctioned">Sanctioned Outlay</option>
                <option value="totalUtilized">Certified Spent</option>
                <option value="worksRecommendedCount">Total Works</option>
                <option value="name">MP Name</option>
                <option value="state">State</option>
              </select>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="sort-controls cursor-pointer hover:bg-slate-50 transition-colors"
              title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
              style={{ padding: "0.5rem 0.85rem" }}
            >
              <ArrowUpDown size={15} />
              <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{sortOrder.toUpperCase()}</span>
            </button>
          </div>

          {/* View Mode Toggle (Segmented Pill Switch with Animation) */}
          <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                background: viewMode === "list" ? "#ffffff" : "transparent",
                color: viewMode === "list" ? "#0f172a" : "#64748b",
                fontWeight: viewMode === "list" ? 700 : 500,
                fontSize: "0.82rem",
                boxShadow: viewMode === "list" ? "0 1px 2px rgba(15,23,42,0.10)" : "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              aria-pressed={viewMode === "list"}
            >
              <List size={15} />
              <span>Table View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                background: viewMode === "grid" ? "#ffffff" : "transparent",
                color: viewMode === "grid" ? "#0f172a" : "#64748b",
                fontWeight: viewMode === "grid" ? 700 : 500,
                fontSize: "0.82rem",
                boxShadow: viewMode === "grid" ? "0 1px 2px rgba(15,23,42,0.10)" : "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid size={15} />
              <span>Grid View</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MP Cards Grid / Table View with Animated View Transition */}
      {isLoading ? (
        <div style={{ padding: "64px 0", textAlign: "center", color: "var(--text-secondary)" }}>
          <div style={{ width: "32px", height: "32px", border: "3px solid var(--primary-600)", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
          Loading MP rosters...
        </div>
      ) : filteredMPs.length === 0 ? (
        <div style={{ background: "white", padding: "48px", textAlign: "center", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <Users size={36} style={{ color: "var(--text-tertiary)", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>No Parliamentarians Found</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Try adjusting your search criteria or filter options.
          </p>
        </div>
      ) : (
        <div key={viewMode} className="view-transition-container">
          {viewMode === "grid" ? (
            <div className="mps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
              {filteredMPs.map((mp) => (
                <MPCard key={mp.mpId} mp={mp} onSelectMP={onSelectMP} />
              ))}
            </div>
          ) : (
            <div className="mp-table-container" style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
                  <TableColumnHeader
                    title="Rank"
                    field="rank"
                    currentSortField={sortField}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                    style={{ width: "80px", padding: "18px 24px" }}
                  />
                  <TableColumnHeader
                    title="Member of Parliament"
                    field="name"
                    currentSortField={sortField}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                    filterOptions={statesList.map(s => ({ label: `State: ${s}`, value: s.toLowerCase() }))}
                    selectedFilter={stateFilter}
                    onFilterChange={setStateFilter}
                    style={{ padding: "18px 24px" }}
                  />
                  <TableColumnHeader
                    title="House & Party"
                    field="house"
                    currentSortField={sortField}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                    filterOptions={[
                      { label: "House: Both", value: "all" },
                      { label: "House: Lok Sabha", value: "lok sabha" },
                      { label: "House: Rajya Sabha", value: "rajya sabha" },
                      ...partyList.map(p => ({ label: `Party: ${p}`, value: p.toLowerCase() }))
                    ]}
                    selectedFilter={houseFilter !== "all" ? houseFilter : partyFilter}
                    onFilterChange={(val) => {
                      if (val === "lok sabha" || val === "rajya sabha" || val === "all") {
                        setHouseFilter(val);
                      } else {
                        setPartyFilter(val);
                      }
                    }}
                    style={{ padding: "18px 24px" }}
                  />
                  <TableColumnHeader
                    title="Works Portfolio"
                    field="worksRecommendedCount"
                    currentSortField={sortField}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                    style={{ padding: "18px 24px" }}
                  />
                  <TableColumnHeader
                    title="Sanctioned Outlay"
                    field="totalSanctioned"
                    currentSortField={sortField}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                    style={{ padding: "18px 24px" }}
                  />
                  <TableColumnHeader
                    title="Expenditure"
                    field="totalUtilized"
                    currentSortField={sortField}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                    style={{ padding: "18px 24px" }}
                  />
                  <TableColumnHeader
                    title="Utilization Rate"
                    field="utilizationPercentage"
                    currentSortField={sortField}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                    filterOptions={[
                      { label: "All Tiers", value: "all" },
                      { label: "High (>= 70%)", value: "high" },
                      { label: "Average (40-69%)", value: "medium" },
                      { label: "Needs Attention (< 40%)", value: "low" },
                    ]}
                    selectedFilter={filterTier}
                    onFilterChange={setFilterTier}
                    style={{ width: "220px", padding: "18px 24px" }}
                  />
                  <th style={{ padding: "18px 24px", textAlign: "right", color: "#64748b", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMPs.map((mp) => (
                  <tr
                    key={mp.mpId}
                    onClick={() => onSelectMP(mp)}
                    className="hover:bg-slate-50/90 cursor-pointer transition-all border-b border-slate-200 text-sm group"
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                  >
                    {/* Rank */}
                    <td style={{ padding: "22px 24px", width: "80px", verticalAlign: "middle" }} className="font-bold text-slate-500">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 text-slate-700 text-xs font-bold transition-colors">
                        #{mp.rank}
                      </span>
                    </td>

                    {/* Member of Parliament */}
                    <td style={{ padding: "22px 24px", verticalAlign: "middle" }}>
                      <div className="font-semibold text-slate-900 flex items-center gap-2 text-[0.975rem]">
                        <User className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{mp.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                        <span className="font-medium text-slate-700">{mp.state}</span>
                        {mp.constituency && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">{mp.constituency}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* House & Party */}
                    <td style={{ padding: "22px 24px", verticalAlign: "middle" }}>
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          mp.house === "Lok Sabha"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}>
                          {mp.house}
                        </span>
                        {mp.party && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {mp.party}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Works Portfolio */}
                    <td style={{ padding: "22px 24px", verticalAlign: "middle" }} className="text-slate-700">
                      <div className="font-semibold text-slate-900 text-[0.95rem]">
                        {(mp.worksRecommendedCount || 0).toLocaleString("en-IN")} Works
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        <span className="text-emerald-600 font-semibold">
                          {(mp.worksCompletedCount || 0).toLocaleString("en-IN")} done
                        </span>
                      </div>
                    </td>

                    {/* Sanctioned Outlay */}
                    <td style={{ padding: "22px 24px", verticalAlign: "middle" }} className="font-semibold text-slate-900" title={`Exact: ₹${mp.totalSanctioned.toLocaleString("en-IN")}`}>
                      <div className="text-[0.95rem]">{formatCurrency(mp.totalSanctioned)}</div>
                      <div className="text-[11px] text-slate-400 font-normal mt-1.5">Sanctioned Outlay</div>
                    </td>

                    {/* Expenditure */}
                    <td style={{ padding: "22px 24px", verticalAlign: "middle" }} className="font-semibold text-emerald-700" title={`Exact: ₹${mp.totalUtilized.toLocaleString("en-IN")}`}>
                      <div className="text-[0.95rem]">{formatCurrency(mp.totalUtilized)}</div>
                      <div className="text-[11px] text-slate-400 font-normal mt-1.5">Certified Spent</div>
                    </td>

                    {/* Utilization Rate */}
                    <td style={{ padding: "22px 24px", width: "220px", verticalAlign: "middle" }}>
                      <div className="flex items-center justify-between text-xs mb-2.5">
                        <span className="font-bold text-slate-900 text-sm">
                          {mp.utilizationPercentage}%
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getUtilColor(
                            mp.utilizationPercentage
                          )}`}
                        >
                          {mp.utilizationPercentage >= 70
                            ? "High"
                            : mp.utilizationPercentage >= 40
                              ? "Moderate"
                              : "Low"}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
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

                    {/* Action */}
                    <td style={{ padding: "22px 24px", textAlign: "right", verticalAlign: "middle" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMP(mp);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 hover:text-blue-800 transition-all border border-blue-200/60 shadow-xs cursor-pointer"
                      >
                        <span>View Details</span>
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
      )}
    </div>
  );
};
export default MPList;
