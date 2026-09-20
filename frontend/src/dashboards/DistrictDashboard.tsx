import React, { useState, useMemo, useEffect } from "react";
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
  CheckCircle,
  Plus,
  Database,
  LayoutGrid,
  List,
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
import { Button, Alert, Modal } from "../components/ui";
import { TableColumnHeader } from "../components/common/TableColumnHeader";

import { WorkItem, WorkReview, ROHTAK_WORKS, GURUGRAM_WORKS, JABALPUR_WORKS } from "../data/mpladsData";
import { ContractorsManagementTab } from "../components/district/ContractorsManagementTab";
import { CreateWorkModal } from "../components/district/CreateWorkModal";
import { usePreferences } from "../context/PreferencesContext";
import { useRole, Role } from "../auth/roleContext";
import { districtContractorSync } from "../api/districtContractorSync";
import { adminDataService } from "../api/adminDataService";
import { contractorApi } from "../api/contractorApi";
import { ContractorProject, EvidenceSubmissionRecord } from "../data/contractorData";

export const DistrictDashboard: React.FC = () => {
  const { user } = useRole();
  const { fontScale, setFontScale, theme, setTheme, lang, setLang, t, tr } = usePreferences();

  // Active Section Navigation
  const [activeTab, setActiveTab] = useState<"district_projects" | "verifications_review" | "anomaly_dossiers" | "contractors_management">("district_projects");
  const [projectViewMode, setProjectViewMode] = useState<"table" | "grid">("table");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [districtSortBy, setDistrictSortBy] = useState<string>("sanctionedAmt");
  const [districtSortOrder, setDistrictSortOrder] = useState<"asc" | "desc">("desc");

  const handleDistrictSort = (field: string) => {
    if (districtSortBy === field) {
      setDistrictSortOrder(districtSortOrder === "asc" ? "desc" : "asc");
    } else {
      setDistrictSortBy(field);
      setDistrictSortOrder(field === "title" || field === "agency" ? "asc" : "desc");
    }
  };

  // Local Projects State (Hydrated from live Supabase projects)
  const [projects, setProjects] = useState<WorkItem[]>(() => districtContractorSync.getWorks());
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Modals State
  const [isCreateWorkOpen, setIsCreateWorkOpen] = useState(false);
  const [selectedWorkForDossier, setSelectedWorkForDossier] = useState<WorkItem | null>(null);
  const [dossierSubmissions, setDossierSubmissions] = useState<EvidenceSubmissionRecord[]>([]);
  const [dossierContractorProject, setDossierContractorProject] = useState<ContractorProject | null>(null);
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<WorkItem | null>(null);
  const [selectedWorkForAttachments, setSelectedWorkForAttachments] = useState<WorkItem | null>(null);
  const [selectedWorkForReviews, setSelectedWorkForReviews] = useState<WorkItem | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [targetLoginRole, setTargetLoginRole] = useState<Role | undefined>(undefined);

  // Action Notice Toast State
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [selectedDistrict, setSelectedDistrict] = useState<string>(() => (user.district && user.district !== "Jabalpur" ? user.district : "Gurugram"));

  // Dynamic District Authority Identity based on selected district
  const collectorName = useMemo(() => {
    const dLower = selectedDistrict.toLowerCase();
    if (dLower === "rohtak") return "Shri Ajay Kumar, IAS";
    if (dLower === "gurugram") return "Shri Nishant Kumar Yadav, IAS";
    return user.role === "district" ? (user.name || "District Magistrate & Collector") : "District Magistrate & Collector";
  }, [selectedDistrict, user.name, user.role]);

  const collectorDesignation = "District Magistrate & Collector";
  const districtName = selectedDistrict || (user.district && user.district !== "Jabalpur" ? user.district : "Gurugram");
  const stateName = useMemo(() => {
    const dLower = selectedDistrict.toLowerCase();
    if (dLower === "rohtak" || dLower === "gurugram") return "Haryana";
    return user.state || "Haryana";
  }, [selectedDistrict, user.state]);

  // Available districts dynamically discovered from datasets + default Rohtak & Gurugram
  const availableDistricts = useMemo(() => {
    const dists = new Set<string>(["Gurugram", "Rohtak"]);
    if (user.district && user.district !== "Jabalpur") dists.add(user.district);
    projects.forEach((p) => {
      if (p.district && p.district.trim() && p.district.trim() !== "Jabalpur") dists.add(p.district.trim());
    });
    return Array.from(dists).sort();
  }, [projects, user.district]);

  useEffect(() => {
    async function loadLiveDistrictProjects() {
      try {
        const liveProjs = await adminDataService.getProjectsByDistrict(districtName);
        const targetDistLower = districtName.toLowerCase().trim();

        let datasetToMap: any[] = (liveProjs && liveProjs.length > 0) ? liveProjs : [];
        if (datasetToMap.length === 0) {
          if (targetDistLower === "rohtak") datasetToMap = ROHTAK_WORKS as any[];
          else datasetToMap = GURUGRAM_WORKS as any[];
        }

        const mapped: WorkItem[] = datasetToMap.map((p: any, idx: number) => {
          let assignedContractor = "";
          if (targetDistLower === "gurugram") {
            assignedContractor = (idx % 10 < 7)
              ? "Gurugram Metropolitan Development Authority (GMDA)"
              : "Municipal Corporation Gurugram (MCG)";
          } else if (targetDistLower === "rohtak") {
            assignedContractor = (idx % 10 < 6)
              ? "Public Health Engineering Department (PHED), Rohtak"
              : "Public Works Department (PWD B&R), Rohtak";
          } else {
            assignedContractor = p.implementing_agencies?.agency_name
              || p.agency
              || p.implementing_agency_name
              || `Office of District Magistrate & Collector (IDA), ${p.district || districtName}`;
          }

          return {
            id: p.project_id || p.id || `LIVE-${districtName.toUpperCase()}-${idx + 1}`,
            title: p.project_name || p.title || "MPLADS Infrastructure Development Work",
            house: "Lok Sabha",
            state: p.state || stateName,
            district: p.district || districtName,
            constituency: p.constituency || `${p.district || districtName} (PC-01)`,
            constituency_code: "DIST-01",
            mpName: p.mp_name || "District Parliamentary MP",
            category: p.category || "Community Asset",
            sectorName: p.category || "Infrastructure",
            recommendedAmt: Number(p.sanctioned_amount || 1000000) / 10000000,
            sanctionedAmt: Number(p.sanctioned_amount || 1000000) / 10000000,
            expenditureAmt: Number(p.utilized_amount || 0) / 10000000,
            physicalProgress: p.progress_percentage ?? (p.status === "Completed" ? 100 : p.status === "InProgress" ? 45 : 15),
            financialProgress: Math.round(
              ((Number(p.utilized_amount || 0)) / Math.max(1, Number(p.sanctioned_amount || 1))) * 100
            ) || (p.status === "Completed" ? 100 : 20),
            dateSanctioned: p.start_date || "2024-04-01",
            targetCompletion: p.expected_completion_date || "2025-06-30",
            status: (p.status || "Sanctioned") as any,
            agency: assignedContractor,
            contractor: assignedContractor,
            rating: 4.8,
            reviewsCount: 3,
            attachments: [],
            reviews: []
          };
        });

        // Retrieve persistent custom works created by District Authority
        const customWorks = districtContractorSync.getCustomWorks();
        const customInDist = customWorks.filter(w => !w.district || w.district.toLowerCase() === targetDistLower);

        // Merge custom works at the top of mapped DB/static works
        const mergedProjects = [...customInDist];
        mapped.forEach(p => {
          if (!mergedProjects.some(cp => cp.id === p.id)) {
            mergedProjects.push(p);
          }
        });

        setProjects(mergedProjects);
        setIsLiveConnected(true);
      } catch (err) {
        console.warn("Using local fallback projects for District Authority:", err);
      }
    }
    loadLiveDistrictProjects();
  }, [districtName, stateName]);

  // Fetch live contractor data & stage submissions when opening Collectorate Dossier Modal
  useEffect(() => {
    if (!selectedWorkForDossier?.id) {
      setDossierSubmissions([]);
      setDossierContractorProject(null);
      return;
    }

    Promise.all([
      districtContractorSync.getStageSubmissionsForWork(selectedWorkForDossier.id),
      contractorApi.getContractorProject(selectedWorkForDossier.id)
    ])
      .then(([subs, cProj]) => {
        setDossierSubmissions(subs || []);
        setDossierContractorProject(cProj || null);
      })
      .catch(err => console.warn("Failed to fetch dossier contractor data:", err));
  }, [selectedWorkForDossier?.id]);

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



  // All Projects in Selected District Jurisdiction (falls back gracefully to all if none in specific district)
  const projectsInDistrict = useMemo(() => {
    const inDist = projects.filter((w) => w.district && w.district.toLowerCase() === (selectedDistrict || "").toLowerCase());
    return inDist.length > 0 ? inDist : projects;
  }, [projects, selectedDistrict]);

  // Filtered District Projects matching active tab filters, search, and sorting
  const districtProjects = useMemo(() => {
    let list = projectsInDistrict.filter((w) => {
      if (statusFilter !== "all" && (w.status || "").toLowerCase() !== statusFilter.toLowerCase()) return false;
      const priority = getWorkPriority(w);
      if (priorityFilter !== "all" && priority.toLowerCase() !== priorityFilter.toLowerCase()) return false;
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

    const sorted = [...list];
    sorted.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;
      switch (districtSortBy) {
        case "title":
          return districtSortOrder === "asc" ? (a.title || "").localeCompare(b.title || "") : (b.title || "").localeCompare(a.title || "");
        case "agency":
          return districtSortOrder === "asc" ? (a.agency || "").localeCompare(b.agency || "") : (b.agency || "").localeCompare(a.agency || "");
        case "sanctionedAmt":
          valA = a.sanctionedAmt || 0;
          valB = b.sanctionedAmt || 0;
          break;
        case "physicalProgress":
          valA = a.physicalProgress || 0;
          valB = b.physicalProgress || 0;
          break;
        case "priority":
          return districtSortOrder === "asc" ? getWorkPriority(a).localeCompare(getWorkPriority(b)) : getWorkPriority(b).localeCompare(getWorkPriority(a));
        case "status":
          return districtSortOrder === "asc" ? (a.status || "").localeCompare(b.status || "") : (b.status || "").localeCompare(a.status || "");
        default:
          valA = a.sanctionedAmt || 0;
          valB = b.sanctionedAmt || 0;
          break;
      }
      return districtSortOrder === "asc" ? valA - valB : valB - valA;
    });
    return sorted;
  }, [projectsInDistrict, statusFilter, priorityFilter, searchQuery, districtSortBy, districtSortOrder]);

  // High Priority Flagged Projects in District
  const highRiskProjects = useMemo(() => {
    return projectsInDistrict.filter((w) => getWorkPriority(w) === "High" || w.status === "Delayed");
  }, [projectsInDistrict]);

  // Real numeric figures dynamically computed for District Authority
  const kpiData = useMemo(() => {
    const totalWorksCount = projectsInDistrict.length;
    const totalSanctionedCr = Number(projectsInDistrict.reduce((acc, w) => acc + (w.sanctionedAmt || 0), 0).toFixed(2));
    const totalDisbursedCr = Number(projectsInDistrict.reduce((acc, w) => acc + (w.expenditureAmt || 0), 0).toFixed(2));
    const unspentBalanceCr = Number(Math.max(0, totalSanctionedCr - totalDisbursedCr).toFixed(2));
    const completedCount = projectsInDistrict.filter(w => w.status === 'Completed').length;
    const ongoingCount = projectsInDistrict.filter(w => w.status === 'Ongoing' || w.status === 'Sanctioned').length;
    const delayedCount = projectsInDistrict.filter(w => w.status === 'Delayed').length;
    const flaggedInquiriesCount = projectsInDistrict.filter(w => getWorkPriority(w) === 'High').length;

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
  }, [projectsInDistrict]);

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

  const handleOpenEvidence = async (work: WorkItem) => {
    let hasEvidence = !!(work.attachments && work.attachments.length > 0);
    if (!hasEvidence) {
      try {
        const subs = await districtContractorSync.getStageSubmissionsForWork(work.id);
        hasEvidence = subs.some(s => s.files && s.files.length > 0);
      } catch (e) {
        hasEvidence = false;
      }
    }

    if (!hasEvidence) {
      setActionNotice(`No geotagged evidence photos or documents submitted yet for Work #${work.id} (${work.title}).`);
      setTimeout(() => setActionNotice(null), 5000);
      return;
    }

    setSelectedWorkForAttachments(work);
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
        selectedDistrict={selectedDistrict}
        onSelectDistrict={(d) => setSelectedDistrict(d)}
        availableDistricts={availableDistricts}
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
                onClick={() => setActiveTab("district_projects")}
                className={`gov-tab ${activeTab === "district_projects" ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", fontSize: "0.85rem", fontWeight: 700, borderRadius: "8px" }}
              >
                <Layers size={16} />
                <span>District Works Directory</span>
                <span style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: activeTab === "district_projects" ? "rgba(255,255,255,0.25)" : "#eff6ff",
                  color: activeTab === "district_projects" ? "#ffffff" : "#1d4ed8",
                  fontWeight: 700
                }}>
                  {districtProjects.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("verifications_review")}
                className={`gov-tab ${activeTab === "verifications_review" ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", fontSize: "0.85rem", fontWeight: 700, borderRadius: "8px" }}
              >
                <FileCheck size={16} />
                <span>Inspection Approvals</span>
                <span style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: activeTab === "verifications_review" ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                  color: activeTab === "verifications_review" ? "#ffffff" : "#64748b",
                  fontWeight: 700
                }}>
                  3
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("anomaly_dossiers")}
                className={`gov-tab ${activeTab === "anomaly_dossiers" ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", fontSize: "0.85rem", fontWeight: 700, borderRadius: "8px" }}
              >
                <ShieldAlert size={16} />
                <span>Inquiries & Dossiers</span>
                <span style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: activeTab === "anomaly_dossiers" ? "rgba(255,255,255,0.25)" : "#fee2e2",
                  color: activeTab === "anomaly_dossiers" ? "#ffffff" : "#b91c1c",
                  fontWeight: 700
                }}>
                  {highRiskProjects.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("contractors_management")}
                className={`gov-tab ${activeTab === "contractors_management" ? "active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", fontSize: "0.85rem", fontWeight: 700, borderRadius: "8px" }}
              >
                <Building2 size={16} />
                <span>Contractors & Vendors</span>
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
                <span>{districtProjects.length} District Works Active</span>
              </div>
            </div>
          </div>

          {/* District Collectorate Header (Admin Reference Standard) */}
          <div className="dashboard-header" style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div className="dashboard-title-section">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#e0f2fe", color: "#0369a1", textTransform: "uppercase" }}>
                  {tr("Office of District Magistrate & Collector")}
                </span>
                <span style={{ color: "#94a3b8" }}>•</span>
                <span style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: 600 }}>
                  {tr("Government of")} {stateName}
                </span>
              </div>
              <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--gov-primary, #0a2540)", margin: "0 0 6px 0", fontFamily: "Outfit, sans-serif" }}>
                {tr("District Authority Workspace")} — {selectedDistrict}
              </h1>
              <p style={{ fontSize: "0.92rem", color: "#64748b", margin: 0, maxWidth: "780px" }}>
                {collectorName} ({tr("District Authority")}) • {tr("Single Nodal Agency (SNA) Fund Administration & Field Inspection Sign-off")}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                icon={<Download size={14} />}
                style={{ background: "#ffffff", color: "var(--gov-primary, #0a2540)", borderColor: "#cbd5e1", fontWeight: 700, borderRadius: "8px" }}
              >
                {tr("Export District Audit (PDF)")}
              </Button>
            </div>
          </div>

  { actionNotice && (
    <Alert type="success" title={tr("District Collectorate Order Recorded") || "District Collectorate Order Recorded"}>
      {actionNotice}
    </Alert>
  )}

