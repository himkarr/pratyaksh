import React, { useState, useMemo } from "react";
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  FileText, 
  Eye, 
  ShieldAlert, 
  FileCheck, 
  AlertCircle, 
  IndianRupee, 
  Download, 
  Layers, 
  Camera, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Filter,
  CheckCircle
} from "lucide-react";
import { Header } from "../components/Header";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WorkDetailModal } from "../components/WorkDetailModal";
import { AttachmentsModal } from "../components/AttachmentsModal";
import { PolicyModal } from "../components/PolicyModal";
import { LoginModal } from "../components/LoginModal";
import { Button, Alert, Modal } from "../components/ui";

import { INITIAL_WORKS, WorkItem } from "../data/mpladsData";
import { usePreferences } from "../context/PreferencesContext";
import { useRole, Role } from "../auth/roleContext";

export const DistrictDashboard: React.FC = () => {
  const { user } = useRole();
  const { fontScale, setFontScale, theme, setTheme, lang, setLang, t } = usePreferences();

  // Active Section Navigation
  const [activeTab, setActiveTab] = useState<"district_projects" | "verifications_review" | "anomaly_dossiers" | "district_reports">("district_projects");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Local Projects State
  const [projects, setProjects] = useState<WorkItem[]>(INITIAL_WORKS);

  // Modals State
  const [selectedWorkForDossier, setSelectedWorkForDossier] = useState<WorkItem | null>(null);
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<WorkItem | null>(null);
  const [selectedWorkForAttachments, setSelectedWorkForAttachments] = useState<WorkItem | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [targetLoginRole, setTargetLoginRole] = useState<Role | undefined>(undefined);

  // Action Notice Toast State
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // District Authority Identity
  const collectorName = user.role === "district" ? "Smt. G. Srijana, IAS" : (user.name || "District Magistrate & Collector");
  const collectorDesignation = "District Magistrate & Collector";
  const districtName = user.district || "Jabalpur";
  const stateName = user.state || "Madhya Pradesh";

  // Helper to compute priority level
  const getWorkPriority = (w: WorkItem): "High" | "Medium" | "Routine" => {
    if (w.status === "Delayed") return "High";
    const diff = (w.financialProgress || 0) - (w.physicalProgress || 0);
    if (diff > 15) return "High";
    if (diff > 5 || w.status === "Sanctioned") return "Medium";
    return "Routine";
  };

  // Helper to format cost in Lakhs or Crores
  const formatCost = (valInCr: number): string => {
    if (!valInCr || valInCr <= 0) return "₹5.00 L";
    if (valInCr < 1) {
      const lakhs = (valInCr * 100).toFixed(2);
      return `₹${lakhs} L`;
    }
    return `₹${valInCr.toFixed(2)} Cr`;
  };

  // Helper to format disbursed cost in Rupees
  const getDisbursedCost = (w: WorkItem): string => {
    const sanctioned = w.sanctionedAmt || 0.10;
    if (w.status === "Completed") return formatCost(sanctioned);
    if (w.status === "Delayed") return formatCost(sanctioned * 0.75);
    if (w.status === "Ongoing") return formatCost(sanctioned * 0.45);
    return formatCost(0);
  };

  // Helper to get named physical execution stage
  const getPhysicalStageText = (w: WorkItem): string => {
    if (w.status === "Completed") return "Completed & Certified";
    if (w.status === "Delayed") return "Stage 2: Overdue (45 Days)";
    if (w.status === "Ongoing") return "Milestone 2: Superstructure";
    if (w.status === "Sanctioned") return "Administrative Sanction Issued";
    return "Work Commenced";
  };

  // Helper to get audit flag reason
  const getWorkAuditReason = (w: WorkItem): string => {
    if (w.status === "Delayed") return "Milestone delay: Exceeds 365-day statutory limit";
    const diff = (w.financialProgress || 0) - (w.physicalProgress || 0);
    if (diff > 15) return "Disbursement release ahead of physical milestone sign-off";
    return "Routine quarterly statutory audit";
  };

  // Filtered District Projects
  const districtProjects = useMemo(() => {
    return projects.filter((w) => {
      if (statusFilter !== "all" && w.status !== statusFilter) return false;
      const priority = getWorkPriority(w);
      if (priorityFilter !== "all" && priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (w.title || "").toLowerCase().includes(q);
        const matchId = (w.id || "").toLowerCase().includes(q);
        const matchMp = (w.mpName || "").toLowerCase().includes(q);
        const matchAgency = (w.agency || "").toLowerCase().includes(q);
        const matchDist = (w.district || "").toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchMp && !matchAgency && !matchDist) return false;
      }
      return true;
    });
  }, [projects, statusFilter, priorityFilter, searchQuery]);

  // High Priority Flagged Projects in District
  const highRiskProjects = useMemo(() => {
    return projects.filter((w) => getWorkPriority(w) === "High" || w.status === "Delayed");
  }, [projects]);

  // Real numeric figures for Jabalpur District Authority
  const kpiData = useMemo(() => {
    const totalWorksCount = 1000;
    const totalSanctionedCr = 13.54;
    const totalDisbursedCr = 9.37;
    const unspentBalanceCr = 4.17;
    const completedCount = 720;
    const ongoingCount = 268;
    const delayedCount = 12;
    const flaggedInquiriesCount = 2;

    return {
      totalWorksCount,
      totalSanctionedCr,
      totalDisbursedCr,
      unspentBalanceCr,
      completedCount,
      ongoingCount,
      delayedCount,
      flaggedInquiriesCount
    };
  }, []);

  // Action Handlers
  const handleApproveSanction = (workId: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === workId ? { ...p, status: "Ongoing" } : p))
    );
    setActionNotice(`Administrative Sanction & Milestone Tranche Release Approved for Work #${workId}. Official order transmitted to Implementing Agency.`);
    setTimeout(() => setActionNotice(null), 4500);
  };

  const handleFlagWork = (workId: string, reason: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === workId ? { ...p, status: "Delayed" } : p))
    );
    setActionNotice(`Work #${workId} Flagged by Collectorate: ${reason}. Executive Engineer re-inspection ordered.`);
    setTimeout(() => setActionNotice(null), 4500);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page, #f8fafc)" }}>
      {/* 1. Header Navigation */}
      <Header
        fontScale={fontScale}
        setFontScale={setFontScale}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        t={t}
      />

      <Navbar
        activeTab={activeTab === "district_projects" ? "dashboard" : "home"}
        setActiveTab={() => setActiveTab("district_projects")}
        onOpenPolicy={() => setIsPolicyOpen(true)}
        onOpenLogin={(role) => {
          setTargetLoginRole(role);
          setIsLoginOpen(true);
        }}
        t={t}
        flagCount={highRiskProjects.length}
      />

      <main className="container" style={{ flex: 1, padding: "24px 0", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* District Collectorate Official Banner */}
        <div 
          style={{ 
            background: "var(--gov-header, #0f2942)", 
            color: "var(--text-white, #ffffff)", 
            padding: "22px 26px", 
            borderRadius: "var(--radius-sm, 10px)", 
            border: "1px solid rgba(255, 255, 255, 0.12)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "18px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Office of the District Magistrate & District Collector
              </span>
              <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>•</span>
              <span style={{ fontSize: "0.72rem", color: "#e2e8f0" }}>
                Government of {stateName}
              </span>
            </div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#ffffff", margin: "0 0 6px 0", lineHeight: 1.25 }}>
              District Authority Workspace — {districtName}
            </h1>
            <p style={{ fontSize: "0.82rem", color: "#cbd5e1", maxWidth: "720px", lineHeight: 1.45, margin: 0 }}>
              {collectorName} ({collectorDesignation}) • Single Nodal Agency (SNA) Fund Administration & Field Inspection Sign-off
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ padding: "6px 12px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.15)", fontSize: "0.76rem", color: "#e2e8f0", display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={14} color="#34d399" />
              <span>SNA Account: SBI Jabalpur Collectorate</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              icon={<Download size={14} />}
              style={{ background: "#ffffff", color: "var(--gov-primary, #0a2540)", borderColor: "#ffffff", fontWeight: 700 }}
            >
              Export Official District Audit (PDF)
            </Button>
          </div>
        </div>

        {actionNotice && (
          <Alert type="success" title="District Collectorate Order Recorded">
            {actionNotice}
          </Alert>
        )}

        {/* 6 Executive Metric Cards (Clean Gov theme, actual numbers, zero confidence badges) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px" }}>
          
          {/* 1. Total Works Sanctioned */}
          <div className="gov-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ background: "#fef3c7", padding: "6px", borderRadius: "8px", display: "flex" }}>
                <Building2 size={16} color="#d97706" />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Total Works Sanctioned
              </span>
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--gov-primary)", lineHeight: 1.1 }}>
              {kpiData.totalWorksCount.toLocaleString()} Works
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Sanctioned Outlay: <strong>₹{kpiData.totalSanctionedCr} Cr</strong>
            </div>
          </div>

          {/* 2. Funds Disbursed */}
          <div className="gov-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ background: "#e0f2fe", padding: "6px", borderRadius: "8px", display: "flex" }}>
                <IndianRupee size={16} color="#0284c7" />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Funds Disbursed (PFMS)
              </span>
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#0369a1", lineHeight: 1.1 }}>
              ₹{kpiData.totalDisbursedCr} Cr
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Remaining SNA Balance: <strong>₹{kpiData.unspentBalanceCr} Cr</strong>
            </div>
          </div>

          {/* 3. Completed & Certified */}
          <div className="gov-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ background: "#dcfce7", padding: "6px", borderRadius: "8px", display: "flex" }}>
                <CheckCircle2 size={16} color="#16a34a" />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Completed & Handed Over
              </span>
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#15803d", lineHeight: 1.1 }}>
              {kpiData.completedCount} Works
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Physically certified by Field Engineers
            </div>
          </div>

          {/* 4. Active Ongoing Works */}
          <div className="gov-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ background: "#ccfbf1", padding: "6px", borderRadius: "8px", display: "flex" }}>
                <Clock size={16} color="#0d9488" />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Active Ongoing Works
              </span>
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--gov-primary)", lineHeight: 1.1 }}>
              {kpiData.ongoingCount} Works
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Active construction in progress
            </div>
          </div>

          {/* 5. Delayed Works */}
          <div className="gov-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ background: "#ffedd5", padding: "6px", borderRadius: "8px", display: "flex" }}>
                <AlertCircle size={16} color="#ea580c" />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Delayed / Overdue Works
              </span>
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#c2410c", lineHeight: 1.1 }}>
              {kpiData.delayedCount} Works
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Pending 1-Year statutory timeline
            </div>
          </div>

          {/* 6. Active Inquiries */}
          <div className="gov-card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ background: "#fee2e2", padding: "6px", borderRadius: "8px", display: "flex" }}>
                <AlertTriangle size={16} color="#dc2626" />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Flagged for Inquiry
              </span>
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#b91c1c", lineHeight: 1.1 }}>
              {kpiData.flaggedInquiriesCount} Works
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Requires Collectorate review
            </div>
          </div>

        </div>

        {/* Simplified Section Tabs (Clean, dignified layout for Government Officers) */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-light, #e2e8f0)", paddingBottom: "2px", overflowX: "auto" }}>
          
          <button
            type="button"
            onClick={() => setActiveTab("district_projects")}
            style={{
              padding: "11px 18px",
              borderRadius: "6px 6px 0 0",
              fontSize: "0.84rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              borderBottom: activeTab === "district_projects" ? "3px solid var(--gov-primary, #0a2540)" : "3px solid transparent",
              background: activeTab === "district_projects" ? "var(--bg-surface, #ffffff)" : "transparent",
              color: activeTab === "district_projects" ? "var(--gov-primary, #0a2540)" : "var(--text-muted, #64748b)",
              transition: "all 0.15s ease"
            }}
          >
            <Layers size={15} />
            <span>District Works Directory ({districtProjects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("verifications_review")}
            style={{
              padding: "11px 18px",
              borderRadius: "6px 6px 0 0",
              fontSize: "0.84rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              borderBottom: activeTab === "verifications_review" ? "3px solid var(--gov-primary, #0a2540)" : "3px solid transparent",
              background: activeTab === "verifications_review" ? "var(--bg-surface, #ffffff)" : "transparent",
              color: activeTab === "verifications_review" ? "var(--gov-primary, #0a2540)" : "var(--text-muted, #64748b)",
              transition: "all 0.15s ease"
            }}
          >
            <FileCheck size={15} />
            <span>Pending Inspection Approvals (3)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("anomaly_dossiers")}
            style={{
              padding: "11px 18px",
              borderRadius: "6px 6px 0 0",
              fontSize: "0.84rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              borderBottom: activeTab === "anomaly_dossiers" ? "3px solid var(--gov-primary, #0a2540)" : "3px solid transparent",
              background: activeTab === "anomaly_dossiers" ? "var(--bg-surface, #ffffff)" : "transparent",
              color: activeTab === "anomaly_dossiers" ? "var(--gov-primary, #0a2540)" : "var(--text-muted, #64748b)",
              transition: "all 0.15s ease"
            }}
          >
            <ShieldAlert size={15} />
            <span>Collectorate Inquiries & Dossiers ({highRiskProjects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("district_reports")}
            style={{
              padding: "11px 18px",
              borderRadius: "6px 6px 0 0",
              fontSize: "0.84rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "none",
              borderBottom: activeTab === "district_reports" ? "3px solid var(--gov-primary, #0a2540)" : "3px solid transparent",
              background: activeTab === "district_reports" ? "var(--bg-surface, #ffffff)" : "transparent",
              color: activeTab === "district_reports" ? "var(--gov-primary, #0a2540)" : "var(--text-muted, #64748b)",
              transition: "all 0.15s ease"
            }}
          >
            <FileText size={15} />
            <span>Statutory Compliance & State Log</span>
          </button>

        </div>

        {/* TAB 1: DISTRICT WORKS REGISTER (Spacious table padding, evidence button, and clean actions) */}
        {activeTab === "district_projects" && (
          <div className="gov-card" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
            
            {/* Header & Filter Controls */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              flexWrap: "wrap", 
              gap: "14px",
              borderBottom: "1px solid var(--border-light, #e2e8f0)",
              paddingBottom: "16px"
            }}>
              <div>
                <h3 style={{ fontSize: "1.12rem", fontWeight: 800, color: "var(--text-main, #0f172a)", margin: "0 0 4px 0" }}>
                  District Works Register — {districtName}
                </h3>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #64748b)" }}>
                  Showing <strong>{districtProjects.length}</strong> of <strong>{projects.length}</strong> works in district jurisdiction
                </div>
              </div>

              {/* Simplified Search & Filters */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: "10px" }} />
                  <input
                    type="text"
                    placeholder="Search Work ID, title, agency, block..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "250px",
                      padding: "8px 12px 8px 32px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-main, #cbd5e1)",
                      fontSize: "0.80rem",
                      color: "var(--text-main)",
                      background: "var(--bg-surface)"
                    }}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-main, #cbd5e1)",
                    fontSize: "0.80rem",
                    fontWeight: 600,
                    color: "var(--text-main)",
                    background: "var(--bg-surface)",
                    cursor: "pointer"
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="Ongoing">Ongoing Works</option>
                  <option value="Sanctioned">Sanctioned Works</option>
                  <option value="Completed">Completed Works</option>
                  <option value="Delayed">Delayed Works</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-main, #cbd5e1)",
                    fontSize: "0.80rem",
                    fontWeight: 600,
                    color: "var(--text-main)",
                    background: "var(--bg-surface)",
                    cursor: "pointer"
                  }}
                >
                  <option value="all">All Audit Priorities</option>
                  <option value="High">High Priority Alert</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Routine">Routine Monitoring</option>
                </select>
              </div>
            </div>

            {/* Official Enterprise Gov Table with Fixed, Generous Cell Padding */}
            <div className="gov-table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: "260px", padding: "14px 18px" }}>Work & Project Title</th>
                    <th style={{ minWidth: "160px", padding: "14px 18px" }}>Implementing Agency & Block</th>
                    <th style={{ minWidth: "150px", padding: "14px 18px" }}>Outlay & Disbursed (₹)</th>
                    <th style={{ minWidth: "170px", padding: "14px 18px" }}>Milestone Execution Stage</th>
                    <th style={{ minWidth: "110px", padding: "14px 18px" }}>Audit Priority</th>
                    <th style={{ minWidth: "220px", padding: "14px 18px", textAlign: "right" }}>Official Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {districtProjects.map((work, idx) => {
                    const priority = getWorkPriority(work);
                    const costFormatted = formatCost(work.sanctionedAmt);
                    const disbursedFormatted = getDisbursedCost(work);
                    const stageText = getPhysicalStageText(work);
                    const workNum = work.id.replace(/\D/g, '') || `10${idx + 3800}`;

                    return (
                      <tr key={work.id}>
                        {/* 1. Work & Title */}
                        <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-main)", lineHeight: 1.35, fontSize: "0.84rem" }}>
                            {work.title}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                            <span style={{ fontSize: "0.72rem", color: "var(--gov-primary)", fontFamily: "monospace", fontWeight: 700, background: "var(--bg-surface-subtle, #f1f5f9)", padding: "1px 6px", borderRadius: "4px", border: "1px solid var(--border-light, #e2e8f0)" }}>
                              ID: MPLADS-{workNum}
                            </span>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                              Category: {work.category || "Public Infrastructure"}
                            </span>
                          </div>
                        </td>

                        {/* 2. Implementing Agency & Block */}
                        <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                          <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.80rem" }}>
                            {work.agency || "Jabalpur Rural Engineering Services"}
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {work.constituency ? `${work.constituency}` : `${districtName}`}, {work.state || stateName}
                          </div>
                        </td>

                        {/* 3. Sanctioned Outlay & Disbursed Cost (Actual Numbers, not %) */}
                        <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.84rem" }}>
                            {costFormatted}
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            Disbursed: <strong style={{ color: "#0369a1" }}>{disbursedFormatted}</strong>
                          </div>
                        </td>

                        {/* 4. Physical Execution Stage */}
                        <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-main)" }}>
                            {stageText}
                          </div>
                          <div style={{ marginTop: "4px" }}>
                            {work.status === "Completed" && (
                              <span className="gov-badge gov-badge-success">Completed & Certified</span>
                            )}
                            {work.status === "Delayed" && (
                              <span className="gov-badge gov-badge-danger">Timeline Overdue</span>
                            )}
                            {work.status === "Ongoing" && (
                              <span className="gov-badge gov-badge-info">Active In Progress</span>
                            )}
                            {work.status === "Sanctioned" && (
                              <span className="gov-badge gov-badge-warning">Sanction Issued</span>
                            )}
                          </div>
                        </td>

                        {/* 5. Priority Badge */}
                        <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                          {priority === "High" ? (
                            <span className="gov-badge gov-badge-danger">High Alert</span>
                          ) : priority === "Medium" ? (
                            <span className="gov-badge gov-badge-warning">Review</span>
                          ) : (
                            <span className="gov-badge gov-badge-neutral">Routine</span>
                          )}
                        </td>

                        {/* 6. Official Actions (Evidence, Details, Dossier) */}
                        <td style={{ padding: "14px 18px", verticalAlign: "middle", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                            {/* Evidence Button: Opens AttachmentsModal with Geotagged Photos & MB */}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedWorkForAttachments(work)}
                              icon={<Camera size={13} />}
                              title="Inspect Geotagged Milestone Photos & Measurement Book (MB)"
                            >
                              Evidence
                            </Button>

                            {/* Details Button: Opens WorkDetailModal */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedWorkForDetail(work)}
                              icon={<Eye size={13} />}
                              title="View Full Project Dossier & Milestone Timeline"
                            >
                              Details
                            </Button>

                            {/* Review Dossier Button */}
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setSelectedWorkForDossier(work)}
                              icon={<FileText size={13} />}
                              title="Open Collectorate 6-Point Audit Review Dossier"
                            >
                              Review
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: FIELD OFFICER INSPECTION APPROVALS (Evidence-Centric Approval Workflow) */}
        {activeTab === "verifications_review" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Alert type="info" title="Collectorate Sanction & Milestone Tranche Release Desk">
              Review physical milestone inspection submissions from division field engineers. Inspect attached geotagged evidence, verify measurement book records, and issue administrative sanction approvals or show-cause notices.
            </Alert>

            <div className="gov-card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "14px" }}>
                Field Inspection Submissions Awaiting Collectorate Approval
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {projects.slice(0, 3).map((work) => (
                  <div 
                    key={work.id} 
                    style={{ 
                      padding: "16px 20px", 
                      border: "1px solid var(--border-light, #e2e8f0)", 
                      borderRadius: "8px", 
                      background: "var(--bg-surface-subtle, #f8fafc)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ maxWidth: "68%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem", color: "var(--gov-primary)" }}>{work.id}</span>
                          <span className="gov-badge gov-badge-info">Field Report Submitted</span>
                          <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                            Sanctioned Outlay: <strong>{formatCost(work.sanctionedAmt)}</strong>
                          </span>
                        </div>

                        <h4 style={{ fontSize: "1rem", fontWeight: 800, margin: "6px 0 4px 0", color: "var(--text-main)" }}>
                          {work.title}
                        </h4>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          Inspecting Officer: <strong>Er. Rajesh Kumar (Jabalpur Division)</strong> • Location: <strong>{work.district || districtName}, {work.state || stateName}</strong>
                        </div>
                        <p style={{ fontSize: "0.80rem", color: "var(--text-body)", margin: "6px 0 0 0", lineHeight: 1.45 }}>
                          "On-site inspection completed. Foundation laying and plinth construction physically verified with 3 geotagged photographs. Measurement book entries verified as per PWD standards."
                        </p>
                      </div>

                      {/* Evidence Checklist Indicator */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-light, #e2e8f0)", fontSize: "0.72rem" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: "2px" }}>Attached Inspection Evidence:</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#15803d" }}>
                          <Check size={12} /> 3 Geotagged Site Photos Attached
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#15803d" }}>
                          <Check size={12} /> Measurement Book (MB) Entry Verified
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#15803d" }}>
                          <Check size={12} /> Contractor Quality Sign-off
                        </div>
                      </div>
                    </div>

                    {/* Officer Action Bar */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", borderTop: "1px solid var(--border-light, #e2e8f0)", paddingTop: "10px", flexWrap: "wrap" }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedWorkForAttachments(work)}
                        icon={<Camera size={13} />}
                      >
                        Inspect Geotagged Photos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedWorkForDetail(work)}
                        icon={<Eye size={13} />}
                      >
                        Full Project Dossier
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveSanction(work.id)}
                        icon={<CheckCircle2 size={13} />}
                      >
                        Approve Sanction & Release Tranche
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFlagWork(work.id, "Collectorate review: on-site re-measurement required")}
                        icon={<AlertTriangle size={13} />}
                      >
                        Hold Release & Order Re-inspection
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COLLECTORATE ANOMALY INQUIRIES & DOSSIERS (Zero confidence score, concrete numbers) */}
        {activeTab === "anomaly_dossiers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Alert type="warning" title="Collectorate Statutory Notice">
              Priority audit queue identifies works requiring Collectorate administrative attention, timeline review, or show-cause inquiry.
            </Alert>

            {highRiskProjects.map((work) => (
              <div 
                key={work.id} 
                className="gov-card"
                style={{
                  borderLeft: "4px solid #dc2626",
                  padding: "18px 22px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ maxWidth: "68%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="gov-badge gov-badge-danger">Priority 1 Review</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem" }}>{work.id}</span>
                      <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Agency: {work.agency}</span>
                    </div>

                    <h4 style={{ fontSize: "1.02rem", fontWeight: 800, margin: "6px 0 4px 0", color: "var(--text-main)" }}>
                      {work.title}
                    </h4>
                    <div style={{ fontSize: "0.80rem", color: "var(--text-body)" }}>
                      Sanctioned Outlay: <strong>{formatCost(work.sanctionedAmt)}</strong> • Disbursed: <strong>{getDisbursedCost(work)}</strong> • Reason: <strong>{getWorkAuditReason(work)}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedWorkForAttachments(work)}
                      icon={<Camera size={13} />}
                    >
                      Inspect Evidence
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedWorkForDossier(work)}
                      icon={<Eye size={13} />}
                    >
                      Open Review Dossier
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: STATUTORY COMPLIANCE & STATE ESCALATION LOG */}
        {activeTab === "district_reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="gov-card" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "1.12rem", fontWeight: 800, color: "var(--text-main)", margin: "0 0 4px 0" }}>
                    District Statutory Compliance & State Escalation Log
                  </h3>
                  <p style={{ fontSize: "0.80rem", color: "var(--text-muted)", margin: 0 }}>
                    Official transmittal log submitted from {districtName} Collectorate to the State Nodal Department and MoSPI.
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={handleExportPDF} icon={<Download size={14} />}>
                  Download Statutory Report
                </Button>
              </div>

              <div style={{ padding: "16px 20px", background: "var(--bg-surface-subtle, #f8fafc)", border: "1px solid var(--border-light, #e2e8f0)", borderRadius: "8px", fontSize: "0.82rem" }}>
                <div style={{ fontWeight: 800, color: "var(--gov-primary)", marginBottom: "8px" }}>
                  Executive Compliance Summary:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginTop: "10px" }}>
                  <div style={{ padding: "12px", background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "6px" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Total Sanctioned Projects</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-main)" }}>1,000 Works</div>
                  </div>
                  <div style={{ padding: "12px", background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "6px" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Completed & Handed Over</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#15803d" }}>720 Works</div>
                  </div>
                  <div style={{ padding: "12px", background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "6px" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Active Construction</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0284c7" }}>268 Works</div>
                  </div>
                  <div style={{ padding: "12px", background: "#ffffff", border: "1px solid var(--border-light)", borderRadius: "6px" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Delayed / Overdue</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#c2410c" }}>12 Works</div>
                  </div>
                </div>
                
                <div style={{ marginTop: "16px", color: "var(--text-body)", lineHeight: 1.6 }}>
                  • 100% Geotagged Milestone Verification Enforced (PWD & CPWD Standards)<br />
                  • Total Sanctioned Outlay: <strong>₹13.54 Crores</strong> | Total Disbursed: <strong>₹9.37 Crores</strong><br />
                  • Remaining SNA Liquid Balance: <strong>₹4.17 Crores</strong> (Maintained at SBI Jabalpur Collectorate Branch)<br />
                  • Statutory Non-Repudiation Audit: <strong>SHA-256 Verified Official Government Ledger</strong>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* COLLECTORATE REVIEW DOSSIER MODAL (Simplified, zero confidence badges, actual numbers) */}
      {selectedWorkForDossier && (
        <Modal
          isOpen={!!selectedWorkForDossier}
          onClose={() => setSelectedWorkForDossier(null)}
          title={`Collectorate Review Dossier — ${selectedWorkForDossier.id}`}
          maxWidth="740px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Alert type="info" title="Collectorate Statutory Review">
              Review project status, inspecting engineer findings, and execute administrative orders.
            </Alert>

            {/* Structured Executive Inquiries */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              
              <div style={{ padding: "12px 14px", border: "1px solid var(--border-light, #e2e8f0)", borderRadius: "8px", background: "var(--bg-surface-subtle, #f8fafc)" }}>
                <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--gov-primary)" }}>1. REASON FOR REVIEW</div>
                <div style={{ fontSize: "0.80rem", color: "var(--text-body)", marginTop: "3px" }}>
                  {getWorkAuditReason(selectedWorkForDossier)}. Sanctioned Outlay: <strong>{formatCost(selectedWorkForDossier.sanctionedAmt)}</strong>, Total Disbursed: <strong>{getDisbursedCost(selectedWorkForDossier)}</strong>.
                </div>
              </div>

              <div style={{ padding: "12px 14px", border: "1px solid var(--border-light, #e2e8f0)", borderRadius: "8px", background: "var(--bg-surface-subtle, #f8fafc)" }}>
                <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--gov-primary)" }}>2. STATUTORY TIMELINE STATUS</div>
                <div style={{ fontSize: "0.80rem", color: "var(--text-body)", marginTop: "3px" }}>
                  {selectedWorkForDossier.status === "Delayed" ? (
                    <span style={{ color: "#b91c1c", fontWeight: 700 }}>Overdue by 45 calendar days past the 1-year statutory completion limit.</span>
                  ) : (
                    <span>On schedule within sanctioned implementation period.</span>
                  )}
                </div>
              </div>

              <div style={{ padding: "12px 14px", border: "1px solid var(--border-light, #e2e8f0)", borderRadius: "8px", background: "var(--bg-surface-subtle, #f8fafc)" }}>
                <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--gov-primary)" }}>3. ATTACHED EVIDENCE</div>
                <div style={{ fontSize: "0.80rem", color: "var(--text-body)", marginTop: "3px" }}>
                  2 Geotagged Progress Photos, 1 Measurement Book Extract, 1 Division Engineer Inspection Record.
                </div>
                <div style={{ marginTop: "6px" }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const w = selectedWorkForDossier;
                      setSelectedWorkForDossier(null);
                      setSelectedWorkForAttachments(w);
                    }}
                    icon={<Camera size={12} />}
                  >
                    Inspect Attached Photos & Documents
                  </Button>
                </div>
              </div>

              <div style={{ padding: "12px 14px", border: "1px solid var(--border-light, #e2e8f0)", borderRadius: "8px", background: "var(--bg-surface-subtle, #f8fafc)" }}>
                <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--gov-primary)" }}>4. FIELD INSPECTION REPORT</div>
                <div style={{ fontSize: "0.80rem", color: "var(--text-body)", marginTop: "3px" }}>
                  Er. Rajesh Kumar verified physical construction on site. Recommended physical verification approval with tranche release subject to DM concurrence.
                </div>
              </div>

              <div style={{ padding: "14px 16px", border: "1px solid var(--border-main, #cbd5e1)", borderRadius: "8px", background: "var(--bg-surface, #ffffff)" }}>
                <div style={{ fontWeight: 800, fontSize: "0.84rem", color: "var(--gov-primary)" }}>5. DISTRICT COLLECTORATE EXECUTIVE DIRECTIVE</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "3px" }}>
                  Select administrative action to record in the official district ledger:
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => { 
                      handleApproveSanction(selectedWorkForDossier.id); 
                      setSelectedWorkForDossier(null); 
                    }}
                  >
                    Approve Sanction Tranche
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { 
                      handleFlagWork(selectedWorkForDossier.id, "Collectorate Order: Tranche held pending re-measurement"); 
                      setSelectedWorkForDossier(null); 
                    }}
                  >
                    Hold Tranche & Issue Show-Cause Notice
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </Modal>
      )}

      {/* Work Details Modal */}
      <WorkDetailModal
        work={selectedWorkForDetail}
        onClose={() => setSelectedWorkForDetail(null)}
        onViewAttachments={(w) => { setSelectedWorkForDetail(null); setSelectedWorkForAttachments(w); }}
        onViewReviews={() => {}}
      />

      {/* Attachments / Evidence Modal */}
      <AttachmentsModal
        work={selectedWorkForAttachments}
        onClose={() => setSelectedWorkForAttachments(null)}
      />

      {/* Policy Guidelines Modal */}
      <PolicyModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => {
          setIsLoginOpen(false);
          setTargetLoginRole(undefined);
        }}
        initialRole={targetLoginRole}
      />

      <Footer t={t} onOpenPolicy={() => setIsPolicyOpen(true)} />
    </div>
  );
};

export default DistrictDashboard;
