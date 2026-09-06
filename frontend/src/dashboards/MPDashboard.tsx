import React, { useEffect, useState, useMemo } from "react";
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
  Image as ImageIcon 
} from "lucide-react";
import { Header } from "../components/Header";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WorkDetailModal } from "../components/WorkDetailModal";
import { AttachmentsModal } from "../components/AttachmentsModal";
import { PolicyModal } from "../components/PolicyModal";
import { Button, Alert, Card, CardHeader, CardBody } from "../components/ui";
import { CreateRecommendationModal } from "../components/mp/CreateRecommendationModal";

import { MPRecommendation, INITIAL_MP_RECOMMENDATIONS } from "../data/mpData";
import { INITIAL_WORKS, WorkItem } from "../data/mpladsData";
import { INITIAL_CITIZEN_ISSUES, CitizenIssue } from "../data/citizenData";
import { TRANSLATIONS } from "../data/translations";
import { useRole } from "../auth/roleContext";
import { apiClient, mapBackendProjectsToWorkItems } from "../api/client";

export const MPDashboard: React.FC = () => {
  const { user, token } = useRole();

  // Accessibility & Language Settings
  const [fontScale, setFontScale] = useState<"sm" | "base" | "lg">("base");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const t = TRANSLATIONS[lang];

  // Active Section Navigation
  const [activeTab, setActiveTab] = useState<"my_recommendations" | "constituency_works" | "citizen_reports" | "risk_alerts">("my_recommendations");

  // Data States
  const [recommendations, setRecommendations] = useState<MPRecommendation[]>(INITIAL_MP_RECOMMENDATIONS);
  const [works, setWorks] = useState<WorkItem[]>(INITIAL_WORKS);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal Controls
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [prefilledCitizenId, setPrefilledCitizenId] = useState<string>("");
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<WorkItem | null>(null);
  const [selectedWorkForAttachments, setSelectedWorkForAttachments] = useState<WorkItem | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  // Active MP info
  const mpName = user.name || "Murlidhar Mohol";
  const constituency = user.constituency || "Pune";
  const constituencyCode = user.constituency_code || "MH-PUNE-01";
  const district = user.district || "Pune";

  // Filtered Constituency Projects (Scoped to Pune MH-PUNE-01)
  const constituencyWorks = useMemo(() => {
    return works.filter((w) => w.constituency_code === constituencyCode || w.district === district);
  }, [works, constituencyCode, district]);

  useEffect(() => {
    async function loadProjects() {
      if (!token) return;
      try {
        const data = await apiClient.getProjects(token);
        setWorks(mapBackendProjectsToWorkItems(data));
      } catch {
        // keep offline fallback
      }
    }
    loadProjects();
  }, [token]);

  // High Risk Projects
  const highRiskWorks = useMemo(() => {
    return constituencyWorks.filter((w) => w.status === "Delayed" || w.financialProgress > w.physicalProgress + 20);
  }, [constituencyWorks]);

  // Citizen Reports in Pune
  const citizenGrievances = useMemo(() => {
    return INITIAL_CITIZEN_ISSUES;
  }, []);

  // Handlers
  const handleRecommendationSubmitted = (newRec: MPRecommendation) => {
    setRecommendations([newRec, ...recommendations]);
  };

  const handleAdoptCitizenIssue = (issueId: string) => {
    setPrefilledCitizenId(issueId);
    setIsRecommendModalOpen(true);
  };

  // Aggregated Constituency Financial Metrics
  const metrics = useMemo(() => {
    const totalEntitlement = 5.00; // ₹5.00 Cr
    const totalRecommendedAmt = recommendations.reduce((acc, r) => acc + r.estimatedCost, 0);
    const sanctionedRecs = recommendations.filter((r) => r.status === "SANCTIONED");
    const totalSanctionedAmt = sanctionedRecs.reduce((acc, r) => acc + (r.sanctionedCost || r.estimatedCost), 0);
    const recommendedCount = recommendations.length;
    const sanctionedCount = sanctionedRecs.length;
    const ongoingCount = constituencyWorks.filter((w) => w.status === "Ongoing").length;
    const completedCount = constituencyWorks.filter((w) => w.status === "Completed").length;
    const utilizationRate = Math.round((totalSanctionedAmt / totalEntitlement) * 100);

    return {
      totalEntitlement,
      totalRecommendedAmt,
      totalSanctionedAmt,
      recommendedCount,
      sanctionedCount,
      ongoingCount,
      completedCount,
      utilizationRate
    };
  }, [recommendations, constituencyWorks]);

  // Filtered recommendations list
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((r) => {
      if (selectedCategoryFilter !== "all" && r.category !== selectedCategoryFilter) return false;
      if (selectedStatusFilter !== "all" && r.status !== selectedStatusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(query);
        const matchLoc = r.location.toLowerCase().includes(query);
        const matchId = r.id.toLowerCase().includes(query);
        if (!matchTitle && !matchLoc && !matchId) return false;
      }
      return true;
    });
  }, [recommendations, selectedCategoryFilter, selectedStatusFilter, searchQuery]);

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
        activeTab="dashboard"
        setActiveTab={() => {}}
        onOpenPolicy={() => setIsPolicyOpen(true)}
        onOpenLogin={() => {}}
        t={t}
        flagCount={highRiskWorks.length}
      />

      <main className="container" style={{ flex: 1, padding: "20px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Constituency MP Branding & Entitlement Banner */}
        <div 
          style={{ 
            background: "var(--gov-header)", 
            color: "#ffffff", 
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
            <div style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#93c5fd", fontWeight: 700 }}>
              Hon'ble Member of Parliament Workspace | 18th Lok Sabha
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#ffffff", margin: "4px 0 6px 0" }}>
              {mpName} — {constituency} Parliamentary Constituency ({constituencyCode})
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#cbd5e1", maxWidth: "680px", lineHeight: "1.4" }}>
              Recommend constituency development works under MPLADS, monitor technical scrutiny by District Authorities, audit implementation velocity, and address public citizen grievances.
            </p>
          </div>

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
            <span>My MP Recommendations ({recommendations.length})</span>
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
            onClick={() => setActiveTab("citizen_reports")}
            className={`gov-tab ${activeTab === "citizen_reports" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <UserCheck size={15} />
            <span>Citizen Public Reports ({citizenGrievances.length})</span>
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
                Showing <strong>{filteredRecommendations.length}</strong> of <strong>{recommendations.length}</strong> recommendations
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
                  </tr>
                </thead>
                <tbody>
                  {filteredRecommendations.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                        No work recommendations found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRecommendations.map((rec) => (
                      <tr key={rec.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, color: "var(--gov-primary)" }}>
                          {rec.id}
                        </td>
                        <td style={{ padding: "10px 12px", maxWidth: "280px" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{rec.title}</div>
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
                    <tr key={work.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700 }}>
                        {work.id}
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                        {work.title}
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
                      <td style={{ padding: "10px 12px" }}>
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

        {/* TAB 3: CITIZEN REPORTS */}
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
                {citizenGrievances.map((issue) => (
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
                style={{ padding: "14px 16px", borderLeft: "4px solid var(--status-danger-text)" }}
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

      <Footer t={t} onOpenPolicy={() => setIsPolicyOpen(true)} />
    </div>
  );
};

export default MPDashboard;