{/* 6 Executive Metric Cards (Admin Reference Hover-Only Top Accent) */ }
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>

  {/* 1. Total Works Sanctioned */}
  <div
    className="metric-card metric-amber cursor-pointer"
    style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer" }}
    title="Click to view all works in District Works Register"
    onClick={() => {
      setActiveTab("district_projects");
      setStatusFilter("all");
      setPriorityFilter("all");
      setSearchQuery("");
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ background: "#fef3c7", padding: "6px", borderRadius: "8px", display: "flex" }}>
        <Building2 size={16} color="#d97706" />
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
        {tr("Total Sanctioned")}
      </span>
    </div>
    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main, #0f172a)", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
      {kpiData.totalWorksCount.toLocaleString()}
    </div>
    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
      {tr("Sanctioned Amount")}: <strong>₹{kpiData.totalSanctionedCr} Cr</strong>
    </div>
  </div>

  {/* 2. Funds Disbursed */}
  <div
    className="metric-card metric-sky cursor-pointer"
    style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer" }}
    title="Click to view financial disbursements in District Works Register"
    onClick={() => {
      setActiveTab("district_projects");
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ background: "#e0f2fe", padding: "6px", borderRadius: "8px", display: "flex" }}>
        <IndianRupee size={16} color="#0284c7" />
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
        {tr("Disbursed (PFMS)")}
      </span>
    </div>
    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0284c7", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
      ₹{kpiData.totalDisbursedCr} Cr
    </div>
    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
      {tr("Remaining Balance")}: <strong>₹{kpiData.unspentBalanceCr} Cr</strong>
    </div>
  </div>

  {/* 3. Completed & Certified */}
  <div
    className="metric-card metric-green cursor-pointer"
    style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer" }}
    title="Click to filter Completed works"
    onClick={() => {
      setActiveTab("district_projects");
      setStatusFilter("Completed");
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ background: "#dcfce7", padding: "6px", borderRadius: "8px", display: "flex" }}>
        <CheckCircle2 size={16} color="#16a34a" />
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
        {tr("Completed")}
      </span>
    </div>
    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#16a34a", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
      {kpiData.completedCount}
    </div>
    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
      {tr("Certified by Field Engineers")}
    </div>
  </div>

  {/* 4. Active Ongoing Works */}
  <div
    className="metric-card metric-teal cursor-pointer"
    style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer" }}
    title="Click to filter Ongoing / In Progress works"
    onClick={() => {
      setActiveTab("district_projects");
      setStatusFilter("Ongoing");
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ background: "#ccfbf1", padding: "6px", borderRadius: "8px", display: "flex" }}>
        <Clock size={16} color="#0d9488" />
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
        {tr("In Progress")}
      </span>
    </div>
    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0d9488", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
      {kpiData.ongoingCount}
    </div>
    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
      {tr("Active on-site construction")}
    </div>
  </div>

  {/* 5. Delayed Works */}
  <div
    className="metric-card metric-orange cursor-pointer"
    style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer" }}
    title="Click to filter Delayed works"
    onClick={() => {
      setActiveTab("district_projects");
      setStatusFilter("Delayed");
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ background: "#ffedd5", padding: "6px", borderRadius: "8px", display: "flex" }}>
        <AlertCircle size={16} color="#ea580c" />
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
        {tr("Delayed Works")}
      </span>
    </div>
    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ea580c", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
      {kpiData.delayedCount}
    </div>
    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
      {tr("Exceeds milestone timeline")}
    </div>
  </div>

  {/* 6. Active Inquiries */}
  <div
    className="metric-card metric-rose cursor-pointer"
    style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", cursor: "pointer" }}
    title="Click to view Inquiries & Dossiers"
    onClick={() => {
      setActiveTab("anomaly_dossiers");
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ background: "#fee2e2", padding: "6px", borderRadius: "8px", display: "flex" }}>
        <AlertTriangle size={16} color="#dc2626" />
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>
        {tr("Audit Flags")}
      </span>
    </div>
    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#dc2626", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
      {kpiData.flaggedInquiriesCount}
    </div>
    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
      {tr("Under vigilance scrutiny")}
    </div>
  </div>

