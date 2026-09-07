import React, { useState, useMemo } from "react";
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
  Building 
} from "lucide-react";
import { Header } from "../components/Header";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WorkDetailModal } from "../components/WorkDetailModal";
import { AttachmentsModal } from "../components/AttachmentsModal";
import { PolicyModal } from "../components/PolicyModal";
import { LoginModal } from "../components/LoginModal";
import { Button, Alert } from "../components/ui";

import { INITIAL_WORKS, WorkItem } from "../data/mpladsData";
import { usePreferences } from "../context/PreferencesContext";
import { useRole, Role } from "../auth/roleContext";

export const StateNodalDashboard: React.FC = () => {
  const { user } = useRole();
  const { fontScale, setFontScale, theme, setTheme, lang, setLang, t } = usePreferences();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"state_projects" | "district_performance" | "escalations" | "state_reports">("state_projects");

  // Comprehensive State Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedMp, setSelectedMp] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("all");
  const [selectedDeadlineRisk, setSelectedDeadlineRisk] = useState<string>("all");
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Projects State
  const [projects, setProjects] = useState<WorkItem[]>(INITIAL_WORKS);

  // Selected Modals
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<WorkItem | null>(null);
  const [selectedWorkForAttachments, setSelectedWorkForAttachments] = useState<WorkItem | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [targetLoginRole, setTargetLoginRole] = useState<Role | undefined>(undefined);

  // Toast Notification
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // State Nodal Info
  const stateDepartment = user.name || "State Nodal Department — Planning Dept";
  const stateName = user.state || "Maharashtra";

  // Filtered State Projects
  const filteredStateProjects = useMemo(() => {
    return projects.filter((w) => {
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
  }, [projects, selectedDistrict, selectedMp, selectedStatus, selectedRiskLevel, selectedDeadlineRisk, searchQuery]);

  // High Risk Projects across State
  const stateHighRiskProjects = useMemo(() => {
    return projects.filter((w) => w.status === "Delayed" || (w.financialProgress || 0) > (w.physicalProgress || 0) + 15);
  }, [projects]);

  // District Performance Metrics Aggregation
  const districtPerformance = useMemo(() => {
    const rawDistricts = Array.from(new Set(projects.map((p) => p.district))).filter(Boolean);
    const districts = rawDistricts.length > 0 ? rawDistricts : ["ANDAMAN AND NICOBAR ISLANDS", "ANANTAPUR", "SOUTH GOA", "UJJARPUR", "VELLORE"];
    return districts.map((dist, idx) => {
      const distWorks = projects.filter((p) => p.district === dist);
      const totalOutlay = distWorks.reduce((acc, p) => acc + (p.sanctionedAmt || 0), 0);
      const totalExp = distWorks.reduce((acc, p) => acc + (p.expenditureAmt || 0), 0);
      const utilRate = totalOutlay > 0 ? Math.round((totalExp / totalOutlay) * 100) : 72;
      const highRiskCount = distWorks.filter((p) => p.status === "Delayed" || (p.financialProgress || 0) > (p.physicalProgress || 0) + 15).length;

      return {
        rank: idx + 1,
        district: dist.replace(/\(.*\)/, '').trim(),
        totalWorks: distWorks.length,
        outlayAmt: totalOutlay,
        expenditureAmt: totalExp,
        utilizationRate: utilRate,
        highRiskCount,
        status: utilRate >= 70 ? "High Performing" : utilRate >= 50 ? "Moderate" : "Needs Review"
      };
    });
  }, [projects]);

  // Key KPI Numbers
  const kpis = useMemo(() => {
    const totalProjects = projects.length;
    const totalOutlay = projects.reduce((acc, p) => acc + (p.sanctionedAmt || 0), 0);
    const totalExp = projects.reduce((acc, p) => acc + (p.expenditureAmt || 0), 0);
    const avgUtilization = totalOutlay > 0 ? Math.round((totalExp / totalOutlay) * 100) : 0;
    const highRiskCount = projects.filter((p) => p.status === "Delayed" || (p.financialProgress || 0) > (p.physicalProgress || 0) + 15).length;
    const completedCount = projects.filter((p) => p.status === "Completed").length;

    return { totalProjects, totalOutlay, totalExp, avgUtilization, highRiskCount, completedCount };
  }, [projects]);

  // Handlers
  const handleEscalationAction = (workId: string, actionType: string) => {
    setActionNotice(`State Nodal Executive Order (${actionType}) issued for Work ID #${workId}. Transmitted to District Collectorate.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

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
        onOpenLogin={(role) => {
          setTargetLoginRole(role);
          setIsLoginOpen(true);
        }}
        t={t}
        flagCount={kpis.highRiskCount}
      />

      <main className="container" style={{ flex: 1, padding: "20px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* State Nodal Workspace Branding Banner */}
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
              Statewide MPLADS Monitoring — {stateName}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#cbd5e1", maxWidth: "680px", lineHeight: "1.4", margin: 0 }}>
              Cross-district implementation monitoring, statewide fund utilization tracking, and project milestone oversight.
            </p>
          </div>

          <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-xs)", fontSize: "0.80rem", border: "1px solid rgba(255, 255, 255, 0.15)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399", display: "inline-block" }}></span>
            <span>State Nodal Authority · {stateName}</span>
          </div>
        </div>

        {actionNotice && (
          <Alert type="success" title="State Nodal Order Executed">
            {actionNotice}
          </Alert>
        )}

        {/* KPI Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          
          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Total Statewide Works
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
              {kpis.totalProjects} Projects
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Outlay: <strong>₹{kpis.totalOutlay.toFixed(2)} Cr</strong>
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              State Expenditure Disbursed
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-info-text)", marginTop: "2px" }}>
              ₹{kpis.totalExp.toFixed(2)} Cr
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              State Average Utilization: <strong>{kpis.avgUtilization}%</strong>
            </div>
                    <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              District Collectorates
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
              36 Districts
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Reporting Compliance: 100%
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              State High-Risk Anomalies
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: kpis.highRiskCount > 0 ? "var(--status-danger-text)" : "var(--status-success-text)", marginTop: "2px" }}>
              {kpis.highRiskCount} Alerts
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              State Escalation Required
            </div>
          </div>  </div>

        </div>

        {/* Section Navigation Tabs */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--border-light)", paddingBottom: "2px", flexWrap: "wrap" }}>
          
          <button
            onClick={() => setActiveTab("state_projects")}
            className={`gov-tab ${activeTab === "state_projects" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Landmark size={15} />
            <span>Statewide Project Monitoring ({filteredStateProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("district_performance")}
            className={`gov-tab ${activeTab === "district_performance" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <BarChart2 size={15} />
            <span>District Performance Matrix ({districtPerformance.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("escalations")}
            className={`gov-tab ${activeTab === "escalations" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ShieldAlert size={15} />
            <span>State High-Risk Escalations ({stateHighRiskProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("state_reports")}
            className={`gov-tab ${activeTab === "state_reports" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <FileText size={15} />
            <span>Statewide Analytics & Reports</span>
          </button>

        </div>

        {/* TAB 1: STATEWIDE PROJECT MONITORING */}
        {activeTab === "state_projects" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* Mandatory AI Risk Semantics Banner */}
            <Alert type="info" title="Statewide Risk Semantics Notice">
              <strong>STATUTORY PRINCIPLE:</strong> Risk levels indicate <strong>verification priority</strong> for district field inspection, NOT proof of fraud.
            </Alert>

            {/* Comprehensive State Filter Bar */}
            <div className="gov-card" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
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

            {/* Table */}
            <div className="gov-card" style={{ overflowX: "auto" }}>
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
          </div>
        )}

        {/* TAB 2: DISTRICT PERFORMANCE MATRIX */}
        {activeTab === "district_performance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="gov-card" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                Cross-District Performance & Utilization Matrix
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                Comparative monitoring across Maharashtra district collectorates based on fund utilization efficiency, field verification coverage, and delay mitigation.
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
                    </tr>
                  </thead>
                  <tbody>
                    {districtPerformance.map((d) => (
                      <tr key={d.district} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 800, color: "var(--gov-primary)" }}>#{d.rank}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700 }}>{d.district} District</td>
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
              <div key={work.id} className="gov-card" style={{ padding: "16px", borderLeft: "4px solid var(--status-danger-text)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="gov-badge gov-badge-danger">STATE ESCALATION (P1)</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem" }}>{work.id}</span>
                      <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>District: {work.district}</span>
                    </div>

                    <h4 style={{ fontSize: "1rem", fontWeight: 800, margin: "6px 0 2px 0", color: "var(--gov-primary)" }}>{work.title}</h4>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Contractor Agency: <strong>{work.agency}</strong> | MP: <strong>{work.mpName}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
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
            <div className="gov-card" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                Statewide Sector Outlays & MoSPI Statutory Returns
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                State-level consolidated returns transmitted to the Ministry of Statistics and Programme Implementation (MoSPI), New Delhi.
              </p>

              <div style={{ padding: "12px 14px", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", fontSize: "0.78rem" }}>
                <div style={{ fontWeight: 700, color: "var(--gov-primary)" }}>State Returns Summary:</div>
                <ul style={{ margin: "4px 0 0 16px", color: "var(--text-body)" }}>
                  <li>Statewide Total Outlay Allocated: ₹{kpis.totalOutlay.toFixed(2)} Cr</li>
                  <li>Statewide Total Expenditure Incurred: ₹{kpis.totalExp.toFixed(2)} Cr ({kpis.avgUtilization}%)</li>
                  <li>Total Districts Compliant with Monthly Return Filing: 36 / 36</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </main>

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

export default StateNodalDashboard;
