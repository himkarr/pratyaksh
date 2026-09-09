import React, { useState, useMemo, useDeferredValue } from "react";
import {
  Search,
  LayoutGrid,
  List,
  TrendingUp,
  ArrowUpDown,
  Building,
  PieChart,
} from "lucide-react";
import { StateSummary } from "../../../api/adminDataService";
import { StateCard } from "./StateCard";
import { StateCardList } from "./StateCardList";
import { TableColumnHeader } from "../../common/TableColumnHeader";

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
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [sortBy, setSortBy] = useState<string>("utilizationPercentage");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterRange, setFilterRange] = useState<string>("all");

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

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "state" ? "asc" : "desc");
    }
  };

  // Filter & Sort
  const filteredStates = useMemo(() => {
    return states
      .filter((s) => {
        if (deferredSearchQuery.trim()) {
          const q = deferredSearchQuery.toLowerCase();
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
        if (sortBy === "rank") {
          diff = a.rank - b.rank;
        } else if (sortBy === "utilizationPercentage") {
          diff = a.utilizationPercentage - b.utilizationPercentage;
        } else if (sortBy === "totalAllocated") {
          diff = a.totalAllocated - b.totalAllocated;
        } else if (sortBy === "totalExpenditure") {
          diff = a.totalExpenditure - b.totalExpenditure;
        } else if (sortBy === "projectCount") {
          diff = a.projectCount - b.projectCount;
        } else if (sortBy === "state") {
          diff = a.state.localeCompare(b.state);
        }
        return sortOrder === "desc" ? -diff : diff;
      });
  }, [states, searchQuery, sortBy, sortOrder, filterRange]);

  return (
    <div className="states-page">
      {/* 1. Header & National Statistics */}
      <div className="states-header">
        <div className="header-content">
          <div className="title-row">
            <h1>State-wise MPLADS Performance</h1>
          </div>
          <p>Comprehensive overview of fund utilization across all Indian states and union territories</p>
        </div>

        <div className="national-stats">
          <div className="stat-box">
            <span className="stat-label">Total States / UTs</span>
            <span className="stat-value">{nationalStats.totalStates}</span>
            <span className="stat-period">36 Jurisdictions</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Outlay</span>
            <span className="stat-value">{formatCurrency(nationalStats.totalAllocated)}</span>
            <span className="stat-period">Sanctioned Outlay</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Recorded Expenditure</span>
            <span className="stat-value" style={{ color: "#059669" }}>
              {formatCurrency(nationalStats.totalExpenditure)}
            </span>
            <span className="stat-period">Certified Spent</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">National Utilization</span>
            <span className="stat-value">{nationalStats.avgUtilization}%</span>
            <span className="stat-period">Weighted Average</span>
          </div>
        </div>
      </div>

      {/* 2. Performance Insights Banner */}
      <div className="performance-insights">
        <div className="insights-grid">
          <div
            className={`insight-card cursor-pointer ${filterRange === "high" ? "active ring-2 ring-emerald-500" : ""}`}
            onClick={() => setFilterRange(filterRange === "high" ? "all" : "high")}
          >
            <div className="insight-icon high">
              <TrendingUp size={22} />
            </div>
            <div className="insight-content">
              <h3>High Performers</h3>
              <p className="insight-count">
                {states.filter((s) => s.utilizationPercentage >= 80).length}
              </p>
              <p className="insight-desc">States with &gt;= 80% utilization</p>
            </div>
          </div>

          <div
            className={`insight-card cursor-pointer ${filterRange === "medium" ? "active ring-2 ring-amber-500" : ""}`}
            onClick={() => setFilterRange(filterRange === "medium" ? "all" : "medium")}
          >
            <div className="insight-icon medium">
              <PieChart size={22} />
            </div>
            <div className="insight-content">
              <h3>Average Performers</h3>
              <p className="insight-count">
                {states.filter((s) => s.utilizationPercentage >= 50 && s.utilizationPercentage < 80).length}
              </p>
              <p className="insight-desc">States with 50% - 79% utilization</p>
            </div>
          </div>

          <div
            className={`insight-card cursor-pointer ${filterRange === "low" ? "active ring-2 ring-rose-500" : ""}`}
            onClick={() => setFilterRange(filterRange === "low" ? "all" : "low")}
          >
            <div className="insight-icon low">
              <Building size={22} />
            </div>
            <div className="insight-content">
              <h3>Needs Attention</h3>
              <p className="insight-count">
                {states.filter((s) => s.utilizationPercentage < 50).length}
              </p>
              <p className="insight-desc">States with &lt; 50% utilization</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search, Sort & View Mode Controls */}
      <div className="states-controls">
        <div className="search-section">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search state or union territory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="control-buttons">
          {/* Performance Tier Select */}
          <div className="sort-controls">
            <label>Filter:</label>
            <select
              value={filterRange}
              onChange={(e: any) => setFilterRange(e.target.value)}
              className="sort-select"
            >
              <option value="all">All Tiers (36)</option>
              <option value="high">High (&gt;= 70%)</option>
              <option value="medium">Average (40% - 69%)</option>
              <option value="low">Needs Attention (&lt; 40%)</option>
            </select>
          </div>

          {/* Sort By Select */}
          <div className="sort-controls">
            <label>Sort:</label>
            <select
              value={sortBy}
              onChange={(e: any) => handleSortChange(e.target.value)}
              className="sort-select"
            >
              <option value="utilizationPercentage">Fund Utilization</option>
              <option value="totalAllocated">Total Outlay</option>
              <option value="totalExpenditure">Recorded Spent</option>
              <option value="projectCount">Total Works</option>
              <option value="state">State Name</option>
            </select>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="sort-controls cursor-pointer hover:bg-slate-50 transition-colors"
            title={`Sort ${sortOrder === "desc" ? "Ascending" : "Descending"}`}
            style={{ padding: "0.5rem 0.85rem" }}
          >
            <ArrowUpDown size={15} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{sortOrder.toUpperCase()}</span>
          </button>

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

      {/* 4. State Cards / Table View */}
      {isLoading ? (
        <div className="states-loading">
          <div className="loading-spinner" />
          <p>Loading live state governance data...</p>
        </div>
      ) : filteredStates.length === 0 ? (
        <div style={{ background: "white", padding: "48px", textAlign: "center", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <Building size={36} style={{ color: "var(--text-tertiary)", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>No states match your filter</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Try resetting your search query or choosing "All Performance Tiers".
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="states-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {filteredStates.map((st) => (
            <StateCard
              key={st.state}
              stateData={st}
              onSelectState={onSelectState}
            />
          ))}
        </div>
      ) : (
        <div className="state-table-container" style={{ background: "white", borderRadius: "12px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  <TableColumnHeader
                    title="Rank"
                    field="rank"
                    currentSortField={sortBy}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                    style={{ width: "80px" }}
                  />
                  <TableColumnHeader
                    title="State / Union Territory"
                    field="state"
                    currentSortField={sortBy}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                  />
                  <TableColumnHeader
                    title="Works Portfolio"
                    field="projectCount"
                    currentSortField={sortBy}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                  />
                  <TableColumnHeader
                    title="Sanctioned Outlay"
                    field="totalAllocated"
                    currentSortField={sortBy}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                  />
                  <TableColumnHeader
                    title="Expenditure"
                    field="totalExpenditure"
                    currentSortField={sortBy}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                  />
                  <TableColumnHeader
                    title="Utilization Rate"
                    field="utilizationPercentage"
                    currentSortField={sortBy}
                    currentSortDirection={sortOrder}
                    onSort={handleSortChange}
                    filterOptions={[
                      { label: "All Tiers", value: "all" },
                      { label: "High (>= 70%)", value: "high" },
                      { label: "Average (40-69%)", value: "medium" },
                      { label: "Needs Attention (< 40%)", value: "low" },
                    ]}
                    selectedFilter={filterRange}
                    onFilterChange={setFilterRange}
                    style={{ width: "190px" }}
                  />
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 700 }}>Action</th>
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