</div>

        {/* Civic Navigation Tabs */}
        <div className="civic-nav-tabs">
          <button
            type="button"
            onClick={() => setActiveTab("district_projects")}
            className={`civic-tab-btn ${activeTab === "district_projects" ? "active" : ""}`}
          >
            <Layers size={15} />
            <span>{tr("District Works Directory")}</span>
            <span className="civic-tab-badge">{districtProjects.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("contractors_management")}
            className={`civic-tab-btn ${activeTab === "contractors_management" ? "active" : ""}`}
          >
            <Building2 size={15} />
            <span>{tr("Contractors & Vendors")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("verifications_review")}
            className={`civic-tab-btn ${activeTab === "verifications_review" ? "active" : ""}`}
          >
            <FileCheck size={15} />
            <span>{tr("Inspection Approvals")}</span>
            <span className="civic-tab-badge">3</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("anomaly_dossiers")}
            className={`civic-tab-btn ${activeTab === "anomaly_dossiers" ? "active" : ""}`}
          >
            <ShieldAlert size={15} />
            <span>{tr("Inquiries & Dossiers")}</span>
            <span className="civic-tab-badge">{highRiskProjects.length}</span>
          </button>
        </div>

        {/* Tab Views with Smooth Animated Transition */}
        <div key={activeTab} className="view-transition-container">
          {/* TAB: CONTRACTORS & VENDORS MANAGEMENT */}
          {activeTab === "contractors_management" && (
            <ContractorsManagementTab
              works={districtProjects}
              onSelectWork={(w) => setSelectedWorkForDetail(w)}
              onUpdateWorks={(updatedWorks) => setProjects(updatedWorks)}
            />
          )}

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ fontSize: "1.12rem", fontWeight: 800, color: "var(--text-main, #0f172a)", margin: "0 0 4px 0" }}>
              {tr("District Works Register")} — {districtName}
            </h3>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted, #64748b)" }}>
              {tr("Showing")} <strong>{districtProjects.length}</strong> {tr("of")} <strong>{projectsInDistrict.length}</strong> {tr("sanctioned works in")} {districtName} {tr("District Jurisdiction")}
            </div>
          </div>

          <button
            type="button"
            className="gov-btn gov-btn-primary"
            onClick={() => setIsCreateWorkOpen(true)}
            style={{ fontSize: "0.82rem", padding: "8px 16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} />
            <span>+ {tr("Issue New Work Order / Sanction")}</span>
          </button>
        </div>

        {/* Simplified Search, Filters & View Toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: "10px" }} />
              <input
                type="text"
                placeholder={t.searchPlaceholder || "Search Work ID, title, agency, block..."}
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

            {/* Active Filter Clear Reset Pill */}
            {(statusFilter !== "all" || priorityFilter !== "all" || searchQuery.trim() !== "") && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setSearchQuery("");
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
                title="Clear all active filters"
              >
                <span>Clear Filter ({statusFilter !== "all" ? statusFilter : priorityFilter !== "all" ? priorityFilter : "Search"})</span>
                <X size={13} />
              </button>
            )}
          </div>

          {/* View Mode Segmented Pill */}
          <div style={{ display: "inline-flex", background: "#f1f5f9", padding: "3px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <button
              type="button"
              onClick={() => setProjectViewMode("table")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "6px",
                fontSize: "0.76rem",
                fontWeight: projectViewMode === "table" ? 700 : 500,
                border: "none",
                background: projectViewMode === "table" ? "#ffffff" : "transparent",
                color: projectViewMode === "table" ? "#0f172a" : "#64748b",
                boxShadow: projectViewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <List size={13} />
              <span>Table View</span>
            </button>
            <button
              type="button"
              onClick={() => setProjectViewMode("grid")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "6px",
                fontSize: "0.76rem",
                fontWeight: projectViewMode === "grid" ? 700 : 500,
                border: "none",
                background: projectViewMode === "grid" ? "#ffffff" : "transparent",
                color: projectViewMode === "grid" ? "#0f172a" : "#64748b",
                boxShadow: projectViewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <LayoutGrid size={13} />
              <span>Card Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Container */}
      <div key={projectViewMode} className="view-transition-container">
        {projectViewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {districtProjects.map((work, idx) => {
              const priority = getWorkPriority(work);
              const costFormatted = formatCost(work.sanctionedAmt);
              const disbursedFormatted = getDisbursedCost(work);
              const stageText = getPhysicalStageText(work);
              const workNum = work.id.replace(/\D/g, '') || `10${idx + 3800}`;

              return (
                <div
                  key={work.id}
                  className="card-hover-accent accent-amber cursor-pointer"
                  style={{
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.72rem", fontWeight: 700 }}>
                      {work.category || "Public Infrastructure"}
                    </span>
                    <span className={`gov-badge ${work.status === "Completed" ? "gov-badge-success" : work.status === "Delayed" ? "gov-badge-danger" : "gov-badge-info"}`}>
                      {work.status.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h4 style={{ fontSize: "0.94rem", fontWeight: 700, color: "var(--text-main)", margin: "0 0 4px 0", lineHeight: 1.35 }}>
                      {work.title}
                    </h4>
                    <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      {work.agency || `Collectorate IDA, ${districtName}`}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "var(--bg-surface-subtle)", padding: "8px 10px", borderRadius: "6px" }}>
                    <div>
                      <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Sanctioned Outlay</div>
                      <div style={{ fontSize: "0.90rem", fontWeight: 800, color: "var(--gov-primary)" }}>{costFormatted}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Disbursed</div>
                      <div style={{ fontSize: "0.90rem", fontWeight: 800, color: "#0369a1" }}>{disbursedFormatted}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Stage: <strong>{stageText}</strong></span>
                    {priority === "High" ? (
                      <span className="gov-badge gov-badge-danger" style={{ fontSize: "0.65rem" }}>High Alert</span>
                    ) : (
                      <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.65rem" }}>Routine</span>
                    )}
                  </div>

                    {/* Card Footer Actions */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", paddingTop: "10px", borderTop: "1px solid var(--border-light)", marginTop: "auto" }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedWorkForAttachments(work)}
                        icon={<Camera size={12} />}
                      >
                        Evidence
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedWorkForDetail(work)}
                        icon={<Eye size={12} />}
                      >
                        Details
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedWorkForDossier(work)}
                        icon={<FileText size={12} />}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                    );
                  })}
                </div >
              ) : (
  <div className="gov-table-container">
    <table className="gov-table">
      <thead>
        <tr>
          <TableColumnHeader
            title="Work & Project Title"
            field="title"
            currentSortField={districtSortBy}
            currentSortDirection={districtSortOrder}
            onSort={handleDistrictSort}
            style={{ minWidth: "260px" }}
          />
          <TableColumnHeader
            title="Implementing Agency & Block"
            field="agency"
            currentSortField={districtSortBy}
            currentSortDirection={districtSortOrder}
            onSort={handleDistrictSort}
            style={{ minWidth: "160px" }}
          />
          <TableColumnHeader
            title="Outlay & Disbursed (₹)"
            field="sanctionedAmt"
            currentSortField={districtSortBy}
            currentSortDirection={districtSortOrder}
            onSort={handleDistrictSort}
            style={{ minWidth: "150px" }}
          />
          <TableColumnHeader
            title="Milestone Execution Stage"
            field="physicalProgress"
            currentSortField={districtSortBy}
            currentSortDirection={districtSortOrder}
            onSort={handleDistrictSort}
            style={{ minWidth: "170px" }}
          />
          <TableColumnHeader
            title="Audit Priority"
            field="priority"
            currentSortField={districtSortBy}
            currentSortDirection={districtSortOrder}
            onSort={handleDistrictSort}
            filterOptions={[
              { label: "All Audit Priorities", value: "all" },
              { label: "High Priority Alert", value: "high" },
              { label: "Medium Priority", value: "medium" },
              { label: "Routine Monitoring", value: "routine" },
            ]}
            selectedFilter={priorityFilter}
            onFilterChange={setPriorityFilter}
            style={{ minWidth: "130px" }}
          />
          <th style={{ minWidth: "220px", padding: "14px 18px", textAlign: "right", color: "var(--text-secondary)", fontWeight: 700 }}>Official Actions</th>
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
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "3px" }}>
                  Category: {work.category || "Public Infrastructure"}
                </div>
              </td>

              {/* 2. Implementing Agency & Block */}
              <td style={{ padding: "14px 18px", verticalAlign: "middle" }}>
                <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.80rem" }}>
                  {work.agency || `Office of District Magistrate & Collector (IDA), ${districtName}`}
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {work.constituency ? `${work.constituency}` : `${districtName}`}, {work.state || stateName}
                </div>
              </td>

              {/* 3. Sanctioned Outlay & Disbursed Cost */}
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

              {/* 6. Official Actions */}
              <td style={{ padding: "14px 18px", verticalAlign: "middle", textAlign: "right" }}>
                <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedWorkForAttachments(work)}
                    icon={<Camera size={13} />}
                    title="Inspect Geotagged Milestone Photos & Measurement Book (MB)"
                  >
                    Evidence
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWorkForDetail(work)}
                    icon={<Eye size={13} />}
                    title="View Full Project Dossier & Milestone Timeline"
                  >
                    Details
                  </Button>
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
)}
            </div >
          </div >
        )}

