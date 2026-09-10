import React, { useState, useMemo, useDeferredValue, useCallback } from "react";
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  Building,
  X,
} from "lucide-react";
import { StateSummary } from "../../../api/adminDataService";
import { StateCard } from "./StateCard";
import { StateCardList } from "./StateCardList";
import { TableColumnHeader } from "../../common/TableColumnHeader";

// High-performance static Indian Currency and Number formatters (reused across renders)
const inrExactFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const inrCompactFormatter = (amt: number): string => {
  if (!amt || isNaN(amt)) return "₹0";
  if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
  if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
  return `₹${inrExactFormatter.format(amt)}`;
};

const formatExactCurrency = (amt: number): string => {
  return `₹${inrExactFormatter.format(Math.round(amt || 0))}`;
};

interface StateListProps {
  states: StateSummary[];
  onSelectState: (stateName: string) => void;
  isLoading?: boolean;
  adminHouseFilter?: "both" | "Lok Sabha" | "Rajya Sabha";
  mps?: any[];
  projects?: any[];
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filterRange, setFilterRange] = useState<string>("all");

  // Single-pass National Rollup Header Stats calculation (O(N) single iteration)
  const nationalStats = useMemo(() => {
    let totalAllocated = 0;
    let totalExpenditure = 0;
    let totalWorks = 0;
    let completedWorks = 0;
    let inProgressWorks = 0;
    let sanctionedWorks = 0;
    let delayedWorks = 0;

    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      totalAllocated += s.totalAllocated || 0;
      totalExpenditure += s.totalExpenditure || 0;
      totalWorks += s.projectCount || 0;
      if (s.statusCounts) {
        completedWorks += s.statusCounts.Completed || 0;
        inProgressWorks += s.statusCounts.InProgress || 0;
        sanctionedWorks += s.statusCounts.Sanctioned || 0;
        delayedWorks += s.statusCounts.Delayed || 0;
      }
    }

    const unspentBalance = totalAllocated - totalExpenditure;
    const exactUtilization =
      totalAllocated > 0 ? ((totalExpenditure / totalAllocated) * 100).toFixed(2) : "0.00";

    return {
      totalStates: states.length,
      totalAllocated,
      totalExpenditure,
      unspentBalance,
      exactUtilization,
      totalWorks,
      completedWorks,
      inProgressWorks,
      sanctionedWorks,
      delayedWorks,
    };
  }, [states]);

  const handleSortChange = useCallback((field: string) => {
    setSortBy((prevField) => {
      if (prevField === field) {
        setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
        return prevField;
      } else {
        setSortOrder(field === "state" ? "asc" : "desc");
        return field;
      }
    });
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Optimized Filtering & Sorting with deferred non-blocking search
  const filteredStates = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    return states
      .filter((s) => {
        if (query && !s.state.toLowerCase().includes(query)) {
          return false;
        }
        if (filterRange === "high" && s.utilizationPercentage < 70) return false;
        if (
          filterRange === "medium" &&
          (s.utilizationPercentage < 40 || s.utilizationPercentage >= 70)
        ) {
          return false;
        }
        if (filterRange === "low" && s.utilizationPercentage >= 40) return false;
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        switch (sortBy) {
          case "rank":
            diff = a.rank - b.rank;
            break;
          case "utilizationPercentage":
            diff = a.utilizationPercentage - b.utilizationPercentage;
            break;
          case "totalAllocated":
            diff = a.totalAllocated - b.totalAllocated;
            break;
          case "totalExpenditure":
            diff = a.totalExpenditure - b.totalExpenditure;
            break;
          case "projectCount":
            diff = a.projectCount - b.projectCount;
            break;
          case "state":
            diff = a.state.localeCompare(b.state);
            break;
          default:
            diff = (a.rank || 0) - (b.rank || 0);
        }
        return sortOrder === "desc" ? -diff : diff;
      });
  }, [states, deferredSearchQuery, sortBy, sortOrder, filterRange]);

  return (
    <div className="states-page">
      {/* 1. Header & Live National Statistics */}
      <div
        className="states-header"
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
            State-wise MPLADS Performance & Allocations
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "4px 0 0 0" }}>
            Exact verified financial disbursements, certified expenditures, and works progress across all 36 States & Union Territories.
          </p>
        </div>

        {/* Text Metrics Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          {/* Sanctioned Outlay */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Sanctioned Outlay
            </span>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              {formatExactCurrency(nationalStats.totalAllocated)}
            </span>
            <span style={{ fontSize: "0.775rem", color: "#64748b" }}>
              Across {nationalStats.totalStates} States / UTs
            </span>
          </div>

          {/* Recorded Expenditure */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Recorded Expenditure
            </span>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#059669" }}>
              {formatExactCurrency(nationalStats.totalExpenditure)}
            </span>
            <span style={{ fontSize: "0.775rem", color: "#64748b" }}>
              Certified Disbursed
            </span>
          </div>

          {/* Unspent Treasury Balance */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Unspent Balance
            </span>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#d97706" }}>
              {formatExactCurrency(nationalStats.unspentBalance)}
            </span>
            <span style={{ fontSize: "0.775rem", color: "#64748b" }}>
              Available with District Nodal Auth
            </span>
          </div>

          {/* Fund Utilization Rate */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Fund Utilization
            </span>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2563eb" }}>
              {nationalStats.exactUtilization}%
            </span>
            <span style={{ fontSize: "0.775rem", color: "#64748b" }}>
              Weighted National Rate
            </span>
          </div>

          {/* Total Works Breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Works Portfolio
            </span>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              {inrExactFormatter.format(nationalStats.totalWorks)} Total Works
            </span>
            <span style={{ fontSize: "0.775rem", color: "#64748b" }}>
              {nationalStats.completedWorks} Done · {nationalStats.inProgressWorks} Ongoing
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search, Sort & View Mode Controls */}
      <div className="states-controls">
        <div className="search-section">
          <div className="states-search-box" style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
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
              placeholder="Search state or union territory..."
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
                onClick={handleClearSearch}
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

        <div className="control-buttons">
          {/* Performance Tier Select */}
          <div className="sort-controls">
            <label>Filter:</label>
            <select
              value={filterRange}
              onChange={(e) => setFilterRange(e.target.value)}
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
              onChange={(e) => handleSortChange(e.target.value)}
              className="sort-select"
            >
              <option value="utilizationPercentage">Fund Utilization</option>
              <option value="totalAllocated">Total Outlay</option>
              <option value="totalExpenditure">Recorded Spent</option>
              <option value="projectCount">Total Works</option>
              <option value="state">State Name</option>
            </select>
          </div>

          {/* Sort Direction Button */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
            className="sort-controls cursor-pointer hover:bg-slate-50 transition-colors"
            title={`Sort ${sortOrder === "desc" ? "Ascending" : "Descending"}`}
            style={{ padding: "0.5rem 0.85rem" }}
          >
            <ArrowUpDown size={15} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{sortOrder.toUpperCase()}</span>
          </button>

          {/* View Mode Toggle (Segmented Pill Switch) */}
          <div
            style={{
              display: "inline-flex",
              background: "#f1f5f9",
              padding: "3px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            {[
              { id: "list" as const, label: "Table View", icon: List },
              { id: "grid" as const, label: "Grid View", icon: LayoutGrid },
            ].map(({ id, label, icon: Icon }) => {
              const active = viewMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setViewMode(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: active ? "#ffffff" : "transparent",
                    color: active ? "#0f172a" : "#64748b",
                    fontWeight: active ? 700 : 500,
                    fontSize: "0.82rem",
                    boxShadow: active ? "0 1px 2px rgba(15,23,42,0.10)" : "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  aria-pressed={active}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. State Cards / Table View with Animated View Transition */}
      {isLoading ? (
        <div className="states-loading">
          <div className="loading-spinner" />
          <p>Loading live state governance data...</p>
        </div>
      ) : filteredStates.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "48px",
            textAlign: "center",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
          }}
        >
          <Building size={36} style={{ color: "var(--text-tertiary)", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>No states match your filter</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Try resetting your search query or choosing "All Performance Tiers".
          </p>
        </div>
      ) : (
        <div key={viewMode} className="view-transition-container">
          {viewMode === "grid" ? (
            <div
              className="states-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "20px",
              }}
            >
              {filteredStates.map((st) => (
                <StateCard
                  key={st.state}
                  stateData={st}
                  onSelectState={onSelectState}
                />
              ))}
            </div>
          ) : (
            <div
              className="state-table-container"
              style={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr
                      style={{
                        background: "#f8fafc",
                        borderBottom: "2px solid #e2e8f0",
                        fontSize: "0.8rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "#64748b",
                      }}
                    >
                      <TableColumnHeader
                        title="Rank"
                        field="rank"
                        currentSortField={sortBy}
                        currentSortDirection={sortOrder}
                        onSort={handleSortChange}
                        style={{ width: "80px", padding: "18px 24px" }}
                      />
                      <TableColumnHeader
                        title="State / Union Territory"
                        field="state"
                        currentSortField={sortBy}
                        currentSortDirection={sortOrder}
                        onSort={handleSortChange}
                        style={{ padding: "18px 24px" }}
                      />
                      <TableColumnHeader
                        title="Works Portfolio"
                        field="projectCount"
                        currentSortField={sortBy}
                        currentSortDirection={sortOrder}
                        onSort={handleSortChange}
                        style={{ padding: "18px 24px" }}
                      />
                      <TableColumnHeader
                        title="Sanctioned Outlay"
                        field="totalAllocated"
                        currentSortField={sortBy}
                        currentSortDirection={sortOrder}
                        onSort={handleSortChange}
                        style={{ padding: "18px 24px" }}
                      />
                      <TableColumnHeader
                        title="Expenditure"
                        field="totalExpenditure"
                        currentSortField={sortBy}
                        currentSortDirection={sortOrder}
                        onSort={handleSortChange}
                        style={{ padding: "18px 24px" }}
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
                        style={{ width: "220px", padding: "18px 24px" }}
                      />
                      <th
                        style={{
                          padding: "18px 24px",
                          textAlign: "right",
                          color: "#64748b",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Action
                      </th>
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
      )}
    </div>
  );
};

export default StateList;
