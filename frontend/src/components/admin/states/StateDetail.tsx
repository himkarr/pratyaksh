import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Users,
  IndianRupee,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Eye,
  Building,
  MapPin,
  Calendar,
  Layers,
  ArrowUpDown,
  LayoutGrid,
  List,
  ArrowRight,
} from "lucide-react";
import { StateSummary, MPSummary } from "../../../api/adminDataService";
import { CivicUtilizationGauge } from "../../common/CivicUtilizationGauge";
import { MPPersonalityDonut } from "./MPPersonalityDonut";
import { TableColumnHeader } from "../../common/TableColumnHeader";

interface StateDetailProps {
  stateName: string;
  stateData?: StateSummary;
  mps: MPSummary[];
  projects: any[];
  onBack: () => void;
  onSelectProject: (project: any) => void;
  onSelectMP: (mp: MPSummary) => void;
}

export const StateDetail: React.FC<StateDetailProps> = ({
  stateName,
  stateData,
  mps,
  projects,
  onBack,
  onSelectProject,
  onSelectMP,
}) => {
  // Three Tabs: Overview, MPs Performance, Projects
  const [activeTab, setActiveTab] = useState<"overview" | "mps" | "projects">("overview");

  // Sorting & Filtering for MPs table
  const [mpSortBy, setMpSortBy] = useState<string>("utilizationPercentage");
  const [mpSortOrder, setMpSortOrder] = useState<"asc" | "desc">("desc");
  const [mpSearch, setMpSearch] = useState<string>("");
  const [mpHouseFilter, setMpHouseFilter] = useState<string>("all");
  const [mpConstituencyFilter, setMpConstituencyFilter] = useState<string>("all");

  // District Table Filters & Sorting
  const [districtSortBy, setDistrictSortBy] = useState<string>("sanctioned");
  const [districtSortOrder, setDistrictSortOrder] = useState<"asc" | "desc">("desc");
  const [districtStatusFilter, setDistrictStatusFilter] = useState<string>("all");

  // Projects Tab Filters & Sorting
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [projectCategoryFilter, setProjectCategoryFilter] = useState("all");
  const [projectDistrictFilter, setProjectDistrictFilter] = useState("all");
  const [projectSortBy, setProjectSortBy] = useState<string>("sanctioned_amount");
  const [projectSortOrder, setProjectSortOrder] = useState<"asc" | "desc">("desc");
  const [projectViewMode, setProjectViewMode] = useState<"grid" | "table">("grid");

  // Filter MPs for this state
  const stateMPs = useMemo(() => {
    return mps.filter(
      (m) => m.state.toLowerCase().trim() === stateName.toLowerCase().trim()
    );
  }, [mps, stateName]);

  // Filter projects for this state
  const stateProjects = useMemo(() => {
    return projects.filter(
      (p) => (p.state || "").toLowerCase().trim() === stateName.toLowerCase().trim()
    );
  }, [projects, stateName]);

  // Distinct Constituencies in this State
  const stateConstituencies = useMemo(() => {
    const set = new Set<string>();
    stateMPs.forEach((m) => {
      if (m.constituency) set.add(m.constituency);
    });
    return Array.from(set).sort();
  }, [stateMPs]);

  // Aggregate Financials - Exactly matching stateData and pure DB records
  const totalAllocated = useMemo(() => {
    if (stateData && stateData.totalAllocated > 0) return stateData.totalAllocated;
    return stateProjects.reduce((acc, p) => acc + (Number(p.sanctioned_amount || p.cost || 0)), 0);
  }, [stateData, stateProjects]);

  const totalExpenditure = useMemo(() => {
    if (stateData && stateData.totalExpenditure > 0) return stateData.totalExpenditure;
    return stateProjects.reduce((acc, p) => acc + (Number(p.utilized_amount || p.expenditure || 0)), 0);
  }, [stateData, stateProjects]);

  const unspentBalance = Math.max(0, totalAllocated - totalExpenditure);
  const utilizationRate = stateData && stateData.totalAllocated > 0
    ? stateData.utilizationPercentage
    : (totalAllocated > 0 ? Math.round((totalExpenditure / totalAllocated) * 100) : 0);

  const completedProjectsCount = stateProjects.filter((p) => (p.status || "").toLowerCase() === "completed").length;
  const ongoingProjectsCount = stateProjects.filter((p) => {
    const st = (p.status || "").toLowerCase();
    return st === "in progress" || st === "inprogress" || st === "ongoing";
  }).length;
  const delayedProjectsCount = stateProjects.filter((p) => (p.status || "").toLowerCase() === "delayed").length;
  const avgPerMp = stateMPs.length > 0 ? Math.round(totalAllocated / stateMPs.length) : 0;

  // Currency Formatter
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

  // District Aggregation
  const districtRollup = useMemo(() => {
    const map = new Map<string, { count: number; sanctioned: number; utilized: number }>();
    for (const p of stateProjects) {
      const d = p.district || "General State District";
      if (!map.has(d)) map.set(d, { count: 0, sanctioned: 0, utilized: 0 });
      const entry = map.get(d)!;
      entry.count++;
      entry.sanctioned += Number(p.sanctioned_amount || p.cost || 0);
      entry.utilized += Number(p.utilized_amount || p.expenditure || 0);
    }
    const list = Array.from(map.entries()).map(([district, data]) => ({
      district,
      ...data,
      utilization: data.sanctioned > 0 ? Math.min(100, Math.round((data.utilized / data.sanctioned) * 100)) : 0,
    }));

    return list
      .filter((d) => {
        if (districtStatusFilter === "on_schedule" && d.utilization < 70) return false;
        if (districtStatusFilter === "in_progress" && (d.utilization < 40 || d.utilization >= 70)) return false;
        if (districtStatusFilter === "pending" && d.utilization >= 40) return false;
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (districtSortBy === "district") diff = a.district.localeCompare(b.district);
        else if (districtSortBy === "count") diff = a.count - b.count;
        else if (districtSortBy === "sanctioned") diff = a.sanctioned - b.sanctioned;
        else if (districtSortBy === "utilized") diff = a.utilized - b.utilized;
        else if (districtSortBy === "utilization") diff = a.utilization - b.utilization;
        return districtSortOrder === "desc" ? -diff : diff;
      });
  }, [stateProjects, districtSortBy, districtSortOrder, districtStatusFilter]);

  // Sort and filter MPs
  const handleMpSort = (field: string) => {
    if (mpSortBy === field) {
      setMpSortOrder(mpSortOrder === "desc" ? "asc" : "desc");
    } else {
      setMpSortBy(field);
      setMpSortOrder(field === "name" || field === "constituency" || field === "house" ? "asc" : "desc");
    }
  };

  const sortedAndFilteredMPs = useMemo(() => {
    let list = stateMPs;
    if (mpHouseFilter !== "all") {
      list = list.filter((m) => m.house.toLowerCase() === mpHouseFilter.toLowerCase());
    }
    if (mpConstituencyFilter !== "all") {
      list = list.filter((m) => m.constituency.toLowerCase() === mpConstituencyFilter.toLowerCase());
    }
    if (mpSearch.trim()) {
      const q = mpSearch.toLowerCase();
      list = list.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.constituency.toLowerCase().includes(q) ||
        m.house.toLowerCase().includes(q)
      );
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (mpSortBy) {
        case "name":
          return mpSortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        case "constituency":
          return mpSortOrder === "asc" ? a.constituency.localeCompare(b.constituency) : b.constituency.localeCompare(a.constituency);
        case "house":
          return mpSortOrder === "asc" ? a.house.localeCompare(b.house) : b.house.localeCompare(a.house);
        case "totalSanctioned":
        case "allocated":
          valA = a.totalSanctioned || 0;
          valB = b.totalSanctioned || 0;
          break;
        case "totalUtilized":
        case "utilized":
          valA = a.totalUtilized || 0;
          valB = b.totalUtilized || 0;
          break;
        case "utilizationPercentage":
        case "utilization":
        default:
          valA = a.utilizationPercentage || 0;
          valB = b.utilizationPercentage || 0;
          break;
      }

      return mpSortOrder === "asc" ? valA - valB : valB - valA;
    });

    return sorted;
  }, [stateMPs, mpSearch, mpHouseFilter, mpConstituencyFilter, mpSortBy, mpSortOrder]);

  // Project Districts list
  const stateDistricts = useMemo(() => {
    const set = new Set<string>();
    stateProjects.forEach((p) => {
      if (p.district) set.add(p.district);
    });
    return Array.from(set).sort();
  }, [stateProjects]);

  // Filtered Projects for Tab 3
  const filteredProjects = useMemo(() => {
    return stateProjects
      .filter((p) => {
        if (projectStatusFilter !== "all" && (p.status || "").toLowerCase() !== projectStatusFilter.toLowerCase()) {
          return false;
        }
        if (projectCategoryFilter !== "all" && (p.category || "").toLowerCase() !== projectCategoryFilter.toLowerCase()) {
          return false;
        }
        if (projectDistrictFilter !== "all" && (p.district || "").toLowerCase() !== projectDistrictFilter.toLowerCase()) {
          return false;
        }
        if (projectSearch.trim()) {
          const q = projectSearch.toLowerCase();
          const title = (p.project_name || p.title || "").toLowerCase();
          const dist = (p.district || "").toLowerCase();
          const cat = (p.category || "").toLowerCase();
          const id = (p.project_id || p.id || "").toLowerCase();
          if (!title.includes(q) && !dist.includes(q) && !cat.includes(q) && !id.includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = 0;
        let valB: any = 0;
        if (projectSortBy === "title") return projectSortOrder === "asc" ? (a.project_name || a.title || "").localeCompare(b.project_name || b.title || "") : (b.project_name || b.title || "").localeCompare(a.project_name || a.title || "");
        if (projectSortBy === "district") return projectSortOrder === "asc" ? (a.district || "").localeCompare(b.district || "") : (b.district || "").localeCompare(a.district || "");
        if (projectSortBy === "category") return projectSortOrder === "asc" ? (a.category || "").localeCompare(b.category || "") : (b.category || "").localeCompare(a.category || "");
        if (projectSortBy === "sanctioned_amount") {
          valA = Number(a.sanctioned_amount || a.cost || 0);
          valB = Number(b.sanctioned_amount || b.cost || 0);
        } else if (projectSortBy === "progress") {
          valA = a.physical_progress ?? a.physicalProgress ?? 0;
          valB = b.physical_progress ?? b.physicalProgress ?? 0;
        } else if (projectSortBy === "status") {
          return projectSortOrder === "asc" ? (a.status || "").localeCompare(b.status || "") : (b.status || "").localeCompare(a.status || "");
        }
        return projectSortOrder === "desc" ? valB - valA : valA - valB;
      });
  }, [stateProjects, projectSearch, projectStatusFilter, projectCategoryFilter, projectDistrictFilter, projectSortBy, projectSortOrder]);

  // Project Categories list
  const projectCategories = useMemo(() => {
    const set = new Set<string>();
    stateProjects.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [stateProjects]);

  return (
    <div className="state-detail-page">
      {/* Top Header */}
      <div className="state-detail-header">
        <button onClick={onBack} className="back-link" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <ArrowLeft size={18} />
          Back to All States
        </button>

        <div className="state-title-section">
          <h1>{stateName}</h1>
          <p>State Overview, District Deployments & Parliamentary Performance • National MPLADS Portal</p>
        </div>

        {/* 4 Interactive Summary Stat Cards */}
        <div className="state-summary-stats">
          <div
            className="summary-stat"
            onClick={() => {
              setActiveTab("mps");
              setMpHouseFilter("all");
              setMpConstituencyFilter("all");
            }}
            title="Click to view all MPs from this State"
            style={{ cursor: "pointer", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px -3px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = "#93c5fd";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "";
            }}
          >
            <span className="stat-icon">
              <Users size={28} strokeWidth={1.75} />
            </span>
            <div>
              <span className="stat-value">{stateMPs.length || stateData?.mpCount || 0}</span>
              <span className="stat-label">Total MPs</span>
            </div>
          </div>

          <div
            className="summary-stat"
            onClick={() => setActiveTab("overview")}
            title="Click to inspect Financial Outlay"
            style={{ cursor: "pointer", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px -3px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = "#93c5fd";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "";
            }}
          >
            <span className="stat-icon">
              <IndianRupee size={28} strokeWidth={1.75} />
            </span>
            <div>
              <span className="stat-value">{formatINRCompact(totalAllocated)}</span>
              <span className="stat-label">Total Allocated</span>
            </div>
          </div>

          <div
            className="summary-stat"
            onClick={() => setActiveTab("overview")}
            title="Click to inspect Fund Utilization"
            style={{ cursor: "pointer", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px -3px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = "#93c5fd";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "";
            }}
          >
            <span className="stat-icon">
              <TrendingUp size={28} strokeWidth={1.75} />
            </span>
            <div>
              <span className={`stat-value utilization-${getUtilizationClass(utilizationRate)}`}>
                {utilizationRate}%
              </span>
              <span className="stat-label">Fund Utilization</span>
            </div>
          </div>

          <div
            className="summary-stat"
            onClick={() => {
              setActiveTab("projects");
              setProjectStatusFilter("completed");
            }}
            title="Click to view Completed Works"
            style={{ cursor: "pointer", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px -3px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = "#93c5fd";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "";
            }}
          >
            <span className="stat-icon">
              <CheckCircle2 size={28} strokeWidth={1.75} />
            </span>
            <div>
              <span className="stat-value">{completedProjectsCount.toLocaleString("en-IN")}</span>
              <span className="stat-label">Works Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* State Detail Tabs */}
      <div className="state-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "mps" ? "active" : ""}`}
          onClick={() => setActiveTab("mps")}
        >
          MPs Performance ({stateMPs.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "projects" ? "active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          Projects Directory ({stateProjects.length})
        </button>
      </div>

      {/* State Content Area */}
      <div className="state-content">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="overview-section">
            {/* Top Row: Gauge & MP Personality Types Donut (Matching Reference Architecture) */}
            <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "24px", marginBottom: "28px" }}>
              {/* Left Column: Fund Utilization Gauge */}
              <div className="chart-container" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <CivicUtilizationGauge
                  utilization={utilizationRate}
                  title={`${stateName} Utilization`}
                  cardHeader="Fund Utilization"
                  size="md"
                  hideCardWrap={true}
                />
              </div>

              {/* Right Column: MP Personality Types Donut */}
              <div className="chart-container" style={{ height: "100%" }}>
                <MPPersonalityDonut stateName={stateName} mps={stateMPs} />
              </div>
            </div>

            {/* Financial Breakdown Section (Interactive & Unified Card Architecture) */}
            <div className="financial-breakdown-card" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", marginBottom: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontFamily: "var(--font-serif, 'Cormorant Garamond', Georgia, serif)", fontSize: "1.3rem", fontWeight: 700, color: "#1e293b", margin: "0 0 20px 0" }}>
                Financial & Delivery Breakdown
              </h3>
              <div className="breakdown-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <div
                  className="breakdown-item"
                  style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", transition: "all 0.2s ease" }}
                >
                  <span className="breakdown-label" style={{ display: "block", fontSize: "0.74rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total Budget Approved</span>
                  <span className="breakdown-value" style={{ display: "block", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>{formatCurrency(totalAllocated)}</span>
                </div>
                <div
                  className="breakdown-item"
                  style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", transition: "all 0.2s ease" }}
                >
                  <span className="breakdown-label" style={{ display: "block", fontSize: "0.74rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Actual Money Spent</span>
                  <span className="breakdown-value" style={{ display: "block", fontSize: "1.2rem", fontWeight: 800, color: "#059669", marginTop: "4px" }}>{formatCurrency(totalExpenditure)}</span>
                </div>
                <div
                  className="breakdown-item"
                  style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", transition: "all 0.2s ease" }}
                >
                  <span className="breakdown-label" style={{ display: "block", fontSize: "0.74rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Remaining Balance</span>
                  <span className="breakdown-value" style={{ display: "block", fontSize: "1.2rem", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
                    {formatCurrency(unspentBalance)}
                  </span>
                </div>
                <div
                  className="breakdown-item cursor-pointer"
                  onClick={() => setActiveTab("mps")}
                  title="Click to view Parliamentarians list"
                  style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", transition: "all 0.2s ease", cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "#93c5fd";
                    e.currentTarget.style.background = "#eff6ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                >
                  <span className="breakdown-label" style={{ display: "block", fontSize: "0.74rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Average Budget per MP</span>
                  <span className="breakdown-value" style={{ display: "block", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>{formatCurrency(avgPerMp)}</span>
                </div>
                <div
                  className="breakdown-item cursor-pointer"
                  onClick={() => {
                    setActiveTab("projects");
                    setProjectStatusFilter("all");
                  }}
                  title="Click to view all projects"
                  style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", transition: "all 0.2s ease", cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "#93c5fd";
                    e.currentTarget.style.background = "#eff6ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                >
                  <span className="breakdown-label" style={{ display: "block", fontSize: "0.74rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total Local Projects</span>
                  <span className="breakdown-value" style={{ display: "block", fontSize: "1.2rem", fontWeight: 800, color: "#2563eb", marginTop: "4px" }}>{stateProjects.length} Works</span>
                </div>
                <div
                  className="breakdown-item cursor-pointer"
                  onClick={() => {
                    setActiveTab("projects");
                    setProjectStatusFilter("completed");
                  }}
                  title="Click to view Completed Works"
                  style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", transition: "all 0.2s ease", cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "#86efac";
                    e.currentTarget.style.background = "#f0fdf4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                >
                  <span className="breakdown-label" style={{ display: "block", fontSize: "0.74rem", color: "#047857", fontWeight: 600, textTransform: "uppercase" }}>Completed Works</span>
                  <span className="breakdown-value" style={{ display: "block", fontSize: "1.2rem", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
                    {completedProjectsCount} Works
                  </span>
                </div>
                <div
                  className="breakdown-item cursor-pointer"
                  onClick={() => {
                    setActiveTab("projects");
                    setProjectStatusFilter("in progress");
                  }}
                  title="Click to view Ongoing Works"
                  style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", transition: "all 0.2s ease", cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "#fde047";
                    e.currentTarget.style.background = "#fffbeb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                >
                  <span className="breakdown-label" style={{ display: "block", fontSize: "0.74rem", color: "#b45309", fontWeight: 600, textTransform: "uppercase" }}>Ongoing Works</span>
                  <span className="breakdown-value" style={{ display: "block", fontSize: "1.2rem", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
                    {ongoingProjectsCount} Works
                  </span>
                </div>
                <div
                  className="breakdown-item cursor-pointer"
                  onClick={() => {
                    setActiveTab("projects");
                    setProjectStatusFilter("delayed");
                  }}
                  title="Click to view Delayed Works"
                  style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", transition: "all 0.2s ease", cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "#fca5a5";
                    e.currentTarget.style.background = "#fef2f2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                >
                  <span className="breakdown-label" style={{ display: "block", fontSize: "0.74rem", color: "#b91c1c", fontWeight: 600, textTransform: "uppercase" }}>Delayed Works</span>
                  <span className="breakdown-value" style={{ display: "block", fontSize: "1.2rem", fontWeight: 800, color: "#dc2626", marginTop: "4px" }}>
                    {delayedProjectsCount} Works
                  </span>
                </div>
              </div>
            </div>

            {/* District Progress Table */}
            <div className="mps-section" style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ margin: 0 }}>District Progress in {stateName}</h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                    District-wise physical allocations, ground expenditure, and absorption efficiency
                  </p>
                </div>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2c5282", background: "#ebf8ff", padding: "4px 12px", borderRadius: "9999px" }}>
                  {districtRollup.length} Districts Recorded
                </span>
              </div>

              <div className="mps-table">
                <table>
                  <thead>
                    <tr>
                      <TableColumnHeader
                        title="District"
                        field="district"
                        currentSortField={districtSortBy}
                        currentSortDirection={districtSortOrder}
                        onSort={setDistrictSortBy}
                      />
                      <TableColumnHeader
                        title="Works Logged"
                        field="count"
                        currentSortField={districtSortBy}
                        currentSortDirection={districtSortOrder}
                        onSort={setDistrictSortBy}
                      />
                      <TableColumnHeader
                        title="Sanctioned Outlay"
                        field="sanctioned"
                        currentSortField={districtSortBy}
                        currentSortDirection={districtSortOrder}
                        onSort={setDistrictSortBy}
                      />
                      <TableColumnHeader
                        title="Certified Expenditure"
                        field="utilized"
                        currentSortField={districtSortBy}
                        currentSortDirection={districtSortOrder}
                        onSort={setDistrictSortBy}
                      />
                      <TableColumnHeader
                        title="Utilization Rate"
                        field="utilization"
                        currentSortField={districtSortBy}
                        currentSortDirection={districtSortOrder}
                        onSort={setDistrictSortBy}
                        filterOptions={[
                          { label: "All Tiers", value: "all" },
                          { label: "On Schedule (>= 70%)", value: "on_schedule" },
                          { label: "In Progress (40-69%)", value: "in_progress" },
                          { label: "Pending UC (< 40%)", value: "pending" },
                        ]}
                        selectedFilter={districtStatusFilter}
                        onFilterChange={setDistrictStatusFilter}
                        style={{ minWidth: "160px" }}
                      />
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 700 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districtRollup.map((dist) => (
                      <tr key={dist.district}>
                        <td style={{ fontWeight: 600, color: "#1e293b" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <MapPin size={15} color="#64748b" />
                            <span>{dist.district}</span>
                          </div>
                        </td>
                        <td>{dist.count} projects</td>
                        <td style={{ fontWeight: 600 }}>{formatINRCompact(dist.sanctioned)}</td>
                        <td style={{ color: "#059669", fontWeight: 600 }}>{formatINRCompact(dist.utilized)}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "120px" }}>
                            <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
                              <div
                                style={{
                                  height: "100%",
                                  width: `${dist.utilization}%`,
                                  background: dist.utilization >= 70 ? "#10b981" : dist.utilization >= 40 ? "#f59e0b" : "#ef4444",
                                  borderRadius: "9999px",
                                }}
                              />
                            </div>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>{dist.utilization}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`utilization-badge utilization-${getUtilizationClass(dist.utilization)}`}>
                            {dist.utilization >= 70 ? "On Schedule" : dist.utilization >= 40 ? "In Progress" : "Pending UC"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MPS PERFORMANCE */}
        {activeTab === "mps" && (
          <div className="mps-section">
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ margin: 0 }}>MPs Performance in {stateName}</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                  Parliamentary representatives, recommended works, and certified constituency expenditure
                </p>
              </div>

              {/* Search MP & Dropdowns */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                <div style={{ position: "relative", minWidth: "220px" }}>
                  <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    placeholder="Search MP or Constituency..."
                    value={mpSearch}
                    onChange={(e) => setMpSearch(e.target.value)}
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

                {/* House Filter Dropdown */}
                <select
                  value={mpHouseFilter}
                  onChange={(e) => setMpHouseFilter(e.target.value)}
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
                  <option value="all">Both Houses</option>
                  <option value="lok sabha">Lok Sabha</option>
                  <option value="rajya sabha">Rajya Sabha</option>
                </select>

                {/* Constituency Filter Dropdown */}
                {stateConstituencies.length > 0 && (
                  <select
                    value={mpConstituencyFilter}
                    onChange={(e) => setMpConstituencyFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.875rem",
                      background: "white",
                      color: "#334155",
                      cursor: "pointer",
                      maxWidth: "200px",
                    }}
                  >
                    <option value="all">All Constituencies ({stateConstituencies.length})</option>
                    {stateConstituencies.map((c) => (
                      <option key={c} value={c.toLowerCase()}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}

                {(mpSearch || mpHouseFilter !== "all" || mpConstituencyFilter !== "all") && (
                  <button
                    onClick={() => {
                      setMpSearch("");
                      setMpHouseFilter("all");
                      setMpConstituencyFilter("all");
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#f1f5f9",
                      color: "#475569",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            <div className="mps-table">
              <table>
                <thead>
                  <tr>
                    <TableColumnHeader
                      title="Member of Parliament"
                      field="name"
                      currentSortField={mpSortBy}
                      currentSortDirection={mpSortOrder}
                      onSort={handleMpSort}
                    />
                    <TableColumnHeader
                      title="Constituency"
                      field="constituency"
                      currentSortField={mpSortBy}
                      currentSortDirection={mpSortOrder}
                      onSort={handleMpSort}
                      filterOptions={[
                        { label: "All Constituencies", value: "all" },
                        ...stateConstituencies.map((c) => ({ label: c, value: c.toLowerCase() })),
                      ]}
                      selectedFilter={mpConstituencyFilter}
                      onFilterChange={setMpConstituencyFilter}
                    />
                    <TableColumnHeader
                      title="House"
                      field="house"
                      currentSortField={mpSortBy}
                      currentSortDirection={mpSortOrder}
                      onSort={handleMpSort}
                      filterOptions={[
                        { label: "Both Houses", value: "all" },
                        { label: "Lok Sabha", value: "lok sabha" },
                        { label: "Rajya Sabha", value: "rajya sabha" },
                      ]}
                      selectedFilter={mpHouseFilter}
                      onFilterChange={setMpHouseFilter}
                    />
                    <TableColumnHeader
                      title="Allocated"
                      field="totalSanctioned"
                      currentSortField={mpSortBy}
                      currentSortDirection={mpSortOrder}
                      onSort={handleMpSort}
                    />
                    <TableColumnHeader
                      title="Utilized"
                      field="totalUtilized"
                      currentSortField={mpSortBy}
                      currentSortDirection={mpSortOrder}
                      onSort={handleMpSort}
                    />
                    <TableColumnHeader
                      title="Utilization Rate"
                      field="utilizationPercentage"
                      currentSortField={mpSortBy}
                      currentSortDirection={mpSortOrder}
                      onSort={handleMpSort}
                      style={{ minWidth: "150px" }}
                    />
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 700 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFilteredMPs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                          <span>No Members of Parliament match your search or filter criteria.</span>
                          <button
                            onClick={() => {
                              setMpHouseFilter("all");
                              setMpConstituencyFilter("all");
                              setMpSearch("");
                            }}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              background: "#eff6ff",
                              color: "#2563eb",
                              border: "1px solid #bfdbfe",
                              fontWeight: 600,
                              fontSize: "0.82rem",
                              cursor: "pointer",
                            }}
                          >
                            Reset MP Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedAndFilteredMPs.map((mp) => (
                      <tr key={mp.mpId}>
                        <td>
                          <button
                            onClick={() => onSelectMP(mp)}
                            className="mp-link"
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              textAlign: "left",
                              fontWeight: 700,
                              fontSize: "0.92rem",
                            }}
                          >
                            {mp.name}
                          </button>
                        </td>
                        <td style={{ color: "#475569" }}>{mp.constituency}</td>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              background: mp.house.includes("Lok") ? "#eff6ff" : "#f5f3ff",
                              color: mp.house.includes("Lok") ? "#1e40af" : "#6b21a8",
                              border: `1px solid ${mp.house.includes("Lok") ? "#bfdbfe" : "#ddd6fe"}`,
                            }}
                          >
                            {mp.house}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatINRCompact(mp.totalSanctioned)}</td>
                        <td style={{ fontWeight: 600, color: "#059669" }}>{formatINRCompact(mp.totalUtilized)}</td>
                        <td>
                          <span className={`utilization-badge utilization-${getUtilizationClass(mp.utilizationPercentage)}`}>
                            {mp.utilizationPercentage}%
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => onSelectMP(mp)}
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
                            <span>View Dossier</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PROJECTS DIRECTORY */}
        {activeTab === "projects" && (
          <div className="projects-section">
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ margin: 0 }}>Ground Works in {stateName}</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                  Filter and inspect sanctioned public works and infrastructure projects
                </p>
              </div>

              {/* Filters & View Toggle */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                {/* Search */}
                <div style={{ position: "relative", minWidth: "220px" }}>
                  <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    placeholder="Search works, district, category..."
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

                {/* Status Filter */}
                <select
                  value={projectStatusFilter}
                  onChange={(e) => setProjectStatusFilter(e.target.value)}
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

                {/* District Filter */}
                {stateDistricts.length > 0 && (
                  <select
                    value={projectDistrictFilter}
                    onChange={(e) => setProjectDistrictFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.875rem",
                      background: "white",
                      color: "#334155",
                      cursor: "pointer",
                      maxWidth: "180px",
                    }}
                  >
                    <option value="all">All Districts ({stateDistricts.length})</option>
                    {stateDistricts.map((d) => (
                      <option key={d} value={d.toLowerCase()}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}

                {/* Category Filter */}
                {projectCategories.length > 0 && (
                  <select
                    value={projectCategoryFilter}
                    onChange={(e) => setProjectCategoryFilter(e.target.value)}
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
                    <option value="all">All Categories</option>
                    {projectCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}

                {(projectSearch || projectStatusFilter !== "all" || projectDistrictFilter !== "all" || projectCategoryFilter !== "all") && (
                  <button
                    onClick={() => {
                      setProjectSearch("");
                      setProjectStatusFilter("all");
                      setProjectDistrictFilter("all");
                      setProjectCategoryFilter("all");
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#f1f5f9",
                      color: "#475569",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Reset Filters
                  </button>
                )}

                {/* View Toggle */}
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

            {/* Results Feedback */}
            <div style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
              Showing {filteredProjects.length} of {stateProjects.length} projects in {stateName}
            </div>

            {projectViewMode === "grid" ? (
              filteredProjects.length === 0 ? (
                <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "48px 24px", textAlign: "center" }}>
                  <p style={{ color: "#64748b", margin: "0 0 12px 0", fontSize: "0.95rem" }}>
                    No projects found matching the selected filters.
                  </p>
                  <button
                    onClick={() => {
                      setProjectStatusFilter("all");
                      setProjectDistrictFilter("all");
                      setProjectCategoryFilter("all");
                      setProjectSearch("");
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
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
                    const progress = p.physical_progress ?? p.physicalProgress ?? 50;

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
                              {p.category || "General"}
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
                            {p.project_name || p.title || "MPLADS Infrastructure Asset"}
                          </h4>

                          {/* ID & District */}
                          <div style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "#64748b", marginBottom: "8px" }}>
                            ID: {p.project_id || p.id}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569", fontSize: "0.8rem", marginBottom: "14px" }}>
                            <MapPin size={14} style={{ color: "#2563eb" }} />
                            <span>{p.district || "District"}</span>
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
                              <span>Progress</span>
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

                          {/* Inspect link */}
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
              )
            ) : (
              /* TABLE VIEW */
              <div className="mps-table">
                <table>
                  <thead>
                    <tr>
                      <TableColumnHeader
                        title="Work ID & Title"
                        field="title"
                        currentSortField={projectSortBy}
                        currentSortDirection={projectSortOrder}
                        onSort={setProjectSortBy}
                      />
                      <TableColumnHeader
                        title="District"
                        field="district"
                        currentSortField={projectSortBy}
                        currentSortDirection={projectSortOrder}
                        onSort={setProjectSortBy}
                        filterOptions={[
                          { label: "All Districts", value: "all" },
                          ...stateDistricts.map((d) => ({ label: d, value: d.toLowerCase() })),
                        ]}
                        selectedFilter={projectDistrictFilter}
                        onFilterChange={setProjectDistrictFilter}
                      />
                      <TableColumnHeader
                        title="Category"
                        field="category"
                        currentSortField={projectSortBy}
                        currentSortDirection={projectSortOrder}
                        onSort={setProjectSortBy}
                        filterOptions={[
                          { label: "All Categories", value: "all" },
                          ...projectCategories.map((c) => ({ label: c, value: c.toLowerCase() })),
                        ]}
                        selectedFilter={projectCategoryFilter}
                        onFilterChange={setProjectCategoryFilter}
                      />
                      <TableColumnHeader
                        title="Sanctioned Outlay"
                        field="sanctioned_amount"
                        currentSortField={projectSortBy}
                        currentSortDirection={projectSortOrder}
                        onSort={setProjectSortBy}
                      />
                      <TableColumnHeader
                        title="Progress"
                        field="progress"
                        currentSortField={projectSortBy}
                        currentSortDirection={projectSortOrder}
                        onSort={setProjectSortBy}
                      />
                      <TableColumnHeader
                        title="Status"
                        field="status"
                        currentSortField={projectSortBy}
                        currentSortDirection={projectSortOrder}
                        onSort={setProjectSortBy}
                        filterOptions={[
                          { label: "All Statuses", value: "all" },
                          { label: "Completed", value: "completed" },
                          { label: "In Progress", value: "in progress" },
                          { label: "Sanctioned", value: "sanctioned" },
                          { label: "Delayed", value: "delayed" },
                        ]}
                        selectedFilter={projectStatusFilter}
                        onFilterChange={setProjectStatusFilter}
                      />
                      <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 700 }}>Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                            <span>No projects match the selected filters.</span>
                            <button
                              onClick={() => {
                                setProjectStatusFilter("all");
                                setProjectDistrictFilter("all");
                                setProjectCategoryFilter("all");
                                setProjectSearch("");
                              }}
                              style={{
                                padding: "6px 14px",
                                borderRadius: "6px",
                                background: "#eff6ff",
                                color: "#2563eb",
                                border: "1px solid #bfdbfe",
                                fontWeight: 600,
                                fontSize: "0.82rem",
                                cursor: "pointer",
                              }}
                            >
                              Reset Project Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((p) => {
                        const cost = p.sanctioned_amount || p.cost || 0;
                        const status = (p.status || "In Progress").toLowerCase();
                        const progress = p.physical_progress ?? p.physicalProgress ?? 50;

                        return (
                          <tr key={p.project_id || p.id}>
                            <td style={{ maxWidth: "320px" }}>
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
                                {p.project_name || p.title || "MPLADS Infrastructure Asset"}
                              </button>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#475569" }}>
                                <MapPin size={14} />
                                <span>{p.district || "General"}</span>
                              </div>
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
                                {p.category || "General"}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: "#1e293b" }}>
                              {formatINRCompact(cost)}
                            </td>
                            <td style={{ minWidth: "110px" }}>
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
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
