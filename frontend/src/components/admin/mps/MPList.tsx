import React, { useState, useMemo, useDeferredValue } from "react";
import {
  Search,
  Users,
  LayoutGrid,
  List,
  ArrowUpDown,
  Award,
  ArrowRight,
  TrendingUp,
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
  const [sortField, setSortField] = useState<string>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Format currency
  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
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

  // Memoized national aggregate stats
  const aggregateStats = useMemo(() => {
    let totalSanctioned = 0;
    let totalUtilized = 0;
    let totalUtilPct = 0;
    let highEfficiency = 0;
    let moderate = 0;
    let needsAttention = 0;

    for (let i = 0; i < mps.length; i++) {
      const m = mps[i];
      totalSanctioned += m.totalSanctioned || 0;
      totalUtilized += m.totalUtilized || 0;
      totalUtilPct += m.utilizationPercentage || 0;

      if (m.utilizationPercentage >= 70) highEfficiency++;
      else if (m.utilizationPercentage >= 40) moderate++;
      else needsAttention++;
    }

    const avgUtilPct = mps.length > 0 ? Math.round(totalUtilPct / mps.length) : 0;

    return {
      totalSanctioned,
      totalUtilized,
      avgUtilPct,
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
      setSortOrder(field === "name" || field === "constituency" ? "asc" : "desc");
    }
  };

  // Filter & Sort MPs
  const filteredMPs = useMemo(() => {
    return mps
      .filter((m) => {
        if (houseFilter !== "all" && m.house.toLowerCase() !== houseFilter.toLowerCase()) return false;
        if (stateFilter !== "all" && m.state.toLowerCase() !== stateFilter.toLowerCase()) return false;
        if (partyFilter !== "all" && (m.party || "").toLowerCase() !== partyFilter.toLowerCase()) return false;

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
        else if (sortField === "name") diff = a.name.localeCompare(b.name);
        else if (sortField === "state") diff = a.state.localeCompare(b.state);
        else if (sortField === "constituency") diff = a.constituency.localeCompare(b.constituency);
        else if (sortField === "house") diff = a.house.localeCompare(b.house);

        return sortOrder === "desc" ? -diff : diff;
      });
  }, [mps, deferredSearchQuery, houseFilter, stateFilter, partyFilter, sortField, sortOrder]);

  return (
    <div className="mps-page">
      {/* 1. Header & National Statistics */}
      <div className="mps-header">
        <div className="header-content">
          <div className="title-row">
            <h1>Members of Parliament Performance</h1>
          </div>
          <p>
            Ranked parliamentary performance tracking and fund utilization analysis for Lok Sabha and Rajya Sabha MPs
          </p>
        </div>

        <div className="national-stats">
          <div className="stat-box">
            <span className="stat-label">Active MPs Tracked</span>
            <span className="stat-value">{mps.length}</span>
            <span className="stat-period">Both Houses</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Allocated</span>
            <span className="stat-value">
              {formatCurrency(aggregateStats.totalSanctioned)}
            </span>
            <span className="stat-period">Sanctioned Outlay</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Recorded Expenditure</span>
            <span className="stat-value" style={{ color: "#059669" }}>
              {formatCurrency(aggregateStats.totalUtilized)}
            </span>
            <span className="stat-period">Disbursed on Ground</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Average Utilization</span>
            <span className="stat-value">
              {aggregateStats.avgUtilPct}%
            </span>
            <span className="stat-period">National Benchmark</span>
          </div>
        </div>
      </div>

      {/* 2. Performance Insights Banner */}
      <div className="performance-insights">
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon high">
              <TrendingUp size={24} />
            </div>
            <div className="insight-content">
              <h3>High Efficiency</h3>
              <p className="insight-count">
                {aggregateStats.highEfficiency}
              </p>
              <p className="insight-desc">MPs with &ge; 70% utilization</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon medium">
              <Award size={24} />
            </div>
            <div className="insight-content">
              <h3>Moderate</h3>
              <p className="insight-count">
                {aggregateStats.moderate}
              </p>
              <p className="insight-desc">MPs with 40% - 69% utilization</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon low">
              <Users size={24} />
            </div>
            <div className="insight-content">
              <h3>Needs Attention</h3>
              <p className="insight-count">
                {aggregateStats.needsAttention}
              </p>
              <p className="insight-desc">MPs with &lt; 40% utilization</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Controls Toolbar */}
      <div className="mps-controls">
        {/* Search */}
        <div className="search-section">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by MP name, constituency, state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
                <option value="lok sabha">Lok Sabha</option>
                <option value="rajya sabha">Rajya Sabha</option>
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

            {/* Sort Control */}
            <div className="sort-controls">
              <label>Sort:</label>
              <select
                value={sortField}
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select"
              >
                <option value="rank">Efficiency Rank</option>
                <option value="utilizationPercentage">Utilization %</option>
                <option value="totalSanctioned">Sanctioned Outlay</option>
                <option value="name">MP Name</option>
              </select>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="sort-controls cursor-pointer hover:bg-slate-50 transition-colors"
              title="Toggle Sort Direction"
              style={{ padding: "0.5rem 0.85rem" }}
            >
              <ArrowUpDown size={15} />
              <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{sortOrder.toUpperCase()}</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="view-controls">
            <button
              onClick={() => setViewMode("grid")}
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              style={{
                padding: "8px 14px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              <LayoutGrid size={15} /> Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              style={{
                padding: "8px 14px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              <List size={15} /> Table
            </button>
          </div>
        </div>
      </div>

      {/* 4. MP Cards Grid / Table */}
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
      ) : viewMode === "grid" ? (
        <div className="mps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
          {filteredMPs.map((mp) => (
            <MPCard key={mp.mpId} mp={mp} onSelectMP={onSelectMP} />
          ))}
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  <TableColumnHeader
                    title="Rank"
                    field="rank"
                    currentSortField={sortField}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                    style={{ width: "90px" }}
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
                  />
                  <TableColumnHeader
                    title="Constituency"
                    field="constituency"
                    currentSortField={sortField}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                  />
                  <TableColumnHeader
                    title="Sanctioned"
                    field="totalSanctioned"
                    currentSortField={sortField}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                  />
                  <TableColumnHeader
                    title="Utilized"
                    field="totalUtilized"
                    currentSortField={sortField}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                  />
                  <TableColumnHeader
                    title="Utilization Rate"
                    field="utilizationPercentage"
                    currentSortField={sortField}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                    style={{ width: "170px" }}
                  />
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMPs.map((mp) => (
                  <tr
                    key={mp.mpId}
                    onClick={() => onSelectMP(mp)}
                    style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s" }}
                    className="hover:bg-blue-50/40"
                  >
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-secondary)" }}>
                      #{mp.rank}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{mp.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{mp.state}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className="house-badge">{mp.house}</span>
                      {mp.party && (
                        <span className="house-badge" style={{ background: "#eff6ff", color: "#1d4ed8", marginLeft: "4px" }}>
                          {mp.party}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)" }}>{mp.constituency}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                      {formatCurrency(mp.totalSanctioned)}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "#059669" }}>
                      {formatCurrency(mp.totalUtilized)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>
                        <span>{mp.utilizationPercentage}%</span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            borderRadius: "inherit",
                            background: mp.utilizationPercentage >= 70 ? "#059669" : mp.utilizationPercentage >= 40 ? "#d97706" : "#dc2626",
                            width: `${Math.min(100, mp.utilizationPercentage)}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMP(mp);
                        }}
                        style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#eff6ff", color: "var(--primary-600)", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        Dossier <ArrowRight size={13} />
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
