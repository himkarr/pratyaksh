import React, { useState, useMemo, useEffect } from "react";
import { 
  Landmark, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  FileText, 
  Eye, 
  RefreshCw, 
  ShieldAlert, 
  BarChart2, 
  Layers, 
  Sliders, 
  TrendingUp, 
  Send, 
  Building2, 
  Building,
  Database,
  Download,
  List,
  LayoutGrid
} from "lucide-react";
import { Header } from "../components/Header";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WorkDetailModal } from "../components/WorkDetailModal";
import { AttachmentsModal } from "../components/AttachmentsModal";
import { ReviewRatingModal } from "../components/ReviewRatingModal";
import { PolicyModal } from "../components/PolicyModal";
import { LoginModal } from "../components/LoginModal";
import { Button, Alert } from "../components/ui";

import { INITIAL_WORKS, WorkItem, WorkReview } from "../data/mpladsData";
import { usePreferences } from "../context/PreferencesContext";
import { useRole, Role } from "../auth/roleContext";
import { adminDataService, StateSummary } from "../api/adminDataService";

export const StateNodalDashboard: React.FC = () => {
  const { user } = useRole();
  const { fontScale, setFontScale, theme, setTheme, lang, setLang, t } = usePreferences();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"state_projects" | "district_performance" | "escalations" | "state_reports">("state_projects");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // State Selection & Live Supabase Data
  const [availableStates, setAvailableStates] = useState<StateSummary[]>([]);
  const [selectedState, setSelectedState] = useState<string>(() => user.state || "Madhya Pradesh");
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  // Comprehensive State Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedMp, setSelectedMp] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("all");
  const [selectedDeadlineRisk, setSelectedDeadlineRisk] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Projects State
  const [projects, setProjects] = useState<WorkItem[]>(INITIAL_WORKS);

  // Selected Modals
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<WorkItem | null>(null);
  const [selectedWorkForAttachments, setSelectedWorkForAttachments] = useState<WorkItem | null>(null);
  const [selectedWorkForReviews, setSelectedWorkForReviews] = useState<WorkItem | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [targetLoginRole, setTargetLoginRole] = useState<Role | undefined>(undefined);

  // Toast Notification
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // State Nodal Info
  const stateDepartment = user.name || "State Nodal Department — Planning Dept";

  // Hydrate states and projects from live Supabase
  useEffect(() => {
    async function loadLiveData() {
      try {
        const [statesData, liveProjs] = await Promise.all([
          adminDataService.getStateSummaries(),
          adminDataService.getRawProjects()
        ]);

        if (statesData && statesData.length > 0) {
          setAvailableStates(statesData);
          // If selectedState is not in list, pick the first
          if (!statesData.some(s => s.state.toLowerCase() === selectedState.toLowerCase())) {
            setSelectedState(statesData[0].state);
          }
        }

        if (liveProjs && liveProjs.length > 0) {
          const mapped: WorkItem[] = liveProjs.map((p, idx) => ({
            id: p.project_id || p.id || `LIVE-${idx}`,
            title: p.project_name || p.title || "MPLADS Infrastructure Work",
            house: "Lok Sabha",
            state: p.state || "Madhya Pradesh",
            district: p.district || "Jabalpur",
            constituency: p.district || "Constituency",
            constituency_code: "STATE-01",
            mpName: "State Parliamentary Representative",
            category: p.category || "Public Works",
            sectorName: p.category || "Infrastructure",
            recommendedAmt: Number(p.sanctioned_amount || 1000000) / 10000000,
            sanctionedAmt: Number(p.sanctioned_amount || 1000000) / 10000000,
            expenditureAmt: Number(p.utilized_amount || 500000) / 10000000,
            physicalProgress: p.progress_percentage || (p.status === "Completed" ? 100 : 50),
            financialProgress: Math.round(
              ((Number(p.utilized_amount || 0)) / Math.max(1, Number(p.sanctioned_amount || 1))) * 100
            ) || 45,
            dateSanctioned: p.start_date || "2024-04-01",
            targetCompletion: p.expected_completion_date || "2025-06-30",
            status: (p.status || "Ongoing") as any,
            agency: "State PWD & Rural Engineering Dept",
            contractor: "State Registered Contractor",
            rating: 4.8,
            reviewsCount: 1,
            attachments: [],
            reviews: []
          }));

          setProjects(mapped);
          setIsLiveConnected(true);
        }
      } catch (err) {
        console.warn("State Nodal live data fetch fallback:", err);
      }
    }
    loadLiveData();
  }, []);

  // Filter projects strictly belonging to selected State (with fallback if state has few)
  const projectsInSelectedState = useMemo(() => {
    const matched = projects.filter((w) => w.state && w.state.toLowerCase() === selectedState.toLowerCase());
    return matched.length > 0 ? matched : projects;
  }, [projects, selectedState]);

  // Filtered State Projects
  const filteredStateProjects = useMemo(() => {
    return projectsInSelectedState.filter((w) => {
      if (selectedDistrict !== "all" && w.district !== selectedDistrict) return false;
      if (selectedMp !== "all" && w.mpName !== selectedMp) return false;
      if (selectedStatus !== "all" && w.status !== selectedStatus) return false;
      
      const isHighRisk = w.status === "Delayed" || (w.financialProgress || 0) > (w.physicalProgress || 0) + 15;
      if (selectedRiskLevel === "HIGH" && !isHighRisk) return false;
      if (selectedRiskLevel === "LOW" && isHighRisk) return false;

      if (selectedDeadlineRisk === "DELAYED" && w.status !== "Delayed") return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (w.title || "").toLowerCase().includes(q);
        const matchId = (w.id || "").toLowerCase().includes(q);
        const matchDist = (w.district || "").toLowerCase().includes(q);
        const matchMp = (w.mpName || "").toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchDist && !matchMp) return false;
      }
      return true;
    });
  }, [projectsInSelectedState, selectedDistrict, selectedMp, selectedStatus, selectedRiskLevel, selectedDeadlineRisk, searchQuery]);

  // High Risk Projects across State
  const stateHighRiskProjects = useMemo(() => {
    return projectsInSelectedState.filter((w) => w.status === "Delayed" || (w.financialProgress || 0) > (w.physicalProgress || 0) + 15);
  }, [projectsInSelectedState]);

  // District Performance Metrics Aggregation
  const districtPerformance = useMemo(() => {
    const rawDistricts = Array.from(new Set(projectsInSelectedState.map((p) => p.district))).filter(Boolean);
    const districts = rawDistricts.length > 0 ? rawDistricts : ["Central District", "North District", "South District"];
    return districts.map((dist, idx) => {
      const distWorks = projectsInSelectedState.filter((p) => p.district === dist);
      const totalOutlay = distWorks.reduce((acc, p) => acc + (p.sanctionedAmt || 0), 0);
      const totalExp = distWorks.reduce((acc, p) => acc + (p.expenditureAmt || 0), 0);
      const utilRate = totalOutlay > 0 ? Math.round((totalExp / totalOutlay) * 100) : 72;
      const highRiskCount = distWorks.filter((p) => p.status === "Delayed" || (p.financialProgress || 0) > (p.physicalProgress || 0) + 15).length;

      return {
        rank: idx + 1,
        district: dist.replace(/\(.*\)/, '').trim(),
        rawDistrict: dist,
        totalWorks: distWorks.length,
        outlayAmt: totalOutlay,
        expenditureAmt: totalExp,
        utilizationRate: utilRate,
        highRiskCount,
        status: utilRate >= 70 ? "High Performing" : utilRate >= 50 ? "Moderate" : "Needs Review"
      };
    });
  }, [projectsInSelectedState]);

  // Selected State Summary from live Supabase
  const currentStateSummary = useMemo(() => {
    return availableStates.find(s => s.state.toLowerCase() === selectedState.toLowerCase());
  }, [availableStates, selectedState]);

  // Key KPI Numbers
  const kpis = useMemo(() => {
    const totalProjects = projectsInSelectedState.length;
    const totalOutlay = projectsInSelectedState.reduce((acc, p) => acc + (p.sanctionedAmt || 0), 0);
    const totalExp = projectsInSelectedState.reduce((acc, p) => acc + (p.expenditureAmt || 0), 0);
    const avgUtilization = totalOutlay > 0 ? Math.round((totalExp / totalOutlay) * 100) : (currentStateSummary?.utilizationPercentage || 0);
    const highRiskCount = projectsInSelectedState.filter((p) => p.status === "Delayed" || (p.financialProgress || 0) > (p.physicalProgress || 0) + 15).length;
    const completedCount = projectsInSelectedState.filter((p) => p.status === "Completed").length;

    return { totalProjects, totalOutlay, totalExp, avgUtilization, highRiskCount, completedCount };
  }, [projectsInSelectedState, currentStateSummary]);

  // Handlers
  const handleEscalationAction = (workId: string, actionType: string) => {
    setActionNotice(`State Nodal Executive Order (${actionType}) issued for Work ID #${workId}. Transmitted to District Collectorate.`);
    setTimeout(() => setActionNotice(null), 4000);
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
        activeTab="dashboard"
        setActiveTab={() => {}}
        onOpenPolicy={() => setIsPolicyOpen(true)}
        onOpenLogin={(role) => {
          setTargetLoginRole(role);
          setIsLoginOpen(true);
        }}
        t={t}
        flagCount={kpis.highRiskCount}
      />

      <main className="mplads-main" style={{ flex: 1, padding: "2rem 0 4rem" }}>
        <div className="mplads-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Module Tabs Navigation Bar (Admin Reference Standard) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: "10px",
              marginBottom: "1.25rem",
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setActiveTab("state_projects")}
                className={`gov-tab ${activeTab === "state_projects" ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", fontSize: "0.85rem", fontWeight: 700, borderRadius: "8px" }}
              >
                <Landmark size={16} />
                <span>Statewide Projects</span>
                <span style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: activeTab === "state_projects" ? "rgba(255,255,255,0.25)" : "#eff6ff",
                  color: activeTab === "state_projects" ? "#ffffff" : "#1d4ed8",
                  fontWeight: 700
                }}>
                  {filteredStateProjects.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("district_performance")}
                className={`gov-tab ${activeTab === "district_performance" ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", fontSize: "0.85rem", fontWeight: 700, borderRadius: "8px" }}
              >
                <BarChart2 size={16} />
                <span>District Performance</span>
                <span style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: activeTab === "district_performance" ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                  color: activeTab === "district_performance" ? "#ffffff" : "#64748b",
                  fontWeight: 700
                }}>
                  {districtPerformance.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("escalations")}
                className={`gov-tab ${activeTab === "escalations" ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", fontSize: "0.85rem", fontWeight: 700, borderRadius: "8px" }}
              >
                <ShieldAlert size={16} />
                <span>High-Risk Escalations</span>
                <span style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: activeTab === "escalations" ? "rgba(255,255,255,0.25)" : "#fee2e2",
                  color: activeTab === "escalations" ? "#ffffff" : "#b91c1c",
                  fontWeight: 700
                }}>
                  {stateHighRiskProjects.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("state_reports")}
                className={`gov-tab ${activeTab === "state_reports" ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", fontSize: "0.85rem", fontWeight: 700, borderRadius: "8px" }}
              >
                <FileText size={16} />
                <span>State Reports</span>
              </button>
            </div>

            {/* Right Status Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#065f46",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 6px #10b981",
                  }}
                />
                <span>{filteredStateProjects.length} Works Across {districtPerformance.length} Districts</span>
              </div>
            </div>
          </div>

          {/* State Nodal Department Header (Admin Reference Standard) */}
        <div className="dashboard-header" style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div className="dashboard-title-section">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#e0f2fe", color: "#0369a1", textTransform: "uppercase" }}>
                State Nodal Department · Planning & Development
              </span>
              <span style={{ color: "#94a3b8" }}>•</span>
              <span style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: 600 }}>
                Government of {selectedState}
              </span>

            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--gov-primary, #0a2540)", margin: "0 0 6px 0", fontFamily: "Outfit, sans-serif" }}>
              Statewide MPLADS Monitoring — {selectedState}
            </h1>
            <p style={{ fontSize: "0.92rem", color: "#64748b", margin: 0, maxWidth: "780px" }}>
              Cross-district implementation monitoring, statewide fund utilization tracking, and project milestone oversight.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.70rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", fontWeight: 700 }}>
                Select State / UT:
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                style={{
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "7px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                {availableStates.length > 0 ? (
                  availableStates.map((s) => (
                    <option key={s.state} value={s.state}>
                      {s.state} (#{s.rank} · {s.utilizationPercentage}% Utilized)
                    </option>
                  ))
                ) : (
                  <option value={selectedState}>
                    {selectedState}
                  </option>
                )}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              icon={<Download size={14} />}
              style={{ background: "#ffffff", color: "var(--gov-primary, #0a2540)", borderColor: "#cbd5e1", fontWeight: 700, borderRadius: "8px" }}
            >
              Export State Report (PDF)
            </Button>
          </div>
        </div>

        {actionNotice && (
          <Alert type="success" title="State Nodal Order Executed">
            {actionNotice}
          </Alert>
        )}

        {/* KPI Summary Cards (Admin Reference Hover-Only Top Accent) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
          
          <div 
            className="metric-card metric-navy cursor-pointer" 
            style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer" }}
            title="Click to view all statewide projects"
            onClick={() => {
              setActiveTab("state_projects");
              setSelectedDistrict("all");
              setSelectedStatus("all");
              setSearchQuery("");
            }}
          >
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.3px" }}>
              Total Statewide Works
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main, #0f172a)", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              {kpis.totalProjects.toLocaleString()}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Outlay: <strong>₹{kpis.totalOutlay.toFixed(2)} Cr</strong>
            </div>
          </div>

          <div 
            className="metric-card metric-sky cursor-pointer" 
            style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer" }}
            title="Click to view district performance matrix"
            onClick={() => {
              setActiveTab("district_performance");
            }}
          >
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.3px" }}>
              State Expenditure Disbursed
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0284c7", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              ₹{kpis.totalExp.toFixed(2)} Cr
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              State Utilization: <strong>{kpis.avgUtilization}%</strong>
            </div>
          </div>

          <div 
            className="metric-card metric-green cursor-pointer" 
            style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer" }}
            title="Click to filter Completed works"
            onClick={() => {
              setActiveTab("state_projects");
              setSelectedStatus("Completed");
            }}
          >
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.3px" }}>
              Completed Works
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#16a34a", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              {kpis.completedCount}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Certified by District Authorities
            </div>
          </div>

          <div 
            className="metric-card metric-rose cursor-pointer" 
            style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer" }}
            title="Click to view High-Risk Escalations"
            onClick={() => {
              setActiveTab("escalations");
            }}
          >
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.3px" }}>
              State High-Risk Anomalies
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#dc2626", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              {kpis.highRiskCount}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              State Escalations Required
            </div>
          </div>

        </div>

        {/* Tab Views with Smooth Animated Transition */}
        <div key={activeTab} className="view-transition-container">
          {/* TAB 1: STATEWIDE PROJECT MONITORING */}
          {activeTab === "state_projects" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* Mandatory AI Risk Semantics Banner */}
            <Alert type="info" title="Statewide Risk Semantics Notice">
              <strong>STATUTORY PRINCIPLE:</strong> Risk levels indicate <strong>verification priority</strong> for district field inspection, NOT proof of fraud.
            </Alert>

            {/* Comprehensive State Filter Bar */}
            <div className="gov-card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--gov-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sliders size={14} />
                Statewide Multi-Dimensional Filters
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>District</label>
                  <select className="gov-select" style={{ width: "100%" }} value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
                    <option value="all">All Districts ({projects.length} Works)</option>
                    {Array.from(new Set(projects.map(p => p.district))).filter(Boolean).map(dist => (
                      <option key={dist} value={dist}>{dist.replace(/\(.*\)/, '').trim()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>Project Status</label>
                  <select className="gov-select" style={{ width: "100%" }} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Sanctioned">Sanctioned</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>Risk Signal</label>
                  <select className="gov-select" style={{ width: "100%" }} value={selectedRiskLevel} onChange={(e) => setSelectedRiskLevel(e.target.value)}>
                    <option value="all">All Risk Levels</option>
                    <option value="HIGH">High Risk (Priority 1)</option>
                    <option value="LOW">Standard Risk</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>Deadline Forecast</label>
                  <select className="gov-select" style={{ width: "100%" }} value={selectedDeadlineRisk} onChange={(e) => setSelectedDeadlineRisk(e.target.value)}>
                    <option value="all">All Deadline Risks</option>
                    <option value="DELAYED">Likely Delay (+30 Days)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>Search Text</label>
                  <input
                    type="text"
                    className="gov-input"
                    placeholder="Search Work ID, title..."
                    style={{ width: "100%" }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Toolbar: Results Count and Segmented View Mode Toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", margin: "4px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Statewide Projects ({filteredStateProjects.length} Works)
                </div>
                {selectedDistrict !== "all" && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "9999px", fontSize: "0.74rem" }}>
                    <span style={{ color: "#1e40af", fontWeight: 600 }}>District: <strong>{selectedDistrict}</strong></span>
                    <button
                      type="button"
                      onClick={() => setSelectedDistrict("all")}
                      style={{ background: "none", border: "none", color: "#1e40af", fontWeight: 800, cursor: "pointer", padding: "0 2px", fontSize: "0.80rem" }}
                      title="Clear District Filter (Show All Districts)"
                    >
                      ✕
                    </button>
                  </div>
                )}
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

            {/* View Mode: Card Grid or Table View */}
            {viewMode === "grid" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                {filteredStateProjects.map((work) => (
                  <div
                    key={work.id}
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
                    onClick={() => setSelectedWorkForDetail(work)}
                  >
                    <div>
                      {/* Top Bar: Work ID & Status Badge */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem", color: "var(--gov-primary)" }}>
                          {work.id}
                        </span>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {work.status === "Delayed" && (
                            <span className="gov-badge gov-badge-danger" style={{ fontSize: "0.68rem" }}>HIGH RISK</span>
                          )}
                          <span className={`gov-badge ${work.status === "Completed" ? "gov-badge-success" : work.status === "Delayed" ? "gov-badge-danger" : "gov-badge-info"}`} style={{ fontSize: "0.68rem" }}>
                            {work.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Work Title */}
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "6px", lineHeight: 1.35 }}>
                        {work.title}
                      </h4>

                      {/* Category & Agency */}
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                        Category: <strong style={{ color: "var(--text-main)" }}>{work.category}</strong> | Agency: {work.agency}
                      </div>

                      {/* District & MP info */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "8px 10px", background: "var(--bg-surface-subtle, #f8fafc)", borderRadius: "6px", fontSize: "0.75rem", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin size={12} style={{ color: "var(--gov-primary)", flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>District:</span> {work.district}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Building2 size={12} style={{ color: "var(--gov-primary)", flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>MP:</span> {work.mpName}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", marginBottom: "4px" }}>
                          <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Physical Progress</span>
                          <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{work.physicalProgress}%</span>
                        </div>
                        <div style={{ width: "100%", height: "7px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${work.physicalProgress}%`,
                              height: "100%",
                              background: work.status === "Completed" ? "#10b981" : work.status === "Delayed" ? "#f59e0b" : "#3b82f6",
                              borderRadius: "4px"
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Financial Outlay & Action Button */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                      <div>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Sanction Cost</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--gov-primary)" }}>
                          ₹{work.sanctionedAmt.toFixed(2)} Cr
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorkForDetail(work);
                        }}
                        icon={<Eye size={12} />}
                      >
                        Inspect Dossier
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Table */
              <div className="gov-card" style={{ padding: "16px 20px", overflowX: "auto" }}>
                <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                      <th style={{ padding: "10px 12px" }}>Work ID</th>
                      <th style={{ padding: "10px 12px" }}>Project Name & Category</th>
                      <th style={{ padding: "10px 12px" }}>District & MP</th>
                      <th style={{ padding: "10px 12px" }}>Sanction Cost</th>
                      <th style={{ padding: "10px 12px" }}>Physical Progress</th>
                      <th style={{ padding: "10px 12px" }}>Risk Signal</th>
                      <th style={{ padding: "10px 12px" }}>Status</th>
                      <th style={{ padding: "10px 12px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStateProjects.map((work) => (
                      <tr key={work.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, color: "var(--gov-primary)" }}>
                          {work.id}
                        </td>
                        <td style={{ padding: "10px 12px", maxWidth: "260px" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{work.title}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            Category: {work.category} | Agency: {work.agency}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "0.78rem" }}>
                          <div style={{ fontWeight: 600 }}>{work.district}</div>
                          <div style={{ color: "var(--text-muted)" }}>MP: {work.mpName}</div>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--gov-primary)" }}>
                          ₹{work.sanctionedAmt.toFixed(2)} Cr
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "60px", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${work.physicalProgress}%`, height: "100%", background: "#10b981" }} />
                            </div>
                            <span style={{ fontWeight: 700 }}>{work.physicalProgress}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {work.status === "Delayed" ? (
                            <span className="gov-badge gov-badge-danger">HIGH RISK (P1)</span>
                          ) : (
                            <span className="gov-badge gov-badge-info">NORMAL RISK</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span className={`gov-badge ${work.status === "Completed" ? "gov-badge-success" : work.status === "Delayed" ? "gov-badge-danger" : "gov-badge-info"}`}>
                            {work.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <Button variant="secondary" size="sm" onClick={() => setSelectedWorkForDetail(work)} icon={<Eye size={12} />}>
                            Inspect Dossier
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DISTRICT PERFORMANCE MATRIX */}
        {activeTab === "district_performance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="gov-card" style={{ padding: "20px 24px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main, #0f172a)", marginBottom: "4px", fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
                Cross-District Performance & Utilization Matrix
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                Comparative monitoring across {selectedState} district collectorates based on fund utilization efficiency, field verification coverage, and delay mitigation.
              </p>

              <div style={{ overflowX: "auto" }}>
                <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                      <th style={{ padding: "10px 12px" }}>State Rank</th>
                      <th style={{ padding: "10px 12px" }}>District Name</th>
                      <th style={{ padding: "10px 12px" }}>Total Works</th>
                      <th style={{ padding: "10px 12px" }}>Sanctioned Outlay</th>
                      <th style={{ padding: "10px 12px" }}>Expenditure Disbursed</th>
                      <th style={{ padding: "10px 12px" }}>Utilization Rate (%)</th>
                      <th style={{ padding: "10px 12px" }}>High-Risk Works</th>
                      <th style={{ padding: "10px 12px" }}>Performance Status</th>
                      <th style={{ padding: "10px 12px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districtPerformance.map((d) => (
                      <tr 
                        key={d.district} 
                        style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.15s ease" }}
                        className="hover:bg-slate-50"
                      >
                        <td style={{ padding: "10px 12px", fontWeight: 800, color: "var(--gov-primary)" }}>#{d.rank}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDistrict(d.rawDistrict);
                              setActiveTab("state_projects");
                            }}
                            style={{ background: "none", border: "none", padding: 0, fontWeight: 700, color: "var(--gov-primary)", cursor: "pointer", textAlign: "left", fontSize: "0.82rem" }}
                          >
                            {d.district} District
                          </button>
                        </td>
                        <td style={{ padding: "10px 12px" }}>{d.totalWorks} Works</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700 }}>₹{d.outlayAmt.toFixed(2)} Cr</td>
                        <td style={{ padding: "10px 12px" }}>₹{d.expenditureAmt.toFixed(2)} Cr</td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "60px", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${d.utilizationRate}%`, height: "100%", background: d.utilizationRate > 70 ? "#10b981" : "#f59e0b" }} />
                            </div>
                            <span style={{ fontWeight: 800 }}>{d.utilizationRate}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: d.highRiskCount > 0 ? "var(--status-danger-text)" : "var(--status-success-text)" }}>
                          {d.highRiskCount} Flags
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span className={`gov-badge ${d.status === "High Performing" ? "gov-badge-success" : "gov-badge-warning"}`}>
                            {d.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedDistrict(d.rawDistrict);
                              setActiveTab("state_projects");
                            }}
                            icon={<Eye size={12} />}
                          >
                            View Works ({d.totalWorks})
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STATE HIGH-RISK ESCALATIONS */}
        {activeTab === "escalations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Alert type="warning" title="State Level Escalation Portal">
              District Collectorate escalations requiring State Nodal Department intervention (Fund Reallocation, Show-Cause Notice to Contractors, Inter-Departmental Clearance).
            </Alert>

            {stateHighRiskProjects.map((work) => (
              <div key={work.id} className="card-hover-accent accent-rose" style={{ padding: "18px 22px", background: "#ffffff", borderRadius: "10px", border: "1px solid var(--border-light, #e2e8f0)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="gov-badge gov-badge-danger">STATE ESCALATION (P1)</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem" }}>{work.id}</span>
                      <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>District: {work.district}</span>
                    </div>

                    <h4 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "6px 0 2px 0", color: "var(--text-main, #0f172a)" }}>{work.title}</h4>
                    <div style={{ fontSize: "0.80rem", color: "var(--text-muted)" }}>
                      Contractor Agency: <strong>{work.agency}</strong> | MP: <strong>{work.mpName}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Button variant="primary" size="sm" onClick={() => handleEscalationAction(work.id, "Directive Transmitted to DM")}>
                      Issue State Directive
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedWorkForDetail(work)}>
                      Inspect Dossier
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: STATE REPORTS */}
        {activeTab === "state_reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="gov-card" style={{ padding: "20px 24px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main, #0f172a)", marginBottom: "4px", fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
                Statewide Sector Outlays & MoSPI Statutory Returns
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                State-level consolidated returns transmitted to the Ministry of Statistics and Programme Implementation (MoSPI), New Delhi.
              </p>

              <div style={{ padding: "16px 20px", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-light)", borderRadius: "10px", fontSize: "0.84rem" }}>
                <div style={{ fontWeight: 700, color: "var(--gov-primary)", marginBottom: "8px" }}>State Returns Summary:</div>
                <ul style={{ margin: "4px 0 0 16px", color: "var(--text-body)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <li>Statewide Total Outlay Allocated: <strong>₹{kpis.totalOutlay.toFixed(2)} Cr</strong></li>
                  <li>Statewide Total Expenditure Incurred: <strong>₹{kpis.totalExp.toFixed(2)} Cr ({kpis.avgUtilization}%)</strong></li>
                  <li>Total Districts Compliant with Monthly Return Filing: <strong>{districtPerformance.length} / {districtPerformance.length}</strong></li>
                </ul>
              </div>
            </div>
          </div>
        )}
        </div>

        </div>
      </main>

      <WorkDetailModal
        work={selectedWorkForDetail}
        onClose={() => setSelectedWorkForDetail(null)}
        onViewAttachments={(w) => { setSelectedWorkForDetail(null); setSelectedWorkForAttachments(w); }}
        onViewReviews={(w) => { setSelectedWorkForDetail(null); setSelectedWorkForReviews(w); }}
      />

      <AttachmentsModal
        work={selectedWorkForAttachments}
        onClose={() => setSelectedWorkForAttachments(null)}
      />

      <ReviewRatingModal
        work={selectedWorkForReviews}
        onClose={() => setSelectedWorkForReviews(null)}
        onAddReview={(workId, newReview) => {
          setProjects(prev => prev.map(w => {
            if (w.id === workId) {
              const updatedReviews = [newReview, ...(w.reviews || [])];
              const newAvg = Number((updatedReviews.reduce((s, r) => s + r.rating, 0) / updatedReviews.length).toFixed(1));
              return { ...w, reviews: updatedReviews, reviewsCount: updatedReviews.length, rating: newAvg };
            }
            return w;
          }));
          setActionNotice(`Social audit feedback logged for Work #${workId}. Rating: ${newReview.rating}★`);
          setTimeout(() => setActionNotice(null), 4000);
        }}
      />

      <PolicyModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
      />

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

export default StateNodalDashboard;
