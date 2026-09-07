import React, { useState } from "react";
import { 
  Search, Filter, Landmark, MapPin, Calendar, Clock, 
  ArrowRight, LayoutGrid, List, Map as MapIcon,
  IndianRupee, Building, CheckCircle2
} from "lucide-react";
import { WorkItem } from "../../data/mpladsData";
import { Input, Select, Button } from "../ui";
import { CitizenInteractiveMap } from "./CitizenInteractiveMap";

export interface CitizenProjectSearchProps {
  works: WorkItem[];
  onSelectWork: (work: WorkItem) => void;
  currentConstituency?: string;
}

export const CitizenProjectSearch: React.FC<CitizenProjectSearchProps> = ({ 
  works, 
  onSelectWork,
  currentConstituency = "Pune"
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");

  const filteredWorks = works.filter((w) => {
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
        }
      `}</style>

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
              <span>Cards</span>
            </button>

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
              <span>List</span>
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

      {/* Result Count Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.80rem", color: "var(--text-muted)", padding: "0 4px" }}>
        <span>Showing <strong>{filteredWorks.length}</strong> public development works</span>
        {searchTerm && (
          <button
            onClick={() => { setSearchTerm(""); setSelectedSector("all"); setSelectedStatus("all"); }}
            style={{ background: "none", border: "none", color: "var(--gov-accent)", cursor: "pointer", fontWeight: 600, fontSize: "0.78rem" }}
          >
            Clear filters
          </button>
        )}
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
            No development works match your search criteria. Try using different keywords or resetting filters.
          </p>
          <Button variant="secondary" size="sm" onClick={() => { setSearchTerm(""); setSelectedSector("all"); setSelectedStatus("all"); }}>
            Reset Filters
          </Button>
        </div>
      )}

      {/* Map View Mode */}
      {viewMode === "map" && filteredWorks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
          <CitizenInteractiveMap
            works={filteredWorks}
            currentConstituency={currentConstituency}
            onSelectWork={onSelectWork}
          />
        </div>
      )}

      {/* Grid Cards View: Maximum 3 Columns Layout on Desktop, 1 Column on Mobile */}
      {viewMode === "grid" && (
        <div className="citizen-search-cards-grid">
          {filteredWorks.map((work) => {
            const sanctioned = work.sanctionedAmt || work.recommendedAmt || 0;
            const spent = work.expenditureAmt || 0;
            const progress = work.physicalProgress || 0;

            return (
              <div
                key={work.id}
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-main)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "var(--shadow-card)",
                  boxSizing: "border-box"
                }}
              >
                <div>
                  {/* Top Category & Status Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "4px" }}>
                    <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.68rem" }}>
                      {work.sectorName || work.category || "Public Work"}
                    </span>
                    {getStatusBadge(work.status)}
                  </div>

                  {/* Work Title */}
                  <h4
                    style={{
                      fontSize: "0.96rem",
                      fontWeight: 800,
                      color: "var(--gov-primary)",
                      margin: "0 0 6px 0",
                      lineHeight: 1.35,
                      wordBreak: "break-word"
                    }}
                  >
                    {work.title}
                  </h4>

                  {/* Location */}
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "12px" }}>
                    <MapPin size={13} color="var(--gov-accent)" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {work.constituency}, {work.district}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", fontWeight: 700, marginBottom: "4px" }}>
                      <span style={{ color: "var(--text-body)" }}>Work Progress</span>
                      <span style={{ color: "var(--gov-accent)" }}>{progress}%</span>
                    </div>
                    <div style={{ width: "100%", height: "7px", background: "var(--border-light)", borderRadius: "4px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, progress))}%`,
                          height: "100%",
                          background: work.status === "Completed" ? "var(--status-success-text)" : (work.status === "Delayed" ? "var(--status-warning-text)" : "var(--gov-accent)"),
                          borderRadius: "4px"
                        }}
                      />
                    </div>
                  </div>

                  {/* Public Financial & Target Date Info */}
                  <div
                    style={{
                      background: "var(--bg-surface-subtle)",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-xs)",
                      fontSize: "0.74rem",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px",
                      marginBottom: "12px"
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block" }}>Sanctioned:</span>
                      <strong style={{ color: "var(--text-main)" }}>₹{sanctioned.toFixed(2)} Cr</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block" }}>Spent:</span>
                      <strong style={{ color: "var(--status-success-text)" }}>₹{spent.toFixed(2)} Cr</strong>
                    </div>
                    <div style={{ gridColumn: "1 / -1", paddingTop: "4px", borderTop: "1px dashed var(--border-light)", color: "var(--text-muted)" }}>
                      Target Date: <strong style={{ color: "var(--text-main)" }}>{work.targetCompletion || "2025-03-31"}</strong>
                    </div>
                  </div>
                </div>

                {/* Single Clean Action: View Details */}
                <div style={{ paddingTop: "10px", borderTop: "1px solid var(--border-light)" }}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onSelectWork(work)}
                    style={{ width: "100%", fontSize: "0.78rem", minHeight: "36px" }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact List View */}
      {viewMode === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredWorks.map((work) => {
            const sanctioned = work.sanctionedAmt || work.recommendedAmt || 0;
            const spent = work.expenditureAmt || 0;
            const progress = work.physicalProgress || 0;

            return (
              <div
                key={work.id}
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border-main)",
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                  boxSizing: "border-box"
                }}
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
                  onClick={() => onSelectWork(work)}
                  style={{ minHeight: "36px" }}
                >
                  View Details
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CitizenProjectSearch;
