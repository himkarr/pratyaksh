import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  FileText, 
  Landmark, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  BarChart2, 
  UserCheck, 
  ShieldAlert, 
  Filter, 
  Eye, 
  Image as ImageIcon,
  Wallet,
  TrendingUp,
  CreditCard,
  Layers,
  ArrowRight
} from "lucide-react";
import { Header } from "../components/Header";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WorkDetailModal } from "../components/WorkDetailModal";
import { AttachmentsModal } from "../components/AttachmentsModal";
import { PolicyModal } from "../components/PolicyModal";
import { LoginModal } from "../components/LoginModal";
import { Button, Alert, Card, CardHeader, CardBody } from "../components/ui";
import { CreateRecommendationModal } from "../components/mp/CreateRecommendationModal";

import { MPRecommendation, INITIAL_MP_RECOMMENDATIONS } from "../data/mpData";
import { ALL_WORKS, WorkItem } from "../data/mpladsData";
import { INITIAL_CITIZEN_ISSUES, CitizenIssue } from "../data/citizenData";
import { usePreferences } from "../context/PreferencesContext";
import { useRole, Role } from "../auth/roleContext";

export const MPDashboard: React.FC = () => {
  const { user } = useRole();
  const { fontScale, setFontScale, theme, setTheme, lang, setLang, t } = usePreferences();

  // Active Section Navigation
  const [activeTab, setActiveTab] = useState<"my_recommendations" | "constituency_works" | "fund_details" | "citizen_reports" | "risk_alerts">("my_recommendations");

  // Data States
  const [recommendations, setRecommendations] = useState<MPRecommendation[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal Controls
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [prefilledCitizenId, setPrefilledCitizenId] = useState<string>("");
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<WorkItem | null>(null);
  const [selectedWorkForAttachments, setSelectedWorkForAttachments] = useState<WorkItem | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [targetLoginRole, setTargetLoginRole] = useState<Role | undefined>(undefined);

  // MP selector data mapping
  const MP_DATA: Record<string, { mpName: string; constituency: string; constituencyCode: string; district: string }> = {
    Pune: { mpName: "Murlidhar Mohol", constituency: "Pune", constituencyCode: "MH-PUNE-01", district: "Pune" },
    Varanasi: { mpName: "Narendra Modi", constituency: "Varanasi", constituencyCode: "UP-VARAN-01", district: "Varanasi" },
    "New Delhi": { mpName: "Bansuri Swaraj", constituency: "New Delhi", constituencyCode: "DL-NEW-DELHI-01", district: "New Delhi" }
  };

  const [selectedMP, setSelectedMP] = useState<string>("Pune");
  const mpInfo = MP_DATA[selectedMP] || {};
  const mpName = mpInfo.mpName || user.name || "Hon'ble MP";
  const constituency = mpInfo.constituency || user.constituency || "Constituency";
  const constituencyCode = mpInfo.constituencyCode || user.constituency_code || "CODE";
  const district = mpInfo.district || user.district || "District";

  // Filtered Constituency Projects (Scoped to MP's official parliamentary works)
  // Filtered Constituency Projects (Scoped to MP's official parliamentary works)
  const constituencyWorks = useMemo(() => {
    const matched = ALL_WORKS.filter((w) => {
      if (w.constituency_code === constituencyCode) return true;
      if (w.constituency && constituency && w.constituency.toLowerCase() === constituency.toLowerCase()) return true;
      if (district && w.district && w.district.toLowerCase() === district.toLowerCase()) return true;
      return false;
    });
    return matched;
  }, [constituencyCode, constituency, district]);

  const filteredInitialRecs = useMemo(() => {
    return INITIAL_MP_RECOMMENDATIONS.filter((rec) => {
      return rec.constituency_code === constituencyCode || 
        (rec.constituency && constituency && rec.constituency.toLowerCase() === constituency.toLowerCase());
    });
  }, [constituencyCode, constituency]);

  // Filter user-added recommendations for the active constituency
  const filteredUserRecs = useMemo(() => {
    return recommendations.filter((rec) => {
      return rec.constituency_code === constituencyCode || 
        (rec.constituency && constituency && rec.constituency.toLowerCase() === constituency.toLowerCase());
    });
  }, [recommendations, constituencyCode, constituency]);

  // Combine user-added recommendations with filtered initial recommendations
  const displayedRecommendations = useMemo(() => {
    return [...filteredUserRecs, ...filteredInitialRecs];
  }, [filteredUserRecs, filteredInitialRecs]);

  // Filter citizen issues for the selected constituency
  const filteredCitizenIssues = useMemo(() => {
    return INITIAL_CITIZEN_ISSUES.filter((issue) => {
      return (issue.constituency && constituency && issue.constituency.toLowerCase() === constituency.toLowerCase()) ||
        (district && issue.district && issue.district.toLowerCase() === district.toLowerCase());
    });
  }, [constituency, district]);

  // High Risk Projects
  const highRiskWorks = useMemo(() => {
    return constituencyWorks.filter((w) => w.status === "Delayed" || (w.financialProgress || 0) > (w.physicalProgress || 0) + 20);
  }, [constituencyWorks]);

  // Handlers
  const handleRecommendationSubmitted = (newRec: MPRecommendation) => {
    setRecommendations([newRec, ...recommendations]);
  };

  const handleAdoptCitizenIssue = (issueId: string) => {
    setPrefilledCitizenId(issueId);
    setIsRecommendModalOpen(true);
  };

  // Convert an MP Recommendation into a WorkItem for the detail dossier modal
  const recommendationToWorkItem = (rec: MPRecommendation): WorkItem => {
    const isSanctioned = rec.status === "SANCTIONED";
    const sanctionedAmt = rec.sanctionedCost || (isSanctioned ? rec.estimatedCost : 0);
    const expenditureAmt = isSanctioned ? Number((sanctionedAmt * 0.4).toFixed(2)) : 0;
    const physicalProgress = isSanctioned ? 35 : 0;
    const financialProgress = isSanctioned ? 40 : 0;

    return {
      id: rec.id,
      title: rec.title,
      house: "Lok Sabha",
      state: (rec.district && rec.district.toLowerCase() === "varanasi") ? "Uttar Pradesh" :
             (rec.district && rec.district.toLowerCase().includes("delhi")) ? "Delhi" : "Maharashtra",
      district: rec.district || district,
      constituency: rec.constituency || constituency,
      constituency_code: rec.constituency_code || constituencyCode,
      mpName: rec.mpName || mpName,
      category: rec.category,
      sectorName: rec.category,
      recommendedAmt: rec.estimatedCost,
      sanctionedAmt,
      expenditureAmt,
      physicalProgress,
      financialProgress,
      dateSanctioned: rec.dateSanctioned || (isSanctioned ? rec.dateProposed : ""),
      targetCompletion: "2025-06-30",
      status: isSanctioned ? "Sanctioned" : "Recommended",
      agency: rec.districtNotes ? "District Authority / PWD" : "Awaiting Agency Allocation",
      contractor: isSanctioned ? "Authorized Project Executing Agency" : "Tender Pending",
      rating: 4.8,
      reviewsCount: rec.citizenRequestId ? 1 : 0,
      attachments: [],
      reviews: rec.citizenRequestId ? [
        {
          id: `rev-${rec.id}`,
          author: "Citizen Stakeholder Panel",
          rating: 5,
          date: rec.dateProposed,
          comment: `Public development work initiated from Citizen Grievance #${rec.citizenRequestId}. Public necessity: ${rec.justification}`,
          verified: true
        }
      ] : [],
      justification: rec.justification,
      districtNotes: rec.districtNotes,
      citizenRequestId: rec.citizenRequestId
    };
  };

  // Aggregated Constituency Financial Metrics
  const metrics = useMemo(() => {
    const totalEntitlement = 5.00; // ₹5.00 Cr annual allocation
    const tenureEntitlement = 25.00; // ₹25.00 Cr 5-year tenure cap
    const totalRecommendedAmt = displayedRecommendations.reduce((acc, r) => acc + (r.estimatedCost || 0), 0);
    const sanctionedRecs = displayedRecommendations.filter((r) => r.status === "SANCTIONED");
    const totalSanctionedAmt = sanctionedRecs.reduce((acc, r) => acc + (r.sanctionedCost || r.estimatedCost || 0), 0);
    const recommendedCount = displayedRecommendations.length;
    const sanctionedCount = sanctionedRecs.length;
    const ongoingCount = constituencyWorks.filter((w) => w.status === "Ongoing").length;
    const completedCount = constituencyWorks.filter((w) => w.status === "Completed").length;
    const totalExpenditure = Number(constituencyWorks.reduce((acc, w) => acc + (w.expenditureAmt || 0), 0).toFixed(2));
    const totalDisbursed = Number(constituencyWorks.reduce((acc, w) => {
      const base = (w.sanctionedAmt || 0.8) * 0.5;
      const prog = (w.physicalProgress || 0) >= 50 || w.status === "Completed" ? (w.sanctionedAmt || 0.8) * 0.5 : 0;
      return acc + base + prog;
    }, 0).toFixed(2));
    const unspentInSNA = Number(Math.max(0, totalDisbursed - totalExpenditure).toFixed(2));
    const uncommittedBalance = Number(Math.max(0, totalEntitlement - totalSanctionedAmt).toFixed(2));
    const utilizationRate = Math.min(100, Math.round((totalSanctionedAmt / totalEntitlement) * 100));

    return {
      totalEntitlement,
      tenureEntitlement,
      totalRecommendedAmt,
      totalSanctionedAmt,
      recommendedCount,
      sanctionedCount,
      ongoingCount,
      completedCount,
      totalExpenditure,
      totalDisbursed,
      unspentInSNA,
      uncommittedBalance,
      utilizationRate
    };
  }, [displayedRecommendations, constituencyWorks]);

  // Sector-wise financial distribution
  const sectorFundDistribution = useMemo(() => {
    const sectors = [
      "Health",
      "Renewable Energy",
      "Drinking Water",
      "Education",
      "Roads",
      "Community Assets",
      "Sports"
    ];
    return sectors.map((sec) => {
      const recsInSec = displayedRecommendations.filter((r) => r.category === sec);
      const worksInSec = constituencyWorks.filter((w) => w.category === sec || w.sectorName === sec);
      const recAmt = recsInSec.reduce((acc, r) => acc + (r.estimatedCost || 0), 0);
      const sancAmt = recsInSec.filter(r => r.status === "SANCTIONED").reduce((acc, r) => acc + (r.sanctionedCost || r.estimatedCost || 0), 0) +
                      worksInSec.reduce((acc, w) => acc + (w.sanctionedAmt || 0), 0);
      const expAmt = worksInSec.reduce((acc, w) => acc + (w.expenditureAmt || 0), 0);
      const worksCount = recsInSec.length + worksInSec.length;
      return {
        sector: sec,
        worksCount,
        recAmt: Number(recAmt.toFixed(2)),
        sancAmt: Number(sancAmt.toFixed(2)),
        expAmt: Number(expAmt.toFixed(2)),
        pctOfTotal: metrics.totalSanctionedAmt > 0 ? Math.round((sancAmt / metrics.totalSanctionedAmt) * 100) : 0
      };
    }).filter(s => s.worksCount > 0 || s.recAmt > 0);
  }, [displayedRecommendations, constituencyWorks, metrics.totalSanctionedAmt]);

  // Disbursal & Installment Ledger line items
  const disbursalLedger = useMemo(() => {
    return constituencyWorks.map((work, idx) => {
      const tr1Amt = Number(((work.sanctionedAmt || 0.8) * 0.5).toFixed(2));
      const tr2Amt = work.status === "Completed" || (work.physicalProgress || 0) >= 50
        ? Number(((work.sanctionedAmt || 0.8) * 0.5).toFixed(2))
        : 0;
      const ucStatus = work.status === "Completed" 
        ? "Audited & Verified (SNA)" 
        : (work.physicalProgress || 0) >= 60 
        ? "Submitted Under Review" 
        : "Pending 80% Milestone";

      return {
        voucherNo: `AS/SNA/${constituencyCode}/${2024}-${(idx + 1).toString().padStart(3, "0")}`,
        workId: work.id,
        workTitle: work.title,
        agency: work.agency || "Public Works Department",
        sanctionDate: work.dateSanctioned || "2024-03-15",
        sanctionedAmt: work.sanctionedAmt,
        tranche1Amt: tr1Amt,
        tranche2Amt: tr2Amt,
        totalDisbursed: Number((tr1Amt + tr2Amt).toFixed(2)),
        expenditure: work.expenditureAmt,
        ucStatus,
        pfmsRef: `PFMS-E-ADV-${constituencyCode.slice(0, 4)}-${98234 + idx * 17}`,
        status: work.status,
        originalWork: work
      };
    });
  }, [constituencyWorks, constituencyCode]);

  // Filtered recommendations list (including initial demo data)
  const filteredRecommendations = useMemo(() => {
    return displayedRecommendations.filter((r) => {
      if (selectedCategoryFilter !== "all" && r.category !== selectedCategoryFilter) return false;
      if (selectedStatusFilter !== "all" && r.status !== selectedStatusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (r.title || "").toLowerCase().includes(query);
        const matchLoc = (r.location || "").toLowerCase().includes(query);
        const matchId = (r.id || "").toLowerCase().includes(query);
        if (!matchTitle && !matchLoc && !matchId) return false;
      }
      return true;
    });
  }, [displayedRecommendations, selectedCategoryFilter, selectedStatusFilter, searchQuery]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)" }}>
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
        activeTab={activeTab === "my_recommendations" ? "dashboard" : "home"}
        setActiveTab={() => setActiveTab("my_recommendations")}
        onOpenPolicy={() => setIsPolicyOpen(true)}
        onOpenLogin={(role) => {
          setTargetLoginRole(role);
          setIsLoginOpen(true);
        }}
        t={t}
        flagCount={highRiskWorks.length}
      />

      <main className="container" style={{ flex: 1, padding: "20px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Constituency MP Branding & Entitlement Banner */}
        <div 
          style={{ 
            background: "var(--gov-header)", 
            color: "var(--text-white)", 
            padding: "20px 24px", 
            borderRadius: "var(--radius-sm)", 
            border: "1px solid rgba(255, 255, 255, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px"
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-white)", margin: "0 0 6px 0" }}>
              {mpName} — {constituency} Constituency ({constituencyCode})
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#cbd5e1", maxWidth: "680px", lineHeight: "1.4", margin: 0 }}>
              Recommend constituency development projects, track sanction approvals, and monitor work execution.
            </p>
          </div>
          <select className="gov-select" style={{ width: "140px", marginRight: "8px" }} value={selectedMP} onChange={(e) => setSelectedMP(e.target.value)}>
            <option value="Pune">Pune</option>
            <option value="Varanasi">Varanasi</option>
            <option value="New Delhi">New Delhi</option>
          </select>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => { setPrefilledCitizenId(""); setIsRecommendModalOpen(true); }} 
            icon={<Plus size={18} />} 
            style={{ background: "#155eef", borderColor: "#155eef" }}
          >
            Recommend New Work
          </Button>
        </div>

        {/* Financial Cap & KPI Summary Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          
          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Annual Entitlement Cap
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
              ₹{metrics.totalEntitlement.toFixed(2)} Cr
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Sanctioned: <strong>₹{metrics.totalSanctionedAmt.toFixed(2)} Cr</strong> ({metrics.utilizationRate}%)
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Works Recommended
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
              {metrics.recommendedCount} Works
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Outlay: <strong>₹{metrics.totalRecommendedAmt.toFixed(2)} Cr</strong>
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Sanctioned & Ongoing
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-info-text)", marginTop: "2px" }}>
              {metrics.ongoingCount} Active
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              District Approved: {metrics.sanctionedCount}
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Completed Works
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-success-text)", marginTop: "2px" }}>
              {metrics.completedCount} Projects
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Verified & Handed Over
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              High-Risk / Delayed
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: highRiskWorks.length > 0 ? "var(--status-danger-text)" : "var(--status-success-text)", marginTop: "2px" }}>
              {highRiskWorks.length} Alerts
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Priority 1 Field Verification
            </div>
          </div>

        </div>

        {/* Section Navigation Tabs */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--border-light)", paddingBottom: "2px", flexWrap: "wrap" }}>
          
          <button
            onClick={() => setActiveTab("my_recommendations")}
            className={`gov-tab ${activeTab === "my_recommendations" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Landmark size={15} />
            <span>My MP Recommendations ({displayedRecommendations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("constituency_works")}
            className={`gov-tab ${activeTab === "constituency_works" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <FileText size={15} />
            <span>Constituency Works Grid ({constituencyWorks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("fund_details")}
            className={`gov-tab ${activeTab === "fund_details" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Wallet size={15} />
            <span>Fund Flow & Financial Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab("citizen_reports")}
            className={`gov-tab ${activeTab === "citizen_reports" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <UserCheck size={15} />
            <span>Citizen Public Reports ({filteredCitizenIssues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("risk_alerts")}
            className={`gov-tab ${activeTab === "risk_alerts" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ShieldAlert size={15} />
            <span>High-Risk Verification Alerts ({highRiskWorks.length})</span>
          </button>

        </div>

        {/* TAB 1: MY RECOMMENDATIONS */}
        {activeTab === "my_recommendations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* Filter Bar */}
            <div className="gov-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    type="text"
                    className="gov-input"
                    placeholder="Search by title, location, ID..."
                    style={{ width: "240px" }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="gov-select"
                  style={{ width: "160px" }}
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Drinking Water">Drinking Water</option>
                  <option value="Education">Education</option>
                  <option value="Roads">Roads</option>
                  <option value="Health">Health</option>
                  <option value="Community Assets">Community Assets</option>
                  <option value="Renewable Energy">Renewable Energy</option>
                  <option value="Sports">Sports</option>
                </select>

                <select
                  className="gov-select"
                  style={{ width: "160px" }}
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="PROPOSED">Proposed</option>
                  <option value="UNDER_SCRUTINY">Under Scrutiny</option>
                  <option value="SANCTIONED">Sanctioned</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Showing <strong>{filteredRecommendations.length}</strong> of <strong>{displayedRecommendations.length}</strong> recommendations
              </div>
            </div>

            {/* Recommendations Table */}
            <div className="gov-card" style={{ overflowX: "auto" }}>
              <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Recommendation ID</th>
                    <th style={{ padding: "10px 12px" }}>Work Title & Description</th>
                    <th style={{ padding: "10px 12px" }}>Category</th>
                    <th style={{ padding: "10px 12px" }}>Estimated Outlay</th>
                    <th style={{ padding: "10px 12px" }}>Location</th>
                    <th style={{ padding: "10px 12px" }}>Date Proposed</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                    <th style={{ padding: "10px 12px" }}>District Status & Notes</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecommendations.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                        No work recommendations found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRecommendations.map((rec) => (
                      <tr 
                        key={rec.id} 
                        onClick={() => setSelectedWorkForDetail(recommendationToWorkItem(rec))}
                        style={{ borderBottom: "1px solid var(--border-light)", cursor: "pointer" }}
                        title="Click to inspect all project details and dossier"
                      >
                        <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, color: "var(--gov-primary)" }}>
                          {rec.id}
                        </td>
                        <td style={{ padding: "10px 12px", maxWidth: "280px" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>{rec.title}</span>
                            <Eye size={13} color="var(--gov-primary)" style={{ opacity: 0.6 }} />
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>{rec.justification}</div>
                          {rec.citizenRequestId && (
                            <span className="gov-badge gov-badge-info" style={{ fontSize: "0.64rem", marginTop: "4px", display: "inline-block" }}>
                              Citizen Request #{rec.citizenRequestId}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span className="gov-badge gov-badge-neutral">{rec.category}</span>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--gov-primary)" }}>
                          ₹{rec.estimatedCost.toFixed(2)} Cr
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "0.78rem" }}>
                          {rec.location}
                        </td>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                          {rec.dateProposed}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {rec.status === "SANCTIONED" && <span className="gov-badge gov-badge-success">SANCTIONED</span>}
                          {rec.status === "UNDER_SCRUTINY" && <span className="gov-badge gov-badge-warning">UNDER SCRUTINY</span>}
                          {rec.status === "PROPOSED" && <span className="gov-badge gov-badge-info">PROPOSED</span>}
                          {rec.status === "REJECTED" && <span className="gov-badge gov-badge-danger">REJECTED</span>}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "0.76rem", color: "var(--text-body)", maxWidth: "220px" }}>
                          {rec.districtNotes || "Under review by District Administration"}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setSelectedWorkForDetail(recommendationToWorkItem(rec))} 
                            icon={<Eye size={12} />}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CONSTITUENCY WORKS GRID */}
        {activeTab === "constituency_works" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="gov-card" style={{ overflowX: "auto" }}>
              <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Work ID</th>
                    <th style={{ padding: "10px 12px" }}>Project Name</th>
                    <th style={{ padding: "10px 12px" }}>Sanction Cost</th>
                    <th style={{ padding: "10px 12px" }}>Expenditure</th>
                    <th style={{ padding: "10px 12px" }}>Physical Progress</th>
                    <th style={{ padding: "10px 12px" }}>Financial Progress</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                    <th style={{ padding: "10px 12px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {constituencyWorks.map((work) => (
                    <tr 
                      key={work.id} 
                      onClick={() => setSelectedWorkForDetail(work)}
                      style={{ borderBottom: "1px solid var(--border-light)", cursor: "pointer" }}
                      title="Click on project to view full official dossier and details"
                    >
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, color: "var(--gov-primary)" }}>
                        {work.id}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{work.title}</span>
                          <Eye size={13} color="var(--gov-primary)" style={{ opacity: 0.6 }} />
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 400 }}>
                          {work.district}, {work.state} | Agency: {work.agency}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>₹{work.sanctionedAmt.toFixed(2)} Cr</td>
                      <td style={{ padding: "10px 12px" }}>₹{work.expenditureAmt.toFixed(2)} Cr</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${work.physicalProgress}%`, height: "100%", background: "#10b981" }} />
                          </div>
                          <span>{work.physicalProgress}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${work.financialProgress}%`, height: "100%", background: "#3b82f6" }} />
                          </div>
                          <span>{work.financialProgress}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span className={`gov-badge ${work.status === "Completed" ? "gov-badge-success" : work.status === "Delayed" ? "gov-badge-danger" : "gov-badge-info"}`}>
                          {work.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <Button variant="secondary" size="sm" onClick={() => setSelectedWorkForDetail(work)} icon={<Eye size={12} />}>
                            Inspect
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setSelectedWorkForAttachments(work)} icon={<ImageIcon size={12} />}>
                            Photos
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DETAILED FUND RELATED INFORMATION & DISBURSAL LEDGER */}
        {activeTab === "fund_details" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Header / Context Banner */}
            <div className="gov-card" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderLeft: "4px solid var(--gov-primary)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span className="gov-badge gov-badge-info">e-SAKSHI WEB-FUND FLOW</span>
                  <span style={{ fontSize: "0.8rem", fontFamily: "monospace", fontWeight: 700, color: "var(--gov-primary)" }}>
                    SNA-PFMS: {constituencyCode}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--gov-primary)", margin: "0 0 4px 0" }}>
                  Constituency Financial Ledger & Central Fund Flow Analytics
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                  Live financial tracking for <strong>{constituency}</strong> | Hon'ble MP: <strong>{mpName}</strong> | District: <strong>{district}</strong>
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Button variant="secondary" size="sm" onClick={() => window.print()} icon={<FileText size={13} />}>
                  Print Statement
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsPolicyOpen(true)} icon={<Landmark size={13} />}>
                  e-SAKSHI Guidelines
                </Button>
              </div>
            </div>

            {/* Financial Cap & KPI Breakdown Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              <div className="gov-card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Annual Entitlement (FY 24-25)
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
                  ₹{metrics.totalEntitlement.toFixed(2)} Cr
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  5-Yr Term Cap: <strong>₹{metrics.tenureEntitlement.toFixed(2)} Cr</strong>
                </div>
              </div>

              <div className="gov-card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Total Proposed Outlay
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
                  ₹{metrics.totalRecommendedAmt.toFixed(2)} Cr
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {displayedRecommendations.length} Works Recommended by MP
                </div>
              </div>

              <div className="gov-card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Administratively Sanctioned
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-info-text)", marginTop: "2px" }}>
                  ₹{metrics.totalSanctionedAmt.toFixed(2)} Cr
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Fund Utilization: <strong>{metrics.utilizationRate}%</strong> of annual cap
                </div>
              </div>

              <div className="gov-card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Disbursed from SNA
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-info-text)", marginTop: "2px" }}>
                  ₹{metrics.totalDisbursed.toFixed(2)} Cr
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  PFMS Transferred to Executing Agencies
                </div>
              </div>

              <div className="gov-card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Cumulative Ground Spend
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-success-text)", marginTop: "2px" }}>
                  ₹{metrics.totalExpenditure.toFixed(2)} Cr
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Vouched Ground Progress
                </div>
              </div>

              <div className="gov-card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Committed SNA Balance
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
                  ₹{metrics.unspentInSNA.toFixed(2)} Cr
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Remaining in Tranche Pipeline
                </div>
              </div>

              <div className="gov-card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Uncommitted Headroom
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: metrics.uncommittedBalance > 0 ? "var(--gov-primary)" : "var(--status-danger-text)", marginTop: "2px" }}>
                  ₹{metrics.uncommittedBalance.toFixed(2)} Cr
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Available to Sanction in FY 24-25
                </div>
              </div>

              <div className="gov-card" style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Accrued Treasury Interest
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-muted)", marginTop: "2px" }}>
                  ₹0.18 Cr
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Remitted to CFI via Bharatkosh
                </div>
              </div>
            </div>

            {/* e-SAKSHI Web-Fund Flow 4-Stage Architecture Diagram */}
            <div className="gov-card" style={{ padding: "16px 20px" }}>
              <h4 style={{ fontSize: "0.96rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                e-SAKSHI Central-to-District Real-Time Web Fund Architecture
              </h4>
              <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                Under revised guidelines effective 1st April 2023, physical checks are eliminated and funds flow electronically through PFMS Zero-Balance Virtual Accounts.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                
                <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-main)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span className="gov-badge gov-badge-info" style={{ fontSize: "0.68rem" }}>STAGE 1</span>
                    <Landmark size={14} color="var(--gov-primary)" />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-main)" }}>Central Ministry (MoSPI)</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.35" }}>
                    Annual entitlement ₹5.00 Cr sanctioned and credited electronically into the State Nodal Account (SNA).
                  </div>
                </div>

                <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-main)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span className="gov-badge gov-badge-info" style={{ fontSize: "0.68rem" }}>STAGE 2</span>
                    <Wallet size={14} color="var(--gov-primary)" />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-main)" }}>State Nodal Account (SNA)</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.35" }}>
                    Virtual PFMS sub-ledger maintained without idle parking; interest earned reconciled semi-annually.
                  </div>
                </div>

                <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-main)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span className="gov-badge gov-badge-info" style={{ fontSize: "0.68rem" }}>STAGE 3</span>
                    <CheckCircle2 size={14} color="#10b981" />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-main)" }}>District Authority / Collector</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.35" }}>
                    Administrative sanction issued; 50% 1st Tranche advance released immediately to implementing agency.
                  </div>
                </div>

                <div style={{ background: "var(--bg-surface-subtle)", padding: "12px 14px", borderRadius: "var(--radius-xs)", border: "1px solid var(--border-main)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span className="gov-badge gov-badge-info" style={{ fontSize: "0.68rem" }}>STAGE 4</span>
                    <TrendingUp size={14} color="#10b981" />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--text-main)" }}>Agency & Vendor Settlement</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.35" }}>
                    2nd Tranche (50%) released upon 80% physical progress + verified Utilization Certificate (UC) upload.
                  </div>
                </div>

              </div>
            </div>

            {/* Sector-wise Allocation & Ground Spend Breakdown */}
            <div className="gov-card" style={{ padding: "16px 20px" }}>
              <h4 style={{ fontSize: "0.96rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                Sector-wise Fund Allocation & Expenditure Trajectory
              </h4>
              <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                Analysis of MP priority areas across essential infrastructure sectors in {constituency}.
              </p>

              <div style={{ overflowX: "auto" }}>
                <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                      <th style={{ padding: "10px 12px" }}>Development Sector</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Works Count</th>
                      <th style={{ padding: "10px 12px" }}>Recommended Outlay</th>
                      <th style={{ padding: "10px 12px" }}>Sanctioned Cost</th>
                      <th style={{ padding: "10px 12px" }}>Ground Expenditure</th>
                      <th style={{ padding: "10px 12px", minWidth: "160px" }}>Budget Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectorFundDistribution.map((item) => {
                      const utilPct = item.sancAmt > 0 ? Math.min(100, Math.round((item.expAmt / item.sancAmt) * 100)) : 0;
                      return (
                        <tr key={item.sector} style={{ borderBottom: "1px solid var(--border-light)" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                            <span className="gov-badge gov-badge-neutral">{item.sector}</span>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>
                            {item.worksCount}
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--gov-primary)" }}>
                            ₹{item.recAmt.toFixed(2)} Cr
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--status-info-text)" }}>
                            ₹{item.sancAmt.toFixed(2)} Cr
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--status-success-text)" }}>
                            ₹{item.expAmt.toFixed(2)} Cr
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{ width: `${utilPct}%`, height: "100%", background: utilPct >= 80 ? "#10b981" : "#3b82f6" }} />
                              </div>
                              <span style={{ fontSize: "0.74rem", fontWeight: 700 }}>{utilPct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Disbursal & Installment Ledger */}
            <div className="gov-card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <h4 style={{ fontSize: "0.96rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
                    Constituency Project Disbursal & Installment Ledger
                  </h4>
                  <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                    Showing {disbursalLedger.length} active project sanction vouchers in {constituency}
                  </p>
                </div>
                <span className="gov-badge gov-badge-info">PFMS Direct Electronic Advice Verified</span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                      <th style={{ padding: "10px 12px" }}>Sanction Voucher No.</th>
                      <th style={{ padding: "10px 12px" }}>Project Name & Agency</th>
                      <th style={{ padding: "10px 12px" }}>Sanctioned Cost</th>
                      <th style={{ padding: "10px 12px" }}>Tranche 1 (50%)</th>
                      <th style={{ padding: "10px 12px" }}>Tranche 2 (50%)</th>
                      <th style={{ padding: "10px 12px" }}>Total Released</th>
                      <th style={{ padding: "10px 12px" }}>UC Compliance</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disbursalLedger.map((row) => (
                      <tr 
                        key={row.voucherNo} 
                        onClick={() => setSelectedWorkForDetail(row.originalWork)}
                        style={{ borderBottom: "1px solid var(--border-light)", cursor: "pointer" }}
                        title="Click to inspect full project dossier"
                      >
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.78rem", color: "var(--gov-primary)" }}>
                            {row.voucherNo}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {row.pfmsRef}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", maxWidth: "260px" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>{row.workTitle}</span>
                            <Eye size={13} color="var(--gov-primary)" style={{ opacity: 0.6 }} />
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            Agency: <strong>{row.agency}</strong> | Sanctioned: {row.sanctionDate}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                          ₹{row.sanctionedAmt.toFixed(2)} Cr
                        </td>
                        <td style={{ padding: "10px 12px", color: "var(--status-info-text)", fontWeight: 600 }}>
                          ₹{row.tranche1Amt.toFixed(2)} Cr
                        </td>
                        <td style={{ padding: "10px 12px", color: row.tranche2Amt > 0 ? "var(--status-success-text)" : "var(--text-muted)", fontWeight: 600 }}>
                          {row.tranche2Amt > 0 ? `₹${row.tranche2Amt.toFixed(2)} Cr` : "Pending Milestone"}
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--gov-primary)" }}>
                          ₹{row.totalDisbursed.toFixed(2)} Cr
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span className={`gov-badge ${
                            row.ucStatus.includes("Audited") 
                              ? "gov-badge-success" 
                              : row.ucStatus.includes("Review") 
                              ? "gov-badge-warning" 
                              : "gov-badge-neutral"
                          }`}>
                            {row.ucStatus}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => setSelectedWorkForDetail(row.originalWork)} 
                            icon={<Eye size={12} />}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statutory Treasury Guidelines Banner */}
            <div className="gov-card" style={{ padding: "16px 20px", background: "var(--bg-surface-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <CheckCircle2 size={16} color="#10b981" />
                <h4 style={{ fontSize: "0.92rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
                  Statutory e-SAKSHI Treasury & Audit Rules Reference
                </h4>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", fontSize: "0.78rem", color: "var(--text-body)", lineHeight: "1.45" }}>
                <div>
                  <strong>• Non-Lapsable Fund Nature:</strong> MPLADS funds are non-lapsable. Unspent balances from FY 2024-25 carry over automatically to the subsequent financial year within the MP's tenure.
                </div>
                <div>
                  <strong>• 1-Year Execution Mandate:</strong> Works must be physically executed and completed within 12 calendar months of administrative sanction date as stipulated under Clause 4.2.
                </div>
                <div>
                  <strong>• Zero Balance Accounts (ZBA):</strong> Implementing agencies operate virtual sub-accounts under the State Nodal Account (SNA), ensuring no idle public funds remain unmonitored.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: CITIZEN REPORTS */}
        {activeTab === "citizen_reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="gov-card" style={{ padding: "14px 16px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                Public Citizen Infrastructure Demands & Grievance Submissions
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                Review verified citizen requests from {constituency} constituency and adopt them into official MP MPLADS work recommendations.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {filteredCitizenIssues.map((issue) => (
                  <div 
                    key={issue.id} 
                    style={{ 
                      padding: "14px 16px", 
                      border: "1px solid var(--border-main)", 
                      borderRadius: "var(--radius-xs)", 
                      background: "var(--bg-surface)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "12px"
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "280px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem", color: "var(--gov-primary)" }}>
                          {issue.id}
                        </span>
                        <span className="gov-badge gov-badge-neutral">{issue.category}</span>
                        <span className="gov-badge gov-badge-info">{issue.status}</span>
                      </div>

                      <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                        {issue.title}
                      </h4>
                      <p style={{ fontSize: "0.78rem", color: "var(--text-body)", marginBottom: "6px", lineHeight: "1.4" }}>
                        {issue.description}
                      </p>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Submitted by: <strong>{issue.submittedBy || "Resident Citizen"}</strong> | Location: <strong>{issue.locationName}</strong> | Submitted: <strong>{issue.dateSubmitted}</strong>
                      </div>
                    </div>

                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleAdoptCitizenIssue(issue.id)}
                      icon={<Plus size={14} />}
                    >
                      Adopt as MP Recommendation
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RISK ALERTS */}
        {activeTab === "risk_alerts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Alert type="warning" title="Verification Priority Signal Notice">
              Note: Risk signals indicate high priority for field verification, NOT proof of fraud or non-compliance.
            </Alert>

            {highRiskWorks.map((work) => (
              <div 
                key={work.id} 
                className="gov-card" 
                onClick={() => setSelectedWorkForDetail(work)}
                style={{ padding: "14px 16px", borderLeft: "4px solid var(--status-danger-text)", cursor: "pointer" }}
                title="Click to inspect full AI anomaly dossier"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="gov-badge gov-badge-danger">HIGH RISK (PRIORITY 1)</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem" }}>{work.id}</span>
                    </div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "6px 0 2px 0" }}>{work.title}</h4>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Financial Progress: <strong>{work.financialProgress}%</strong> vs Physical Progress: <strong>{work.physicalProgress}%</strong>
                    </div>
                  </div>

                  <Button variant="secondary" size="sm" onClick={() => setSelectedWorkForDetail(work)} icon={<Eye size={13} />}>
                    Inspect Full AI Anomaly Dossier
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Modals */}
      <CreateRecommendationModal
        isOpen={isRecommendModalOpen}
        onClose={() => setIsRecommendModalOpen(false)}
        onSubmitted={handleRecommendationSubmitted}
        mpName={mpName}
        constituency={constituency}
        constituencyCode={constituencyCode}
        district={district}
        initialCitizenId={prefilledCitizenId}
      />

      <WorkDetailModal
        work={selectedWorkForDetail}
        onClose={() => setSelectedWorkForDetail(null)}
        onViewAttachments={(w) => { setSelectedWorkForDetail(null); setSelectedWorkForAttachments(w); }}
        onViewReviews={() => {}}
      />

      <AttachmentsModal
        work={selectedWorkForAttachments}
        onClose={() => setSelectedWorkForAttachments(null)}
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

export default MPDashboard;