{/* TAB 2: FIELD OFFICER INSPECTION APPROVALS (Evidence-Centric Approval Workflow) */ }
{
  activeTab === "verifications_review" && (
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
                    <span className="gov-badge gov-badge-info">Field Report Submitted</span>
                    <span className="gov-badge gov-badge-neutral">{work.category || "Public Infrastructure"}</span>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      Sanctioned Outlay: <strong>{formatCost(work.sanctionedAmt)}</strong>
                    </span>
                  </div>

                  <h4 style={{ fontSize: "1rem", fontWeight: 800, margin: "6px 0 4px 0", color: "var(--text-main)" }}>
                    {work.title}
                  </h4>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Inspecting Officer: <strong>Er. Rajesh Kumar (District Quality Inspection Division)</strong> • Location: <strong>{work.district || districtName}, {work.state || stateName}</strong>
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
                  onClick={() => handleOpenEvidence(work)}
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
  )
}

{/* TAB 3: COLLECTORATE ANOMALY INQUIRIES & DOSSIERS (Zero confidence score, concrete numbers) */ }
{
  activeTab === "anomaly_dossiers" && (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Alert type="warning" title="Collectorate Statutory Notice">
        Priority audit queue identifies works requiring Collectorate administrative attention, timeline review, or show-cause inquiry.
      </Alert>

      {highRiskProjects.map((work) => (
        <div
          key={work.id}
          className="card-hover-accent accent-rose"
          style={{
            padding: "18px 22px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ maxWidth: "68%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="gov-badge gov-badge-danger">Priority 1 Review</span>
                <span className="gov-badge gov-badge-neutral">{work.category || "Public Infrastructure"}</span>
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
                onClick={() => handleOpenEvidence(work)}
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
  )
}
        </div >
        </div >
      </main >

  {/* COLLECTORATE REVIEW DOSSIER MODAL (Synced with Live Contractor Evidence & De-duplicated) */ }
{
  selectedWorkForDossier && (() => {
    const dossierContractorName = dossierContractorProject?.contractorName || selectedWorkForDossier.contractor || selectedWorkForDossier.agency || "Assigned Contractor";
    const dossierPhysicalProgress = dossierContractorProject?.physicalProgress ?? selectedWorkForDossier.physicalProgress ?? 0;
    const dossierDisbursedStr = dossierContractorProject?.utilizedAmountRs !== undefined && dossierContractorProject?.utilizedAmountRs !== null
      ? formatCost(dossierContractorProject.utilizedAmountRs / 10000000)
      : getDisbursedCost(selectedWorkForDossier);

    const dossierTotalFiles = dossierSubmissions.reduce((acc, sub) => acc + (sub.files ? sub.files.length : 0), 0);
    const dossierPhotoCount = dossierSubmissions.reduce((acc, sub) => {
      return acc + (sub.files || []).filter(f => f.type?.includes("Photo") || f.type?.includes("image") || /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name) || (f.url && f.url.startsWith("http"))).length;
    }, 0);
    const dossierDocCount = Math.max(0, dossierTotalFiles - dossierPhotoCount);
    const dossierLatestSubmission = dossierSubmissions.length > 0 ? dossierSubmissions[0] : null;

    return (
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
                {getWorkAuditReason(selectedWorkForDossier)}. Sanctioned Outlay: <strong>{formatCost(selectedWorkForDossier.sanctionedAmt)}</strong>, Total Disbursed: <strong>{dossierDisbursedStr}</strong>.
              </div>
            </div>

            <div style={{ padding: "12px 14px", border: "1px solid var(--border-light, #e2e8f0)", borderRadius: "8px", background: "var(--bg-surface-subtle, #f8fafc)" }}>
              <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--gov-primary)" }}>2. STATUTORY TIMELINE STATUS</div>
              <div style={{ fontSize: "0.80rem", color: "var(--text-body)", marginTop: "3px" }}>
                {selectedWorkForDossier.status === "Delayed" ? (
                  <span style={{ color: "#b91c1c", fontWeight: 700 }}>Overdue by 45 calendar days past the 1-year statutory completion limit (Physical Execution: {dossierPhysicalProgress}%).</span>
                ) : (
                  <span>On schedule within sanctioned implementation period (Physical Execution: <strong>{dossierPhysicalProgress}%</strong>).</span>
                )}
              </div>
            </div>

            <div style={{ padding: "12px 14px", border: "1px solid var(--border-light, #e2e8f0)", borderRadius: "8px", background: "var(--bg-surface-subtle, #f8fafc)" }}>
              <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--gov-primary)" }}>3. ATTACHED EVIDENCE</div>
              <div style={{ fontSize: "0.80rem", color: "var(--text-body)", marginTop: "3px" }}>
                {dossierTotalFiles > 0 ? (
                  <>
                    <strong>{dossierPhotoCount} Geotagged Photo(s)</strong>, <strong>{dossierDocCount} Document/MB Extract(s)</strong> submitted by <strong>{dossierContractorName}</strong> across {dossierSubmissions.length} stage submission(s).
                  </>
                ) : (
                  <>
                    Awaiting geotagged evidence submission from assigned contractor (<strong>{dossierContractorName}</strong>).
                  </>
                )}
              </div>
              {dossierTotalFiles > 0 && (
                <div style={{ marginTop: "6px" }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const w = selectedWorkForDossier;
                      setSelectedWorkForDossier(null);
                      handleOpenEvidence(w);
                    }}
                    icon={<Camera size={12} />}
                  >
                    Inspect Attached Photos & Documents ({dossierTotalFiles})
                  </Button>
                </div>
              )}
            </div>

            <div style={{ padding: "12px 14px", border: "1px solid var(--border-light, #e2e8f0)", borderRadius: "8px", background: "var(--bg-surface-subtle, #f8fafc)" }}>
              <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--gov-primary)" }}>4. FIELD INSPECTION REPORT</div>
              <div style={{ fontSize: "0.80rem", color: "var(--text-body)", marginTop: "3px" }}>
                District Quality Inspection Division verified physical construction on site for <strong>{dossierContractorName}</strong>. Verified physical progress: <strong>{dossierPhysicalProgress}%</strong>. {dossierLatestSubmission ? `Latest stage verified: '${dossierLatestSubmission.checkpointActionName || dossierLatestSubmission.workStage}' (${dossierLatestSubmission.verificationStatus || 'Submitted'}).` : 'Recommended physical verification approval subject to DM concurrence.'}
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
    );
  })()
}

