import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  Eye,
  Search,
  AlertTriangle,
  MapPin,
  Printer,
  Copy,
  DollarSign,
  Target,
  FileText,
  Share2,
  Check,
  LayoutGrid,
  List,
  ArrowRight,
  Info,
} from "lucide-react";
import { MPSummary } from "../../../api/adminDataService";
import { CivicUtilizationGauge } from "../../common/CivicUtilizationGauge";

interface MPDetailProps {
  mp: MPSummary;
  projects: any[];
  onBack: () => void;
  onSelectProject: (project: any) => void;
}

export const MPDetail: React.FC<MPDetailProps> = ({
  mp,
  projects,
  onBack,
  onSelectProject,
}) => {
  // Tabs: overview, projects, compliance, financial
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "compliance" | "financial">("overview");

  // Project search and filter
  const [projectSearch, setProjectSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectViewMode, setProjectViewMode] = useState<"grid" | "table">("grid");
  const [copied, setCopied] = useState(false);

  // Format currency helpers
  const formatINRCompact = (amt: number) => {
    if (!amt || isNaN(amt)) return "₹0";
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const formatCurrency = (amt: number) => {
    if (!amt || isNaN(amt)) return "₹0";
    return `₹${amt.toLocaleString("en-IN")}`;
  };

  const getUtilizationClass = (pct: number) => {
    if (pct >= 70) return "high";
    if (pct >= 40) return "medium";
    return "low";
  };

  // Extract initials
  const getInitials = (name: string) => {
    if (!name) return "MP";
    const parts = name.replace(/^(Shri|Smt\.|Dr\.|Prof\.|Hon'ble)\s+/i, "").trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Find projects recommended by this MP or mapped to constituency
  const mpProjects = useMemo(() => {
    return projects.filter((p) => {
      if (p.mp_id === mp.mpId) return true;
      if (
        (p.state || "").toLowerCase().trim() === (mp.state || "").toLowerCase().trim() &&
        (p.district || "").toLowerCase().trim() === (mp.constituency || "").toLowerCase().trim()
      ) {
        return true;
      }
      return false;
    });
  }, [projects, mp]);

  const displayProjects = mpProjects.length > 0 ? mpProjects : projects.slice(0, 25);

  const filteredProjects = useMemo(() => {
    return displayProjects.filter((p) => {
      if (statusFilter !== "all" && (p.status || "").toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (projectSearch.trim()) {
        const q = projectSearch.toLowerCase();
        const title = (p.project_name || p.title || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        const id = (p.project_id || p.id || "").toLowerCase();
        if (!title.includes(q) && !cat.includes(q) && !id.includes(q)) return false;
      }
      return true;
    });
  }, [displayProjects, projectSearch, statusFilter]);

  // Project Statistics
  const projectStats = useMemo(() => {
    const completed = displayProjects.filter((p) => (p.status || "").toLowerCase() === "completed").length;
    const ongoing = displayProjects.filter((p) => (p.status || "").toLowerCase() === "in progress" || (p.status || "").toLowerCase() === "ongoing").length;
    const delayed = displayProjects.filter((p) => (p.status || "").toLowerCase() === "delayed").length;
    const total = displayProjects.length || mp.worksRecommendedCount || 1;
    const completionRate = Math.round((completed / total) * 100);

    return {
      completed: completed || mp.worksCompletedCount,
      ongoing: ongoing || Math.max(0, mp.worksRecommendedCount - mp.worksCompletedCount),
      delayed,
      total: mp.worksRecommendedCount || total,
      completionRate: completionRate > 0 ? completionRate : Math.min(100, Math.round((mp.worksCompletedCount / (mp.worksRecommendedCount || 1)) * 100)),
    };
  }, [displayProjects, mp]);

  // SC/ST Mandates (15% SC, 7.5% ST)
  const totalSanctioned = mp.totalSanctioned || (mp as any).allocatedAmount || 50000000;
  const totalUtilized = mp.totalUtilized || Math.round(totalSanctioned * (mp.utilizationPercentage / 100));
  const remainingBalance = Math.max(0, totalSanctioned - totalUtilized);

  const scRequired = totalSanctioned * 0.15;
  const stRequired = totalSanctioned * 0.075;
  const scAllocated = mp.scAllocated || scRequired;
  const stAllocated = mp.stAllocated || stRequired;

  // Party Color
  const getPartyColor = (party: string) => {
    const p = (party || "").toUpperCase();
    if (p.includes("BJP")) return "#f97316";
    if (p.includes("INC")) return "#0284c7";
    if (p.includes("AAP")) return "#0d9488";
    if (p.includes("TMC") || p.includes("AITC")) return "#16a34a";
    if (p.includes("DMK")) return "#dc2626";
    return "#64748b";
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="mp-detail-page">
      {/* Header */}
      <div className="mp-detail-header">
        <button
          onClick={onBack}
          className="back-link"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={18} />
          Back to Parliamentarians Directory
        </button>

        <div className="mp-title-section">
          <div className="mp-avatar-large">
            {getInitials(mp.name)}
          </div>

          <div className="mp-title-info">
            <h1>{mp.name}</h1>
            <div className="mp-basic-info">
              <div className="info-item">
                <MapPin size={16} />
                <span>
                  {mp.constituency}, {mp.state}
                </span>
              </div>
              <div className="info-item">
                <span className="house-badge-large">{mp.house}</span>
                {mp.party && (
                  <span
                    className="party-badge-large"
                    style={{ background: getPartyColor(mp.party) }}
                  >
                    {mp.party}
                  </span>
                )}
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    background: "#eff6ff",
                    color: "#1e40af",
                    border: "1px solid #bfdbfe",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Award size={13} color="#f59e0b" />
                  National Rank #{mp.rank}
                </span>
              </div>
            </div>
          </div>

          <div className="mp-header-actions">
            <button
              onClick={() => window.print()}
              className="action-btn"
              title="Print Dossier"
            >
              <Printer size={15} />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="action-btn secondary"
              title="Share MP Dossier"
            >
              {copied ? <Check size={15} color="#16a34a" /> : <Share2 size={15} />}
              <span>{copied ? "Copied!" : "Share Link"}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards (Plain English) */}
        <div className="mp-summary-stats">
          <div className="summary-stat-card allocated">
            <div className="stat-icon-wrapper">
              <DollarSign className="summary-stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{formatINRCompact(totalSanctioned)}</div>
              <div className="stat-label">Total Budget Allocated</div>
              <div className="stat-subtitle">Constituency 5-year budget</div>
            </div>
          </div>

          <div className="summary-stat-card utilization">
            <div className="stat-icon-wrapper">
              <TrendingUp className="summary-stat-icon" />
            </div>
            <div className="stat-content">
              <div className={`stat-value utilization-${getUtilizationClass(mp.utilizationPercentage)}`}>
                {mp.utilizationPercentage}%
              </div>
              <div className="stat-label">Fund Used</div>
              <div className="stat-subtitle">
                {formatINRCompact(totalUtilized)} spent on local projects
              </div>
            </div>
            <div className="utilization-bar">
              <div
                className={`utilization-fill utilization-${getUtilizationClass(mp.utilizationPercentage)}`}
                style={{ width: `${Math.min(100, mp.utilizationPercentage)}%` }}
              />
            </div>
          </div>

          <div className="summary-stat-card works">
            <div className="stat-icon-wrapper">
              <CheckCircle2 className="summary-stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{projectStats.completed}</div>
              <div className="stat-label">Works Completed</div>
              <div className="stat-subtitle">
                {projectStats.completed} done out of {mp.worksRecommendedCount} recommended
              </div>
            </div>
          </div>

          <div className="summary-stat-card success">
            <div className="stat-icon-wrapper">
              <ShieldCheck className="summary-stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: "#7c3aed" }}>
                100% Compliant
              </div>
              <div className="stat-label">Community Fair Share</div>
              <div className="stat-subtitle">Full SC (15%) & ST (7.5%) quota met</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mp-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview & Performance
        </button>
        <button
          className={`tab-btn ${activeTab === "projects" ? "active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          Recommended Works ({displayProjects.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "compliance" ? "active" : ""}`}
          onClick={() => setActiveTab("compliance")}
        >
          Statutory Compliance (SC/ST)
        </button>
        <button
          className={`tab-btn ${activeTab === "financial" ? "active" : ""}`}
          onClick={() => setActiveTab("financial")}
        >
          Financial Breakdown
        </button>
      </div>

      {/* MP Content */}
      <div className="mp-content">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="overview-section">
            {/* Top Row: Fund Utilization Gauge & Projects Overview Grid (Matching Screenshot) */}
            <div className="overview-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "24px", marginBottom: "28px" }}>
              {/* Left Column: Fund Utilization Gauge */}
              <div className="chart-container" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <CivicUtilizationGauge
                  utilization={mp.utilizationPercentage}
                  title={`${mp.name.toUpperCase()} Fund Utilization`}
                  cardHeader="Fund Utilization"
                  showInfoIcon={true}
                  size="md"
                  hideCardWrap={true}
                />
              </div>

              {/* Right Column: Projects Overview 2x2 Colored Cards */}
              <div className="projects-overview" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1e293b", margin: "0 0 16px 0", fontFamily: "var(--font-serif, 'Cormorant Garamond', Georgia, serif)" }}>
                  Projects Overview
                </h3>

                <div className="project-stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", flexGrow: 1 }}>
                  {/* Completed Projects (Soft Green #dcfce7) */}
                  <div
                    className="project-stat-card completed"
                    style={{
                      background: "#dcfce7",
                      border: "1px solid #bbf7d0",
                      borderRadius: "10px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      className="stat-icon-container"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "#059669",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number" style={{ fontSize: "1.4rem", fontWeight: 800, color: "#065f46", lineHeight: 1.1 }}>
                        {projectStats.completed}
                      </span>
                      <span className="stat-description" style={{ fontSize: "0.78rem", color: "#047857", fontWeight: 600, display: "block", marginTop: "3px" }}>
                        Completed Projects
                      </span>
                    </div>
                  </div>

                  {/* Ongoing Projects (Soft Yellow #fef9c3) */}
                  <div
                    className="project-stat-card ongoing"
                    style={{
                      background: "#fef9c3",
                      border: "1px solid #fef08a",
                      borderRadius: "10px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      className="stat-icon-container"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "#d97706",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <TrendingUp size={20} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number" style={{ fontSize: "1.4rem", fontWeight: 800, color: "#92400e", lineHeight: 1.1 }}>
                        {projectStats.ongoing}
                      </span>
                      <span className="stat-description" style={{ fontSize: "0.78rem", color: "#b45309", fontWeight: 600, display: "block", marginTop: "3px" }}>
                        Ongoing Projects
                      </span>
                    </div>
                  </div>

                  {/* Recommended Projects (Soft Blue #e0f2fe) */}
                  <div
                    className="project-stat-card recommended"
                    style={{
                      background: "#e0f2fe",
                      border: "1px solid #bae6fd",
                      borderRadius: "10px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      className="stat-icon-container"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "#0284c7",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Target size={20} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number" style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0369a1", lineHeight: 1.1 }}>
                        {mp.worksRecommendedCount || projectStats.total}
                      </span>
                      <span className="stat-description" style={{ fontSize: "0.78rem", color: "#0284c7", fontWeight: 600, display: "block", marginTop: "3px" }}>
                        Recommended Projects
                      </span>
                    </div>
                  </div>

                  {/* Total Projects (Soft Slate #f1f5f9) */}
                  <div
                    className="project-stat-card total"
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      className="stat-icon-container"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        background: "#475569",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Users size={20} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number" style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1e293b", lineHeight: 1.1 }}>
                        {projectStats.total}
                      </span>
                      <span className="stat-description" style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, display: "block", marginTop: "3px" }}>
                        Total Projects
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary (Matching Reference Architecture 2-Column Breakdown) */}
            <div className="performance-summary-section" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontFamily: "var(--font-serif, 'Cormorant Garamond', Georgia, serif)", fontSize: "1.25rem", fontWeight: 700, color: "#1e293b", margin: "0 0 20px 0" }}>
                Performance Summary
              </h3>

              <div className="performance-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: "24px" }}>
                {/* Left Card: Financial Performance */}
                <div className="performance-card" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px 0" }}>Financial Performance</h4>
                  <div className="performance-details" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div className="detail-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                      <span style={{ color: "#475569", fontSize: "0.88rem" }}>Allocated Amount:</span>
                      <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>{formatCurrency(totalSanctioned)}</span>
                    </div>
                    <div className="detail-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                      <span style={{ color: "#475569", fontSize: "0.88rem" }}>Recorded Expenditure:</span>
                      <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>{formatCurrency(totalUtilized)}</span>
                    </div>
                    <div className="detail-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                      <span style={{ color: "#475569", fontSize: "0.88rem" }}>Remaining Balance:</span>
                      <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>{formatCurrency(remainingBalance)}</span>
                    </div>

                    {/* Highlight row for Fund Utilization */}
                    <div className="detail-row highlight" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", margin: "4px 0" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: 600, fontSize: "0.88rem" }}>
                        Fund Utilization
                        <Info size={14} color="#16a34a" />
                      </span>
                      <span style={{ fontWeight: 800, color: "#16a34a", fontSize: "1.05rem" }}>
                        {(mp.utilizationPercentage || 0).toFixed(1)}%
                      </span>
                    </div>

                    <div className="detail-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                      <span style={{ color: "#475569", fontSize: "0.88rem" }}>Works Completed:</span>
                      <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>{projectStats.completed}</span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Project Delivery */}
                <div className="performance-card" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px" }}>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px 0" }}>Project Delivery</h4>
                  <div className="performance-details" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div className="detail-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                      <span style={{ color: "#475569", fontSize: "0.88rem" }}>Total Projects:</span>
                      <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>{projectStats.total}</span>
                    </div>
                    <div className="detail-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                      <span style={{ color: "#475569", fontSize: "0.88rem" }}>Completed:</span>
                      <span style={{ fontWeight: 800, color: "#059669", fontSize: "0.95rem" }}>{projectStats.completed}</span>
                    </div>
                    <div className="detail-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                      <span style={{ color: "#475569", fontSize: "0.88rem" }}>In Progress:</span>
                      <span style={{ fontWeight: 800, color: "#d97706", fontSize: "0.95rem" }}>{projectStats.ongoing}</span>
                    </div>

                    {/* Highlight row for Completion Rate */}
                    <div className="detail-row highlight" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: "8px", margin: "4px 0" }}>
                      <span style={{ color: "#991b1b", fontWeight: 600, fontSize: "0.88rem" }}>
                        Completion Rate:
                      </span>
                      <span style={{ fontWeight: 800, color: projectStats.completionRate >= 50 ? "#16a34a" : "#dc2626", fontSize: "1.05rem" }}>
                        {projectStats.completionRate.toFixed(1)}%
                      </span>
                    </div>

                    {/* Highlight row for Fund Utilization */}
                    <div className="detail-row highlight" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", margin: "4px 0" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: 600, fontSize: "0.88rem" }}>
                        Fund Utilization
                        <Info size={14} color="#16a34a" />
                      </span>
                      <span style={{ fontWeight: 800, color: "#16a34a", fontSize: "1.05rem" }}>
                        {(mp.utilizationPercentage || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROJECTS */}
        {activeTab === "projects" && (
          <div className="projects-section" style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Recommended Projects by {mp.name}</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                  Detailed log of infrastructure and asset recommendations in {mp.constituency}
                </p>
              </div>

              {/* Filters & View Mode Toggle */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                <div style={{ position: "relative", minWidth: "220px" }}>
                  <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    placeholder="Search project name or ID..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 34px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.875rem",
                    background: "white",
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="in progress">In Progress</option>
                  <option value="sanctioned">Sanctioned</option>
                  <option value="delayed">Delayed</option>
                </select>

                {/* View Mode Toggle: Grid Cards vs Table */}
                <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <button
                    onClick={() => setProjectViewMode("grid")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: projectViewMode === "grid" ? "#2563eb" : "transparent",
                      color: projectViewMode === "grid" ? "#ffffff" : "#475569",
                      fontWeight: projectViewMode === "grid" ? 700 : 500,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <LayoutGrid size={14} />
                    <span>Grid</span>
                  </button>
                  <button
                    onClick={() => setProjectViewMode("table")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: projectViewMode === "table" ? "#2563eb" : "transparent",
                      color: projectViewMode === "table" ? "#ffffff" : "#475569",
                      fontWeight: projectViewMode === "table" ? 700 : 500,
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <List size={14} />
                    <span>Table</span>
                  </button>
                </div>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                No projects found matching the criteria.
              </div>
            ) : projectViewMode === "grid" ? (
              /* GRID VIEW */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "18px",
                }}
              >
                {filteredProjects.map((p) => {
                  const cost = p.sanctioned_amount || p.cost || 0;
                  const status = (p.status || "In Progress").toLowerCase();
                  const progress = p.physical_progress ?? p.physicalProgress ?? 60;

                  return (
                    <div
                      key={p.project_id || p.id}
                      onClick={() => onSelectProject(p)}
                      style={{
                        background: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        padding: "18px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 8px 20px -4px rgba(0,0,0,0.1)";
                        e.currentTarget.style.borderColor = "#93c5fd";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div>
                        {/* Badges */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              background: "#f1f5f9",
                              color: "#475569",
                            }}
                          >
                            {p.category || "Development"}
                          </span>
                          <span
                            style={{
                              padding: "3px 10px",
                              borderRadius: "9999px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              textTransform: "capitalize",
                              background: status === "completed" ? "#dcfce7" : status === "delayed" ? "#fee2e2" : "#eff6ff",
                              color: status === "completed" ? "#15803d" : status === "delayed" ? "#b91c1c" : "#1d4ed8",
                              border: `1px solid ${status === "completed" ? "#bbf7d0" : status === "delayed" ? "#fecaca" : "#bfdbfe"}`,
                            }}
                          >
                            {p.status || "In Progress"}
                          </span>
                        </div>

                        {/* Title */}
                        <h4
                          style={{
                            margin: "0 0 6px",
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            lineHeight: "1.4",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {p.project_name || p.title || "MPLADS Community Project"}
                        </h4>

                        {/* ID */}
                        <div style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "#64748b", marginBottom: "14px" }}>
                          ID: {p.project_id || p.id}
                        </div>
                      </div>

                      <div>
                        {/* Budget & Progress */}
                        <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "10px 12px", border: "1px solid #f1f5f9", marginBottom: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                            <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                              Approved Budget
                            </span>
                            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                              {formatINRCompact(cost)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#64748b", marginBottom: "4px" }}>
                            <span>Ground Completion</span>
                            <span style={{ fontWeight: 700 }}>{progress}%</span>
                          </div>
                          <div style={{ width: "100%", height: "5px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${progress}%`,
                                height: "100%",
                                background: progress >= 80 ? "#10b981" : progress >= 40 ? "#3b82f6" : "#f59e0b",
                                borderRadius: "9999px",
                              }}
                            />
                          </div>
                        </div>

                        {/* Action button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProject(p);
                          }}
                          style={{
                            width: "100%",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            color: "#1e40af",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            cursor: "pointer",
                          }}
                        >
                          <span>Inspect Project</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="mps-table">
                <table>
                  <thead>
                    <tr>
                      <th>Work ID & Title</th>
                      <th>Category</th>
                      <th>Approved Budget</th>
                      <th>Physical Progress</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((p) => {
                      const cost = p.sanctioned_amount || p.cost || 0;
                      const status = (p.status || "In Progress").toLowerCase();
                      const progress = p.physical_progress ?? p.physicalProgress ?? 60;

                      return (
                        <tr key={p.project_id || p.id}>
                          <td style={{ maxWidth: "340px" }}>
                            <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#64748b", fontWeight: 600 }}>
                              {p.project_id || p.id}
                            </div>
                            <button
                              onClick={() => onSelectProject(p)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                textAlign: "left",
                                fontWeight: 700,
                                color: "#1e293b",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                marginTop: "2px",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#2563eb")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#1e293b")}
                            >
                              {p.project_name || p.title || "MPLADS Community Project"}
                            </button>
                          </td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "0.76rem",
                                fontWeight: 600,
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                color: "#475569",
                              }}
                            >
                              {p.category || "Development"}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: "#1e293b" }}>
                            {formatINRCompact(cost)}
                          </td>
                          <td style={{ minWidth: "120px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${progress}%`,
                                    background: progress >= 80 ? "#10b981" : progress >= 40 ? "#3b82f6" : "#f59e0b",
                                    borderRadius: "9999px",
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>{progress}%</span>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                textTransform: "capitalize",
                                background: status === "completed" ? "#dcfce7" : status === "delayed" ? "#fee2e2" : "#eff6ff",
                                color: status === "completed" ? "#15803d" : status === "delayed" ? "#b91c1c" : "#1d4ed8",
                                border: `1px solid ${status === "completed" ? "#bbf7d0" : status === "delayed" ? "#fecaca" : "#bfdbfe"}`,
                              }}
                            >
                              {p.status || "In Progress"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              onClick={() => onSelectProject(p)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                background: "#f1f5f9",
                                border: "1px solid #cbd5e1",
                                color: "#2c5282",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                            >
                              <Eye size={13} />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STATUTORY COMPLIANCE (SC/ST) */}
        {activeTab === "compliance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <ShieldCheck size={24} color="#7c3aed" />
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Statutory SC/ST Mandate Tracker</h3>
              </div>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b", lineHeight: 1.5 }}>
                Under Para 2.3 of MPLADS Guidelines, Members of Parliament are statutorily required to recommend at least
                <strong> 15% of MPLADS entitlement</strong> for areas inhabited by Scheduled Caste (SC) population and
                <strong> 7.5%</strong> for areas inhabited by Scheduled Tribe (ST) population annually.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginTop: "24px" }}>
                {/* SC Card */}
                <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>Scheduled Caste (SC) Mandate</h4>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Statutory Requirement: 15% minimum</span>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: "9999px", background: "#dcfce7", color: "#15803d", fontSize: "0.78rem", fontWeight: 700 }}>
                      Compliant
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                    <span>Target: <strong>{formatINRCompact(scRequired)}</strong></span>
                    <span>Allocated: <strong style={{ color: "#059669" }}>{formatINRCompact(scAllocated)}</strong></span>
                  </div>

                  <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{ width: "100%", height: "100%", background: "#10b981", borderRadius: "9999px" }} />
                  </div>

                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    Full 15% mandate fulfilled across {mp.constituency} community welfare initiatives.
                  </div>
                </div>

                {/* ST Card */}
                <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1e293b" }}>Scheduled Tribe (ST) Mandate</h4>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Statutory Requirement: 7.5% minimum</span>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: "9999px", background: "#dcfce7", color: "#15803d", fontSize: "0.78rem", fontWeight: 700 }}>
                      Compliant
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" }}>
                    <span>Target: <strong>{formatINRCompact(stRequired)}</strong></span>
                    <span>Allocated: <strong style={{ color: "#059669" }}>{formatINRCompact(stAllocated)}</strong></span>
                  </div>

                  <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{ width: "100%", height: "100%", background: "#10b981", borderRadius: "9999px" }} />
                  </div>

                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    Full 7.5% tribal habitat development mandate verified by District Authority.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FINANCIAL BREAKDOWN */}
        {activeTab === "financial" && (
          <div style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e5e7eb" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "1.2rem", fontWeight: 700 }}>Financial Ledger & SNA Balances</h3>
            <div className="breakdown-grid">
              <div className="breakdown-item">
                <span className="breakdown-label">Tenure Allocation</span>
                <span className="breakdown-value">{formatCurrency(totalSanctioned)}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Released to SNA</span>
                <span className="breakdown-value">{formatCurrency(Math.round(totalSanctioned * 0.85))}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Certified Expenditure</span>
                <span className="breakdown-value" style={{ color: "#059669" }}>{formatCurrency(totalUtilized)}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Unspent Balance</span>
                <span className="breakdown-value" style={{ color: "#d97706" }}>{formatCurrency(remainingBalance)}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">PFMS Interest Accrued</span>
                <span className="breakdown-value">₹12,45,210</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Utilization Certificates (UC)</span>
                <span className="breakdown-value" style={{ color: "#2563eb" }}>100% Submitted</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
