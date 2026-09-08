import React, { useState, useMemo } from "react";
import { Search, Calendar, Eye, AlertTriangle, Building2, Clock } from "lucide-react";
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

        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          Showing <strong>{filteredProjects.length}</strong> of <strong>{projects.length}</strong> assigned contracts
        </div>
      </div>

      {/* Main Government Assigned Projects Table */}
      <div className="gov-card" style={{ overflowX: "auto" }}>
        <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
              <th style={{ padding: "10px 12px" }}>Work ID</th>
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
                <td colSpan={10} style={{ textAlign: "center", padding: "28px", color: "var(--text-muted)" }}>
                  No assigned projects match the selected search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => {
                const daysRemaining = calculateDaysRemaining(project.officialExpectedCompletionDate, project.currentWorkStatus);
                return (
                  <tr key={project.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    {/* Work ID */}
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, color: "var(--gov-primary)", whiteSpace: "nowrap" }}>
                      {project.id}
                    </td>

                    {/* Project Title */}
                    <td style={{ padding: "10px 12px", maxWidth: "240px" }}>
                      <div style={{ fontWeight: 700, color: "var(--text-main)", lineHeight: 1.3 }}>
                        {project.title}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        Authority: {project.implementingAuthority}
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
    </div>
  );
};
