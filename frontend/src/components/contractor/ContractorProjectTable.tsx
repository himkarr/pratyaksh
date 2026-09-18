import React, { useState, useMemo } from "react";
import { Search, Calendar, Eye, AlertTriangle, Building2, Clock, List, LayoutGrid } from "lucide-react";
import { ContractorProject } from "../../data/contractorData";
import { Button } from "../ui/Button";

interface ContractorProjectTableProps {
  projects: ContractorProject[];
  onSelectProject: (project: ContractorProject) => void;
}

export const ContractorProjectTable: React.FC<ContractorProjectTableProps> = ({
  projects,
  onSelectProject
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.currentWorkStatus !== statusFilter && p.monitoringStatus !== statusFilter) {
        return false;
      }
      if (categoryFilter !== "all" && p.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        const matchDistrict = p.district.toLowerCase().includes(q);
        const matchAuth = p.implementingAuthority.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchDistrict && !matchAuth) return false;
      }
      return true;
    });
  }, [projects, statusFilter, categoryFilter, searchQuery]);

  const calculateDaysRemaining = (completionDateStr: string, currentStatus: string) => {
    if (currentStatus === "Completed") return 0;
    const target = new Date(completionDateStr);
    const today = new Date("2026-09-08"); // Current project date
    if (isNaN(target.getTime())) return null;
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatCurrency = (amtRs: number | null) => {
    if (amtRs === null || amtRs === undefined) return "Not available";
    if (amtRs >= 10000000) return `₹${(amtRs / 10000000).toFixed(2)} Cr`;
    return `₹${(amtRs / 100000).toFixed(2)} Lakh`;
  };

  const getWorkStatusBadge = (status: ContractorProject['currentWorkStatus']) => {
    switch (status) {
      case "InProgress":
        return <span className="gov-badge gov-badge-info">IN PROGRESS</span>;
      case "Completed":
        return <span className="gov-badge gov-badge-success">COMPLETED</span>;
      case "Delayed":
        return <span className="gov-badge gov-badge-danger">DELAYED</span>;
      case "Sanctioned":
      default:
        return <span className="gov-badge gov-badge-warning">SANCTIONED</span>;
    }
  };

  const getRiskBadge = (risk: ContractorProject['riskIndicator']) => {
    switch (risk) {
      case "Low Risk":
        return <span style={{ fontSize: "0.7rem", color: "var(--status-success-text)", fontWeight: 700 }}>🟢 Low Risk</span>;
      case "Delay Risk":
      case "Critical Delay":
        return <span style={{ fontSize: "0.7rem", color: "var(--status-danger-text)", fontWeight: 700 }}>🔴 {risk}</span>;
      default:
        return <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Not available</span>;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Search & Filter Toolbar */}
      <div 
        className="gov-card" 
        style={{ 
          padding: "12px 16px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          flexWrap: "wrap", 
          gap: "10px" 
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              className="gov-input"
              placeholder="Search Work ID, title, authority, district..."
              style={{ width: "250px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="gov-select"
            style={{ width: "160px" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Work Statuses</option>
            <option value="InProgress">In Progress</option>
            <option value="Sanctioned">Sanctioned</option>
            <option value="Completed">Completed</option>
            <option value="Delayed">Delayed</option>
          </select>

          <select
            className="gov-select"
            style={{ width: "160px" }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Roads">Roads</option>
            <option value="Drinking Water">Drinking Water</option>
            <option value="Education">Education</option>
            <option value="Health">Health</option>
            <option value="Community Assets">Community Assets</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Showing <strong>{filteredProjects.length}</strong> of <strong>{projects.length}</strong> assigned contracts
          </div>

          <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              style={{
                display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "6px", fontSize: "0.76rem",
                fontWeight: viewMode === "list" ? 700 : 500, border: "none",
                background: viewMode === "list" ? "#ffffff" : "transparent",
                color: viewMode === "list" ? "#0f172a" : "#64748b",
                boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer", transition: "all 0.15s ease"
              }}
            >
              <List size={13} />
              <span>Table View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              style={{
                display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "6px", fontSize: "0.76rem",
                fontWeight: viewMode === "grid" ? 700 : 500, border: "none",
                background: viewMode === "grid" ? "#ffffff" : "transparent",
                color: viewMode === "grid" ? "#0f172a" : "#64748b",
                boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer", transition: "all 0.15s ease"
              }}
            >
              <LayoutGrid size={13} />
              <span>Card Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Mode: Card Grid or Table View */}
      {viewMode === "grid" ? (
        filteredProjects.length === 0 ? (
          <div className="gov-card" style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
            No assigned projects match the selected search or filter criteria.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {filteredProjects.map((project) => {
              const daysRemaining = calculateDaysRemaining(project.officialExpectedCompletionDate, project.currentWorkStatus);
              return (
                <div
                  key={project.id}
                  className="gov-card card-hover-accent accent-sky cursor-pointer"
                  style={{
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "14px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    position: "relative"
                  }}
                  onClick={() => onSelectProject(project)}
                >
                  <div>
                    {/* Top: Category & Status Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span className="civic-badge civic-badge-neutral" style={{ fontSize: "0.72rem", fontWeight: 700 }}>
                        {project.category}
                      </span>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {getWorkStatusBadge(project.currentWorkStatus)}
                      </div>
                    </div>

                    {/* Title */}
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px", lineHeight: 1.35 }}>
                      {project.title}
                    </h4>

                    {/* Category & Authority */}
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                      Authority: {project.implementingAuthority}
                    </div>

                    {/* Timeline & Schedule Info */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "8px 10px", background: "var(--bg-surface-subtle, #f8fafc)", borderRadius: "6px", fontSize: "0.75rem", marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--text-muted)" }}>Target Date:</span>
                        <span style={{ fontWeight: 600 }}>{project.officialExpectedCompletionDate}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--text-muted)" }}>Timeline Status:</span>
                        {daysRemaining === null ? (
                          <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Not available</span>
                        ) : daysRemaining <= 0 ? (
                          <span style={{ fontWeight: 700, color: "var(--status-success-text)", fontSize: "0.74rem" }}>Completed</span>
                        ) : (
                          <span style={{ fontWeight: 700, color: daysRemaining < 30 ? "var(--status-danger-text)" : "var(--gov-primary)", fontSize: "0.74rem" }}>
                            ⏱️ {daysRemaining} Days Left
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--text-muted)" }}>Risk Signal:</span>
                        {getRiskBadge(project.riskIndicator)}
                      </div>
                    </div>

                    {/* Physical Progress */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", marginBottom: "4px" }}>
                        <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Physical Progress</span>
                        <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{project.physicalProgress}%</span>
                      </div>
                      <div style={{ width: "100%", height: "7px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${project.physicalProgress}%`,
                            height: "100%",
                            background: project.currentWorkStatus === "Completed" ? "#10b981" : project.currentWorkStatus === "Delayed" ? "#f59e0b" : "#3b82f6",
                            borderRadius: "4px"
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Sanction Amount & Action Button */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                    <div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Sanction Amount</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--gov-primary)" }}>
                        {formatCurrency(project.sanctionAmountRs)}
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(project);
                      }}
                      icon={<Eye size={13} />}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Main Government Assigned Projects Table */
        <div className="civic-card" style={{ overflowX: "auto", padding: 0, border: "1px solid var(--border-light)" }}>
          <table style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left", borderBottom: "2px solid var(--border-light)" }}>
                <th style={{ padding: "10px 12px" }}>Project Title & Description</th>
                <th style={{ padding: "10px 12px" }}>Sanction Amount</th>
                <th style={{ padding: "10px 12px" }}>Official Start Date</th>
                <th style={{ padding: "10px 12px" }}>Expected Completion Date</th>
                <th style={{ padding: "10px 12px" }}>Days Remaining</th>
                <th style={{ padding: "10px 12px" }}>Work Status</th>
                <th style={{ padding: "10px 12px" }}>Monitoring Status</th>
                <th style={{ padding: "10px 12px" }}>Risk / Delay</th>
                <th style={{ padding: "10px 12px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "28px", color: "var(--text-muted)" }}>
                    No assigned projects match the selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const daysRemaining = calculateDaysRemaining(project.officialExpectedCompletionDate, project.currentWorkStatus);
                  return (
                    <tr key={project.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      {/* Project Title */}
                      <td style={{ padding: "10px 12px", maxWidth: "260px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-main)", lineHeight: 1.3 }}>
                          {project.title}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          Category: {project.category} | Authority: {project.implementingAuthority}
                        </div>
                      </td>

                      {/* Sanction Amount */}
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--gov-primary)", whiteSpace: "nowrap" }}>
                        {formatCurrency(project.sanctionAmountRs)}
                      </td>

                      {/* Official Start Date */}
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontSize: "0.76rem" }}>
                        <div style={{ fontWeight: 600 }}>{project.officialStartDate}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Authority Schedule</div>
                      </td>

                      {/* Expected Completion Date */}
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontSize: "0.76rem" }}>
                        <div style={{ fontWeight: 600 }}>{project.officialExpectedCompletionDate}</div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Target Completion</div>
                      </td>

                      {/* Days Remaining */}
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {daysRemaining === null ? (
                          <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Not available</span>
                        ) : daysRemaining <= 0 ? (
                          <span style={{ fontWeight: 700, color: "var(--status-success-text)", fontSize: "0.78rem" }}>Completed</span>
                        ) : (
                          <span style={{ fontWeight: 700, color: daysRemaining < 30 ? "var(--status-danger-text)" : "var(--gov-primary)", fontSize: "0.8rem" }}>
                            ⏱️ {daysRemaining} Days
                          </span>
                        )}
                      </td>

                      {/* Current Work Status */}
                      <td style={{ padding: "10px 12px" }}>
                        {getWorkStatusBadge(project.currentWorkStatus)}
                      </td>

                      {/* Monitoring Status */}
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <span className="gov-badge gov-badge-info">
                          {project.monitoringStatus.toUpperCase()}
                        </span>
                      </td>

                      {/* Risk Indicator */}
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        {getRiskBadge(project.riskIndicator)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: "10px 12px" }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onSelectProject(project)}
                          icon={<Eye size={13} />}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