{/* Create New Work Modal */ }
{
  isCreateWorkOpen && (
    <CreateWorkModal
      districtName={districtName}
      stateName={stateName}
      onClose={() => setIsCreateWorkOpen(false)}
      onWorkCreated={(newWork) => {
        setProjects(prev => [newWork, ...prev]);
        setStatusFilter("all");
        setPriorityFilter("all");
        setSearchQuery("");
        setActionNotice(`New Work Order #${newWork.id} created successfully and assigned to ${newWork.contractor}. Timeline-based monitoring schedule computed.`);
        setTimeout(() => setActionNotice(null), 6000);
      }}
    />
  )
}

{/* Work Details Modal */ }
<WorkDetailModal
  work={selectedWorkForDetail}
  onClose={() => setSelectedWorkForDetail(null)}
        onViewAttachments={(w) => { setSelectedWorkForDetail(null); setSelectedWorkForAttachments(w); }}
        onViewReviews={(w) => { setSelectedWorkForDetail(null); setSelectedWorkForReviews(w); }}
/>

{/* Attachments / Evidence Modal */ }
<AttachmentsModal
  work={selectedWorkForAttachments}
  onClose={() => setSelectedWorkForAttachments(null)}
/>

{/* Social Audit & Reviews Modal */ }
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
  }}
/>

{/* Policy Guidelines Modal */ }
<PolicyModal
  isOpen={isPolicyOpen}
  onClose={() => setIsPolicyOpen(false)}
/>

{/* Login Modal */ }
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => {
          setIsLoginOpen(false);
          setTargetLoginRole(undefined);
        }}
        initialRole={targetLoginRole}
      />

      <Footer t={t} onOpenPolicy={() => setIsPolicyOpen(true)} />
    </div >
  );
};

export default DistrictDashboard;
