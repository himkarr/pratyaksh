import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, Filter, Landmark, MapPin, Calendar, Clock, 
  ArrowRight, LayoutGrid, List, Map as MapIcon,
  IndianRupee, Building, CheckCircle2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Plus, Sparkles
} from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { Input, Select, Button } from "../ui";
import { CitizenInteractiveMap } from "./CitizenInteractiveMap";

export interface CitizenProjectSearchProps {
  works: WorkItem[];
  onSelectWork: (work: WorkItem) => void;
  onReportProblem?: (work: WorkItem) => void;
  onOpenRecommendModal?: () => void;
  currentConstituency?: string;
}

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 per page" },
  { value: "15", label: "15 per page" },
  { value: "20", label: "20 per page" },
  { value: "50", label: "50 per page" }
];

export const CitizenProjectSearch: React.FC<CitizenProjectSearchProps> = ({ 
  works, 
  onSelectWork,
  onReportProblem,
  onOpenRecommendModal,
  currentConstituency = "Pune"
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("list");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [jumpPageInput, setJumpPageInput] = useState("");

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSector, selectedStatus, pageSize]);

  const filteredWorks = useMemo(() => {
    return works.filter((w) => {
      const matchesSearch =
        w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.constituency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.category && w.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSector =
        selectedSector === "all" ||
        (w.category && w.category.toLowerCase().includes(selectedSector.toLowerCase())) ||
        (w.sectorName && w.sectorName.toLowerCase().includes(selectedSector.toLowerCase()));

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "Ongoing" && (w.status === "Ongoing" || w.status === "Sanctioned")) ||
        w.status === selectedStatus;

      return matchesSearch && matchesSector && matchesStatus;
    });
  }, [works, searchTerm, selectedSector, selectedStatus]);

  // Pagination Calculations
  const totalItems = filteredWorks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedWorks = filteredWorks.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      handlePageChange(p);
      setJumpPageInput("");
    }
  };

  // Generate pagination pill items with smart ellipsis
  const paginationItems = useMemo(() => {
    const items: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (safePage > 3) {
        items.push("...");
      }
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) {
        items.push(i);
      }
      if (safePage < totalPages - 2) {
        items.push("...");
      }
      items.push(totalPages);
    }
    return items;
  }, [totalPages, safePage]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <span className="gov-badge gov-badge-success">Completed</span>;
      case "Delayed":
        return <span className="gov-badge gov-badge-danger">Delayed</span>;
      case "Ongoing":
        return <span className="gov-badge gov-badge-info">In Progress</span>;
      case "Sanctioned":
      case "Recommended":
        return <span className="gov-badge gov-badge-warning">Sanctioned</span>;
      default:
        return <span className="gov-badge gov-badge-neutral">{status}</span>;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", boxSizing: "border-box" }}>
      <style>{`
        .citizen-search-header {
          background: var(--bg-surface);
          padding: 16px 18px;
          border: 1px solid var(--border-main);
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-sizing: border-box;
        }

        .citizen-search-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .citizen-search-filters {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .citizen-search-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .citizen-pagination-bar {
          background: var(--bg-surface);
          border: 1px solid var(--border-main);
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          box-sizing: border-box;
        }

        .citizen-page-btn {
          min-width: 32px;
          height: 32px;
          padding: 0 6px;
          border-radius: 6px;
          border: 1px solid var(--border-main);
          background: var(--bg-surface);
          color: var(--text-main);
          font-size: 0.78rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .citizen-page-btn:hover:not(:disabled) {
          border-color: var(--gov-accent);
          background: var(--status-info-bg);
          color: var(--gov-accent);
        }

        .citizen-page-btn.active {
          background: var(--gov-primary);
          color: #ffffff;
          border-color: var(--gov-primary);
          font-weight: 700;
        }

        .citizen-page-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        @media (max-width: 960px) {
          .citizen-search-cards-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .citizen-search-header {
            padding: 12px 14px;
            gap: 10px;
          }
          .citizen-search-filters {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .citizen-search-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 10px;
          }
          .citizen-pagination-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
        }
      `}</style>

      {/* Top Banner: Propose Recommendation to MP */}
      {onOpenRecommendModal && (
        <div 
          style={{
            background: "linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(10, 37, 64, 0.06) 100%)",
            border: "1px solid rgba(5, 150, 105, 0.3)",
            borderRadius: "var(--radius-sm)",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "240px", flex: 1 }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(5, 150, 105, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", flexShrink: 0 }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--gov-primary)" }}>
                Need a new development project in your area?
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                Submit a work recommendation request with photo evidence for the Hon'ble MP to sponsor under MPLADS.
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onOpenRecommendModal}
            icon={<Plus size={14} />}
            style={{ background: "#059669", borderColor: "#047857", fontWeight: 700, whiteSpace: "nowrap" }}
          >
            Propose Work Recommendation
          </Button>
        </div>
      )}

      {/* Search & Filter Header */}
      <div className="citizen-search-header">
        <div className="citizen-search-top-row">
          <div>
            <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Landmark size={18} color="var(--gov-accent)" />
              Find Development Works
            </h3>
            <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
              Browse approved MPLADS public infrastructure works in {currentConstituency}
            </span>
          </div>

          {/* View Mode Toggle Switcher */}
          <div style={{ display: "inline-flex", background: "var(--bg-surface-subtle)", padding: "3px", borderRadius: "6px", border: "1px solid var(--border-main)" }}>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: viewMode === "list" ? 700 : 500,
                background: viewMode === "list" ? "var(--bg-surface)" : "transparent",
                color: viewMode === "list" ? "var(--gov-primary)" : "var(--text-muted)",
                boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer"
              }}
            >
              <List size={13} />
              <span>List View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("grid")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: viewMode === "grid" ? 700 : 500,
                background: viewMode === "grid" ? "var(--bg-surface)" : "transparent",
                color: viewMode === "grid" ? "var(--gov-primary)" : "var(--text-muted)",
                boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer"
              }}
            >
              <LayoutGrid size={13} />
              <span>Card Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("map")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: viewMode === "map" ? 700 : 500,
                background: viewMode === "map" ? "var(--bg-surface)" : "transparent",
                color: viewMode === "map" ? "var(--gov-primary)" : "var(--text-muted)",
                boxShadow: viewMode === "map" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer"
              }}
            >
              <MapIcon size={13} />
              <span>Map View</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="citizen-search-filters">
          <Input
            placeholder="Search by work name, locality, or sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={16} />}
          />

          <Select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            options={[
              { value: "all", label: "All Sectors" },
              { value: "road", label: "Roads & Bridges" },
              { value: "water", label: "Drinking Water & Sanitation" },
              { value: "community", label: "Community Centers & Halls" },
              { value: "education", label: "Education & Classrooms" },
              { value: "health", label: "Healthcare & Clinics" },
              { value: "solar", label: "Solar & Energy Assets" }
            ]}
          />

          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: "all", label: "All Work Statuses" },
              { value: "Ongoing", label: "In Progress" },
              { value: "Completed", label: "Completed" },
              { value: "Delayed", label: "Delayed" },
              { value: "Sanctioned", label: "Sanctioned" }
            ]}
          />
        </div>
      </div>

      {/* Result Count Bar & Page Size Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.80rem", color: "var(--text-muted)", padding: "0 4px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          Showing <strong>{totalItems === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of <strong>{totalItems}</strong> public development works
          {totalPages > 1 && <span> &bull; Page {safePage} of {totalPages}</span>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(""); setSelectedSector("all"); setSelectedStatus("all"); }}
              style={{ background: "none", border: "none", color: "var(--gov-accent)", cursor: "pointer", fontWeight: 600, fontSize: "0.78rem" }}
            >
              Clear filters
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Show:</span>
            <select
              value={String(pageSize)}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                border: "1px solid var(--border-main)",
                background: "var(--bg-surface)",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-main)",
                cursor: "pointer"
              }}
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredWorks.length === 0 && (
        <div
          style={{
            background: "var(--bg-surface)",
            padding: "36px 20px",
            textAlign: "center",
            borderRadius: "var(--radius-sm)",
            border: "1px dashed var(--border-main)"
          }}
        >
          <Landmark size={36} color="var(--text-muted)" style={{ margin: "0 auto 8px auto" }} />
          <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", margin: "0 0 4px 0" }}>
            No Development Works Found
          </h4>
          <p style={{ fontSize: "0.80rem", color: "var(--text-muted)", maxWidth: "400px", margin: "0 auto 12px auto" }}>
            No development works match your search criteria. Try using different keywords or propose this work to your MP.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <Button variant="secondary" size="sm" onClick={() => { setSearchTerm(""); setSelectedSector("all"); setSelectedStatus("all"); }}>
              Reset Filters
            </Button>
            {onOpenRecommendModal && (
              <Button variant="primary" size="sm" onClick={onOpenRecommendModal} icon={<Plus size={14} />}>
                Propose New Recommendation
              </Button>
            )}
          </div>
        </div>
      )}

      {/* View Containers with Smooth Animated Transitions */}
      <div key={viewMode} className="view-transition-container">
        {/* Map View Mode */}
        {viewMode === "map" && filteredWorks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
            <CitizenInteractiveMap
              works={filteredWorks}
              currentConstituency={currentConstituency}
              onSelectWork={onSelectWork}
              onReportProblem={onReportProblem}
            />
          </div>
        )}

        {/* Grid Cards View: Displays Paginated Slice (10-20 items per page) */}
        {viewMode === "grid" && paginatedWorks.length > 0 && (
          <div className="citizen-search-cards-grid">
            {paginatedWorks.map((work) => {
              const sanctioned = work.sanctionedAmt || work.recommendedAmt || 0;
              const spent = work.expenditureAmt || 0;
              const progress = work.physicalProgress || 0;

              return (
                <div
                  key={work.id}
                  className="card-hover-accent accent-sky cursor-pointer"
                  style={{
                    background: "var(--bg-surface, #ffffff)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-light, #e2e8f0)",
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    boxSizing: "border-box",
                  }}
                  onClick={() => onSelectWork(work)}
                >
                  <div>
                    {/* Top Category & Status Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "4px" }}>
                      <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.68rem" }}>
                        {work.sectorName || work.category || "Public Work"}
                      </span>
                      {getStatusBadge(work.status)}
                    </div>

                    {/* Project Title */}
                    <h4
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "var(--gov-primary)",
                        margin: "0 0 8px 0",
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                      title={work.title}
                    >
                      {work.title}
                    </h4>

                    {/* Metadata Items */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        <MapPin size={12} /> {work.constituency}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        <Building size={12} /> {work.house}
                      </span>
                    </div>
                  </div>

                  {/* Financial & Physical Progress Footer */}
                  <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "6px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Sanction: <strong>₹{sanctioned.toFixed(2)} Cr</strong></span>
                      <span style={{ fontWeight: 700, color: progress >= 80 ? "#10b981" : "#3b82f6" }}>{progress}% Complete</span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: "6px", background: "var(--bg-surface-subtle)", borderRadius: "9999px", overflow: "hidden", marginBottom: "12px" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${progress}%`,
                          background: progress >= 80 ? "#10b981" : progress >= 40 ? "#3b82f6" : "#f59e0b",
                          borderRadius: "9999px"
                        }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onSelectWork(work); }}
                        style={{ flex: 1, minHeight: "34px", fontSize: "0.78rem", fontWeight: 700 }}
                      >
                        Inspect Dossier
                      </Button>
                      {onReportProblem && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); onReportProblem(work); }}
                          style={{ minHeight: "34px", fontSize: "0.78rem", color: "#b91c1c", borderColor: "#fecaca" }}
                        >
                          Report
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View Mode: Displays Paginated Slice */}
        {viewMode === "list" && paginatedWorks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {paginatedWorks.map((work) => {
              const sanctioned = work.sanctionedAmt || work.recommendedAmt || 0;
              const spent = work.expenditureAmt || 0;
              const progress = work.physicalProgress || 0;

              return (
                <div
                  key={work.id}
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: "10px",
                    border: "1px solid var(--border-main)",
                    padding: "14px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    boxSizing: "border-box",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#93c5fd";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-main)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                  }}
                  onClick={() => onSelectWork(work)}
                >
                  <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" }}>
                      <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.66rem" }}>
                        {work.sectorName || work.category || "Work"}
                      </span>
                      {getStatusBadge(work.status)}
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        &bull; {work.constituency}
                      </span>
                    </div>
                    <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--gov-primary)", margin: "0 0 3px 0", wordBreak: "break-word" }}>
                      {work.title}
                    </h4>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      <span>Sanctioned: <strong>₹{sanctioned.toFixed(2)} Cr</strong></span>
                      <span>Spent: <strong>₹{spent.toFixed(2)} Cr</strong></span>
                      <span>Progress: <strong>{progress}%</strong></span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onSelectWork(work); }}
                    style={{ minHeight: "36px", fontWeight: 700 }}
                  >
                    View Details
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls Bar */}
      {totalPages > 1 && (
        <div className="citizen-pagination-bar">
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>Showing Page <strong>{safePage}</strong> of <strong>{totalPages}</strong></span>
            <span>({totalItems} total projects)</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
            {/* First Button */}
            <button
              type="button"
              className="citizen-page-btn"
              onClick={() => handlePageChange(1)}
              disabled={safePage <= 1}
              title="First Page"
            >
              <ChevronsLeft size={14} />
            </button>

            {/* Prev Button */}
            <button
              type="button"
              className="citizen-page-btn"
              onClick={() => handlePageChange(safePage - 1)}
              disabled={safePage <= 1}
              title="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Page Number Pills */}
            {paginationItems.map((item, idx) => {
              if (item === "...") {
                return (
                  <span key={`dots-${idx}`} style={{ padding: "0 4px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    ...
                  </span>
                );
              }
              const pageNum = Number(item);
              const isActive = pageNum === safePage;
              return (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  className={`citizen-page-btn ${isActive ? "active" : ""}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              type="button"
              className="citizen-page-btn"
              onClick={() => handlePageChange(safePage + 1)}
              disabled={safePage >= totalPages}
              title="Next Page"
            >
              <ChevronRight size={14} />
            </button>

            {/* Last Button */}
            <button
              type="button"
              className="citizen-page-btn"
              onClick={() => handlePageChange(totalPages)}
              disabled={safePage >= totalPages}
              title="Last Page"
            >
              <ChevronsRight size={14} />
            </button>

            {/* Quick Jump Input */}
            {totalPages > 5 && (
              <form onSubmit={handleJumpSubmit} style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginLeft: "6px" }}>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder="Go to"
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  style={{
                    width: "48px",
                    height: "30px",
                    padding: "0 6px",
                    borderRadius: "4px",
                    border: "1px solid var(--border-main)",
                    fontSize: "0.74rem",
                    textAlign: "center"
                  }}
                />
                <button
                  type="submit"
                  className="citizen-page-btn"
                  style={{ height: "30px", fontSize: "0.72rem", padding: "0 8px" }}
                >
                  Go
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenProjectSearch;
