import React, { useState, useRef, useEffect } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Check, Search } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface TableColumnHeaderProps {
  title: string;
  field?: string;
  sortKey?: string;
  currentSortField?: string;
  currentSortKey?: string;
  currentSortDirection?: "asc" | "desc";
  currentSortOrder?: "asc" | "desc";
  onSort?: (fieldOrKey: string) => void;
  filterOptions?: Array<string | FilterOption>;
  selectedFilter?: string;
  onFilterChange?: (value: string) => void;
  onSelectFilter?: (value: string) => void;
  align?: "left" | "center" | "right";
  style?: React.CSSProperties;
  className?: string;
  width?: string | number;
}

const TableColumnHeaderComponent: React.FC<TableColumnHeaderProps> = ({
  title,
  field,
  sortKey,
  currentSortField,
  currentSortKey,
  currentSortDirection,
  currentSortOrder,
  onSort,
  filterOptions,
  selectedFilter = "all",
  onFilterChange,
  onSelectFilter,
  align = "left",
  style,
  className = "",
  width,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  const activeSortKey = field || sortKey;
  const activeCurrentSort = currentSortField || currentSortKey;
  const activeSortDir = currentSortDirection || currentSortOrder || "asc";
  const handleFilterSelection = onFilterChange || onSelectFilter;

  const isSorted = Boolean(activeSortKey && activeCurrentSort === activeSortKey);
  const isFiltered = Boolean(
    filterOptions &&
    selectedFilter &&
    selectedFilter.toLowerCase() !== "all" &&
    selectedFilter !== ""
  );

  // Normalize filter options
  const normalizedOptions: FilterOption[] = (filterOptions || []).map((opt) => {
    if (typeof opt === "string") {
      return { label: opt, value: opt };
    }
    return opt;
  });

  // Close filter popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

  const displayedOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(filterSearch.toLowerCase())
  );

  return (
    <th
      style={{
        padding: "10px 14px",
        textAlign: align,
        width: width,
        position: "relative",
        userSelect: "none",
        ...style,
      }}
      className={className}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          justifyContent: align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start",
          width: "100%",
        }}
      >
        {/* Clickable Title & Sort Trigger */}
        <div
          onClick={() => {
            if (activeSortKey && onSort) {
              onSort(activeSortKey);
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            cursor: activeSortKey && onSort ? "pointer" : "default",
            color: isSorted ? "#1e293b" : "inherit",
            fontWeight: 700,
            transition: "color 0.15s ease",
          }}
          title={activeSortKey && onSort ? `Click to sort by ${title}` : undefined}
        >
          <span>{title}</span>
          {activeSortKey && onSort && (
            <span
              style={{
                display: "inline-flex",
                color: isSorted ? "#2563eb" : "#94a3b8",
                transition: "all 0.15s ease",
              }}
            >
              {isSorted ? (
                activeSortDir === "asc" ? (
                  <ArrowUp size={13} strokeWidth={2.5} />
                ) : (
                  <ArrowDown size={13} strokeWidth={2.5} />
                )
              ) : (
                <ArrowUpDown size={12} strokeWidth={1.75} style={{ opacity: 0.5 }} />
              )}
            </span>
          )}
        </div>

        {/* Filter Popover Button */}
        {normalizedOptions.length > 0 && handleFilterSelection && (
          <div style={{ position: "relative", display: "inline-flex" }} ref={popoverRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFilterOpen(!isFilterOpen);
              }}
              style={{
                background: isFiltered ? "#dbeafe" : "transparent",
                color: isFiltered ? "#1d4ed8" : "#94a3b8",
                border: isFiltered ? "1px solid #bfdbfe" : "1px solid transparent",
                borderRadius: "4px",
                padding: "2px 4px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              className="hover:bg-slate-100"
              title={isFiltered ? `Filtered: ${selectedFilter}` : `Filter by ${title}`}
            >
              <Filter size={11} strokeWidth={isFiltered ? 2.5 : 1.75} />
              {isFiltered && (
                <span
                  style={{
                    width: "4px",
                    height: "4px",
                    background: "#2563eb",
                    borderRadius: "50%",
                    marginLeft: "2px",
                  }}
                />
              )}
            </button>

            {/* Dropdown Popover */}
            {isFilterOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: align === "right" ? "auto" : 0,
                  right: align === "right" ? 0 : "auto",
                  zIndex: 999,
                  minWidth: "220px",
                  maxWidth: "280px",
                  background: "#ffffff",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  border: "1px solid #e2e8f0",
                  padding: "8px",
                  fontSize: "0.82rem",
                  color: "#1e293b",
                  textAlign: "left",
                }}
              >
                {/* Search in options if list is long */}
                {normalizedOptions.length > 5 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      marginBottom: "6px",
                    }}
                  >
                    <Search size={12} style={{ color: "#94a3b8" }} />
                    <input
                      type="text"
                      placeholder={`Search ${title}...`}
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        fontSize: "0.78rem",
                        color: "#1e293b",
                      }}
                    />
                    {filterSearch && (
                      <button
                        onClick={() => setFilterSearch("")}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          color: "#94a3b8",
                        }}
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                )}

                {/* Reset / All Option */}
                <button
                  type="button"
                  onClick={() => {
                    handleFilterSelection("all");
                    setIsFilterOpen(false);
                    setFilterSearch("");
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "none",
                    background:
                      !selectedFilter || selectedFilter.toLowerCase() === "all"
                        ? "#eff6ff"
                        : "transparent",
                    color:
                      !selectedFilter || selectedFilter.toLowerCase() === "all"
                        ? "#1d4ed8"
                        : "#475569",
                    fontWeight:
                      !selectedFilter || selectedFilter.toLowerCase() === "all" ? 700 : 500,
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    transition: "background 0.1s ease",
                  }}
                  className="hover:bg-slate-50"
                >
                  <span>All ({title})</span>
                  {(!selectedFilter || selectedFilter.toLowerCase() === "all") && (
                    <Check size={13} color="#2563eb" />
                  )}
                </button>

                <div
                  style={{
                    maxHeight: "180px",
                    overflowY: "auto",
                    margin: "4px 0",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "4px",
                  }}
                >
                  {displayedOptions.map((opt) => {
                    const isSelected =
                      selectedFilter?.toLowerCase() === opt.value.toLowerCase() ||
                      selectedFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          handleFilterSelection(opt.value);
                          setIsFilterOpen(false);
                          setFilterSearch("");
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "5px 8px",
                          borderRadius: "6px",
                          border: "none",
                          background: isSelected ? "#eff6ff" : "transparent",
                          color: isSelected ? "#1d4ed8" : "#334155",
                          fontWeight: isSelected ? 700 : 400,
                          cursor: "pointer",
                          fontSize: "0.78rem",
                          textAlign: "left",
                          transition: "background 0.1s ease",
                        }}
                        className="hover:bg-slate-50"
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {opt.label}
                        </span>
                        {isSelected && <Check size={12} color="#2563eb" />}
                      </button>
                    );
                  })}
                  {displayedOptions.length === 0 && (
                    <div
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        color: "#94a3b8",
                        fontSize: "0.74rem",
                      }}
                    >
                      No matches found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </th>
  );
};

export const TableColumnHeader = React.memo(TableColumnHeaderComponent);
export default TableColumnHeader;
