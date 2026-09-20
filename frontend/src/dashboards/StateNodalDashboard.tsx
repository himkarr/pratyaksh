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
  LayoutGrid,
  X
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
import { TableColumnHeader } from "../components/common/TableColumnHeader";

import { INITIAL_WORKS, WorkItem, WorkReview, ALL_WORKS } from "../data/mpladsData";
import { usePreferences } from "../context/PreferencesContext";
import { useRole, Role } from "../auth/roleContext";
import { adminDataService, StateSummary } from "../api/adminDataService";

export const StateNodalDashboard: React.FC = () => {
  const { user } = useRole();
  const { fontScale, setFontScale, theme, setTheme, lang, setLang, t, tr } = usePreferences();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"state_projects" | "district_performance" | "escalations" | "state_reports">("state_projects");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // State Selection & Live Supabase Data
  const [availableStates, setAvailableStates] = useState<StateSummary[]>([]);
  const [selectedState, setSelectedState] = useState<string>(() => user.state || "Haryana");
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  useEffect(() => {
    if (user.state) {
      setSelectedState(user.state);
    }
  }, [user.state, user.id]);

  // Comprehensive State Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMp, setSelectedMp] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("all");
  const [selectedDeadlineRisk, setSelectedDeadlineRisk] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Projects Table Sort
  const [projectSortBy, setProjectSortBy] = useState<string>("title");
  const [projectSortOrder, setProjectSortOrder] = useState<"asc" | "desc">("asc");

  const handleProjectSort = (field: string) => {
    if (projectSortBy === field) {
      setProjectSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setProjectSortBy(field);
      setProjectSortOrder("asc");
    }
  };

  // District Performance Matrix Filter & Sort
  const [matrixSortBy, setMatrixSortBy] = useState<string>("rank");
  const [matrixSortOrder, setMatrixSortOrder] = useState<"asc" | "desc">("asc");
  const [matrixStatusFilter, setMatrixStatusFilter] = useState<string>("all");
  const [matrixSearchQuery, setMatrixSearchQuery] = useState<string>("");

  const handleMatrixSort = (field: string) => {
    if (matrixSortBy === field) {
      setMatrixSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setMatrixSortBy(field);
      setMatrixSortOrder("asc");
    }
  };

  // Projects State
  const [projects, setProjects] = useState<WorkItem[]>(() => {
    const haryana = ALL_WORKS.filter(w => (w.state || "").toLowerCase() === "haryana");
    return haryana.length > 0 ? haryana : INITIAL_WORKS;
  });

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
  const stateDepartment = user.name || "State Nodal Department (Haryana Planning & Dev)";

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
          if (statesData.some(s => (s.state || "").toLowerCase() === (selectedState || "").toLowerCase())) {
            // Keep selectedState as is
          } else if (!user.state) {
            setSelectedState(statesData[0].state || "Haryana");
          }
        }

        if (liveProjs && liveProjs.length > 0) {
          const mapped: WorkItem[] = liveProjs.map((p, idx) => ({
            id: p.project_id || p.id || `LIVE-${idx}`,
            title: p.project_name || p.title || "MPLADS Infrastructure Work",
            house: "Lok Sabha",
            state: p.state || "Haryana",
            district: p.district || "Rohtak",
            constituency: p.district || "Rohtak",
            constituency_code: "HR-01",
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
  }, [selectedState, user.state]);

  // Filter projects strictly belonging to selected State (with fallback to ALL_WORKS matching state)
  const projectsInSelectedState = useMemo(() => {
    const sLower = (selectedState || "Haryana").toLowerCase();
    const matched = projects.filter((w) => w.state && w.state.toLowerCase() === sLower);
    if (matched.length > 0) return matched;
    const fallback = ALL_WORKS.filter((w) => (w.state || "").toLowerCase() === sLower);
    return fallback.length > 0 ? fallback : projects;
  }, [projects, selectedState]);

  // Unique categories and districts for column filters
  const stateCategories = useMemo(() => {
    return Array.from(new Set(projectsInSelectedState.map(p => p.category))).filter((c): c is string => Boolean(c));
  }, [projectsInSelectedState]);

  const stateDistricts = useMemo(() => {
    return Array.from(new Set(projectsInSelectedState.map(p => p.district))).filter((d): d is string => Boolean(d));
  }, [projectsInSelectedState]);

  // Filtered State Projects
  const filteredStateProjects = useMemo(() => {
    const list = projectsInSelectedState.filter((w) => {
      if (selectedDistrict !== "all" && w.district !== selectedDistrict) return false;
      if (selectedCategory !== "all" && w.category !== selectedCategory) return false;
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
        const matchCat = (w.category || "").toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchDist && !matchMp && !matchCat) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";
      if (projectSortBy === "title") {
        valA = a.title || "";
        valB = b.title || "";
      } else if (projectSortBy === "district") {
        valA = a.district || "";
        valB = b.district || "";
      } else if (projectSortBy === "sanctionedAmt") {
        valA = a.sanctionedAmt || 0;
        valB = b.sanctionedAmt || 0;
      } else if (projectSortBy === "physicalProgress") {
        valA = a.physicalProgress || 0;
        valB = b.physicalProgress || 0;
      } else if (projectSortBy === "status") {
        valA = a.status || "";
        valB = b.status || "";
      }
      if (typeof valA === "string") {
        return projectSortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return projectSortOrder === "asc" ? valA - valB : valB - valA;
    });
  }, [projectsInSelectedState, selectedDistrict, selectedCategory, selectedMp, selectedStatus, selectedRiskLevel, selectedDeadlineRisk, searchQuery, projectSortBy, projectSortOrder]);

  // High Risk Projects across State
  const stateHighRiskProjects = useMemo(() => {
    return projectsInSelectedState.filter((w) => w.status === "Delayed" || (w.financialProgress || 0) > (w.physicalProgress || 0) + 15);
  }, [projectsInSelectedState]);

  // District Performance Metrics Aggregation
  const districtPerformance = useMemo(() => {
    const rawDistricts = Array.from(new Set(projectsInSelectedState.map((p: WorkItem) => p.district))).filter((d): d is string => Boolean(d));
    const districts = rawDistricts.length > 0 ? rawDistricts : ["Rohtak", "Gurugram", "Kurukshetra", "Karnal", "Faridabad"];
    const aggregated = districts.map((dist: string, idx: number) => {
      const distWorks = projectsInSelectedState.filter((p: WorkItem) => p.district === dist);
      const totalOutlay = distWorks.reduce((acc: number, p: WorkItem) => acc + (p.sanctionedAmt || 0), 0);
      const totalExp = distWorks.reduce((acc: number, p: WorkItem) => acc + (p.expenditureAmt || 0), 0);
      const utilRate = totalOutlay > 0 ? Math.round((totalExp / totalOutlay) * 100) : 72;
      const highRiskCount = distWorks.filter((p: WorkItem) => p.status === "Delayed" || (p.financialProgress || 0) > (p.physicalProgress || 0) + 15).length;

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

    const filtered = aggregated.filter(d => {
      if (matrixStatusFilter !== "all" && d.status !== matrixStatusFilter) return false;
      if (matrixSearchQuery.trim()) {
        const q = matrixSearchQuery.toLowerCase();
        if (!(d.district || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";
      if (matrixSortBy === "rank") {
        valA = a.rank;
        valB = b.rank;
      } else if (matrixSortBy === "district") {
        valA = a.district;
        valB = b.district;
      } else if (matrixSortBy === "totalWorks") {
        valA = a.totalWorks;
        valB = b.totalWorks;
      } else if (matrixSortBy === "outlayAmt") {
        valA = a.outlayAmt;
        valB = b.outlayAmt;
      } else if (matrixSortBy === "expenditureAmt") {
        valA = a.expenditureAmt;
        valB = b.expenditureAmt;
      } else if (matrixSortBy === "utilizationRate") {
        valA = a.utilizationRate;
        valB = b.utilizationRate;
      } else if (matrixSortBy === "highRiskCount") {
        valA = a.highRiskCount;
        valB = b.highRiskCount;
      } else if (matrixSortBy === "status") {
        valA = a.status;
        valB = b.status;
      }
      if (typeof valA === "string") {
        return matrixSortOrder === "asc" ? (valA || "").localeCompare(valB || "") : (valB || "").localeCompare(valA || "");
      }
      return matrixSortOrder === "asc" ? valA - valB : valB - valA;
    });
  }, [projectsInSelectedState, matrixStatusFilter, matrixSearchQuery, matrixSortBy, matrixSortOrder]);

  // Selected State Summary from live Supabase
  const currentStateSummary = useMemo(() => {
    return availableStates.find(s => (s.state || "").toLowerCase() === (selectedState || "").toLowerCase());
  }, [availableStates, selectedState]);

  // Key KPI Numbers
  const kpis = useMemo(() => {
    const totalProjects = projectsInSelectedState.length;
    const totalOutlay = projectsInSelectedState.reduce((acc: number, p: WorkItem) => acc + (p.sanctionedAmt || 0), 0);
    const totalExp = projectsInSelectedState.reduce((acc: number, p: WorkItem) => acc + (p.expenditureAmt || 0), 0);
    const avgUtilization = totalOutlay > 0 ? Math.round((totalExp / totalOutlay) * 100) : (currentStateSummary?.utilizationPercentage || 0);
    const highRiskCount = projectsInSelectedState.filter((p: WorkItem) => p.status === "Delayed" || (p.financialProgress || 0) > (p.physicalProgress || 0) + 15).length;
    const completedCount = projectsInSelectedState.filter((p: WorkItem) => p.status === "Completed").length;

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
                <span>{tr("Statewide Projects") || "Statewide Projects"}</span>
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
                <span>{tr("District Performance")}</span>
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
                <span>{tr("High-Risk Escalations") || tr("Escalations & Vigilance")}</span>
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
                <span>{tr("Reports & Analytics") || "State Reports"}</span>
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
                <span>{filteredStateProjects.length} {tr("Works Across")} {districtPerformance.length} {tr("District")}</span>
              </div>
            </div>
          </div>

          {/* State Nodal Department Header (Admin Reference Standard) */}
        <div className="dashboard-header" style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div className="dashboard-title-section">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#e0f2fe", color: "#0369a1", textTransform: "uppercase" }}>
                {tr("State Nodal Department")} · {tr("Planning & Development") || "Planning & Development"}
              </span>
              <span style={{ color: "#94a3b8" }}>•</span>
              <span style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: 600 }}>
                {tr("Government of")} {selectedState}
              </span>
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--gov-primary, #0a2540)", margin: "0 0 6px 0", fontFamily: "Outfit, sans-serif" }}>
              {tr("State Nodal Department Workspace")} — {selectedState}
            </h1>
            <p style={{ fontSize: "0.92rem", color: "#64748b", margin: 0, maxWidth: "780px" }}>
              {tr("Cross-district implementation monitoring, statewide fund utilization tracking, and project milestone oversight.")}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              icon={<Download size={14} />}
              style={{ background: "#ffffff", color: "var(--gov-primary, #0a2540)", borderColor: "#cbd5e1", fontWeight: 700, borderRadius: "8px" }}
            >
              {tr("Print") || "Export State Report (PDF)"}
            </Button>
          </div>
        </div>

        {actionNotice && (
          <Alert type="success" title={tr("State Nodal Order Executed") || "State Nodal Order Executed"}>
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
              {tr("Total Statewide Works") || tr("Total Sanctioned")}
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main, #0f172a)", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              {kpis.totalProjects.toLocaleString()}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              {tr("Sanctioned Amount")}: <strong>₹{kpis.totalOutlay.toFixed(2)} Cr</strong>
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
              {tr("Disbursed (PFMS)") || "State Expenditure Disbursed"}
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0284c7", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              ₹{kpis.totalExp.toFixed(2)} Cr
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              {tr("Fund Utilisation Rate")}: <strong>{kpis.avgUtilization}%</strong>
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
              {tr("Completed Works") || tr("Works Completed")}
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#16a34a", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              {kpis.completedCount}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              {tr("Certified by Field Engineers") || "Certified by District Authorities"}
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
              {tr("Audit Flags") || "State High-Risk Anomalies"}
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#dc2626", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              {kpis.highRiskCount}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              {tr("Under vigilance scrutiny") || "State Escalations Required"}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--gov-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sliders size={14} />
                  Statewide Multi-Dimensional Filters
                </div>
                {(selectedDistrict !== "all" || selectedCategory !== "all" || selectedStatus !== "all" || selectedRiskLevel !== "all" || selectedDeadlineRisk !== "all" || searchQuery.trim() !== "") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDistrict("all");
                      setSelectedCategory("all");
                      setSelectedStatus("all");
                      setSelectedRiskLevel("all");
                      setSelectedDeadlineRisk("all");
                      setSearchQuery("");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "none",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "0.75rem",
                      color: "#64748b",
                      cursor: "pointer"
                    }}
                  >
                    <X size={12} /> Reset Filters
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>District</label>
                  <select className="gov-select" style={{ width: "100%" }} value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
                    <option value="all">All Districts ({projects.length} Works)</option>
                    {stateDistricts.map(dist => (
                      <option key={dist} value={dist}>{dist.replace(/\(.*\)/, '').trim()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>Category</label>
                  <select className="gov-select" style={{ width: "100%" }} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    <option value="all">All Categories</option>
                    {stateCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
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
                    placeholder="Search title, category, MP..."
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
                      {/* Top Bar: Category & Status Badge */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.72rem", fontWeight: 700 }}>
                          {work.category}
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
                      <TableColumnHeader
                        title="Project Name & Category"
                        field="title"
                        currentSortField={projectSortBy}
                        currentSortDirection={projectSortOrder}
                        onSort={handleProjectSort}
                        filterOptions={[
                          { label: "All Categories", value: "all" },
                          ...stateCategories.map(c => ({ label: c, value: c }))
                        ]}
                        selectedFilter={selectedCategory}
                        onFilterChange={setSelectedCategory}
                      />
                      <TableColumnHeader
                        title="District & MP"
                        field="district"
                        currentSortField={projectSortBy}
                        currentSortDirection={projectSortOrder}
                        onSort={handleProjectSort}
                        filterOptions={[
                          { label: "All Districts", value: "all" },
                          ...stateDistricts.map(d => ({ label: d, value: d }))
                        ]}
                        selectedFilter={selectedDistrict}
                        onFilterChange={setSelectedDistrict}
                      />
                      <TableColumnHeader
                        title="Sanction Cost"
                        field="sanctionedAmt"
                        currentSortField={projectSortBy}
                        currentSortDirection={projectSortOrder}
                        onSort={handleProjectSort}
                      />
                      <TableColumnHeader
                        title="Physical Progress"
                        field="physicalProgress"
                        currentSortField={projectSortBy}
                        currentSortDirection={projectSortOrder}
                        onSort={handleProjectSort}
                      />
                      <th style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase" }}>Risk Signal</th>
                      <TableColumnHeader
                        title="Status"
                        field="status"
                        currentSortField={projectSortBy}
                        currentSortDirection={projectSortOrder}
                        onSort={handleProjectSort}
                        filterOptions={[
                          { label: "All Statuses", value: "all" },
                          { label: "Ongoing", value: "Ongoing" },
                          { label: "Sanctioned", value: "Sanctioned" },
                          { label: "Completed", value: "Completed" },
                          { label: "Delayed", value: "Delayed" }
                        ]}
                        selectedFilter={selectedStatus}
                        onFilterChange={setSelectedStatus}
                      />
                      <th style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStateProjects.map((work) => (
                      <tr key={work.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "10px 12px", maxWidth: "280px" }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main, #0f172a)", marginBottom: "4px", fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
                    Cross-District Performance & Utilization Matrix
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                    Comparative monitoring across {selectedState} district collectorates based on fund utilization efficiency, field verification coverage, and delay mitigation.
                  </p>
                </div>
              </div>

              {/* General Filters for District Performance */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "16px", padding: "12px", background: "var(--bg-surface-subtle, #f8fafc)", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <input
                    type="text"
                    className="gov-input"
                    placeholder="Search district name..."
                    style={{ width: "100%", fontSize: "0.82rem", padding: "6px 10px" }}
                    value={matrixSearchQuery}
                    onChange={(e) => setMatrixSearchQuery(e.target.value)}
                  />
                </div>
                <div style={{ flex: "0 1 200px" }}>
                  <select
                    className="gov-select"
                    style={{ width: "100%", fontSize: "0.82rem", padding: "6px 10px" }}
                    value={matrixStatusFilter}
                    onChange={(e) => setMatrixStatusFilter(e.target.value)}
                  >
                    <option value="all">All Performance Statuses</option>
                    <option value="High Performing">High Performing (≥70%)</option>
                    <option value="Moderate">Moderate (50-69%)</option>
                    <option value="Needs Review">Needs Review (&lt;50%)</option>
                  </select>
                </div>
                {(matrixStatusFilter !== "all" || matrixSearchQuery.trim() !== "") && (
                  <button
                    type="button"
                    onClick={() => {
                      setMatrixStatusFilter("all");
                      setMatrixSearchQuery("");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "none",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "0.78rem",
                      color: "#64748b",
                      cursor: "pointer"
                    }}
                  >
                    <X size={13} /> Reset
                  </button>
                )}
                <div style={{ marginLeft: "auto", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  Showing {districtPerformance.length} Districts
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                      <TableColumnHeader
                        title="State Rank"
                        field="rank"
                        currentSortField={matrixSortBy}
                        currentSortDirection={matrixSortOrder}
                        onSort={handleMatrixSort}
                      />
                      <TableColumnHeader
                        title="District Name"
                        field="district"
                        currentSortField={matrixSortBy}
                        currentSortDirection={matrixSortOrder}
                        onSort={handleMatrixSort}
                      />
                      <TableColumnHeader
                        title="Total Works"
                        field="totalWorks"
                        currentSortField={matrixSortBy}
                        currentSortDirection={matrixSortOrder}
                        onSort={handleMatrixSort}
                      />
                      <TableColumnHeader
                        title="Sanctioned Outlay"
                        field="outlayAmt"
                        currentSortField={matrixSortBy}
                        currentSortDirection={matrixSortOrder}
                        onSort={handleMatrixSort}
                      />
                      <TableColumnHeader
                        title="Expenditure Disbursed"
                        field="expenditureAmt"
                        currentSortField={matrixSortBy}
                        currentSortDirection={matrixSortOrder}
                        onSort={handleMatrixSort}
                      />
                      <TableColumnHeader
                        title="Utilization Rate (%)"
                        field="utilizationRate"
                        currentSortField={matrixSortBy}
                        currentSortDirection={matrixSortOrder}
                        onSort={handleMatrixSort}
                      />
                      <TableColumnHeader
                        title="High-Risk Works"
                        field="highRiskCount"
                        currentSortField={matrixSortBy}
                        currentSortDirection={matrixSortOrder}
                        onSort={handleMatrixSort}
                      />
                      <TableColumnHeader
                        title="Performance Status"
                        field="status"
                        currentSortField={matrixSortBy}
                        currentSortDirection={matrixSortOrder}
                        onSort={handleMatrixSort}
                        filterOptions={[
                          { label: "All Statuses", value: "all" },
                          { label: "High Performing", value: "High Performing" },
                          { label: "Moderate", value: "Moderate" },
                          { label: "Needs Review", value: "Needs Review" }
                        ]}
                        selectedFilter={matrixStatusFilter}
                        onFilterChange={setMatrixStatusFilter}
                      />
                      <th style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase" }}>Actions</th>
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
                      <span className="gov-badge gov-badge-neutral">{work.category}</span>
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
