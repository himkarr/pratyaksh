import React, { useState, useMemo } from "react";
import { 
  Building, 
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
  UserCheck, 
  ShieldCheck, 
  HelpCircle, 
  FileCheck, 
  XCircle, 
  Send, 
  AlertCircle, 
  DollarSign, 
  Activity 
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
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Local Projects State
  const [projects, setProjects] = useState<WorkItem[]>(INITIAL_WORKS);

  // Selected Anomaly Work for Deep-Dive Modal
  const [selectedWorkForDossier, setSelectedWorkForDossier] = useState<WorkItem | null>(null);
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<WorkItem | null>(null);
  const [selectedWorkForAttachments, setSelectedWorkForAttachments] = useState<WorkItem | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [targetLoginRole, setTargetLoginRole] = useState<Role | undefined>(undefined);

  // Action Toast State
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // District Authority Info
  const collectorName = user.name || "District Magistrate & Collector (South Andaman)";
  const districtName = user.district || "ANDAMAN AND NICOBAR ISLANDS";
  const stateName = user.state || "Andaman And Nicobar Islands";

  // Filtered District Projects
  const districtProjects = useMemo(() => {
    return projects.filter((w) => {
      if (statusFilter !== "all" && w.status !== statusFilter) return false;
      if (riskFilter === "high" && !(w.status === "Delayed" || (w.financialProgress || 0) > (w.physicalProgress || 0) + 15)) return false;
      if (categoryFilter !== "all" && w.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (w.title || "").toLowerCase().includes(q);
        const matchId = (w.id || "").toLowerCase().includes(q);
        const matchMp = (w.mpName || "").toLowerCase().includes(q);
        const matchAgency = (w.agency || "").toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchMp && !matchAgency) return false;
      }
      return true;
    });
  }, [projects, statusFilter, riskFilter, categoryFilter, searchQuery]);

  // High Risk Flagged Projects in District
  const highRiskProjects = useMemo(() => {
    return projects.filter((w) => w.status === "Delayed" || (w.financialProgress || 0) > (w.physicalProgress || 0) + 15);
  }, [projects]);

  // KPI Metrics
  const kpis = useMemo(() => {
    const totalProjects = projects.length;
    const totalSanctionedAmt = projects.reduce((acc, p) => acc + (p.sanctionedAmt || 0), 0);
    const totalExpAmt = projects.reduce((acc, p) => acc + (p.expenditureAmt || 0), 0);
    const ongoingCount = projects.filter((p) => p.status === "Ongoing").length;
    const completedCount = projects.filter((p) => p.status === "Completed").length;
    const delayedCount = projects.filter((p) => p.status === "Delayed").length;
    const utilizationRate = totalSanctionedAmt > 0 ? Math.round((totalExpAmt / totalSanctionedAmt) * 100) : 0;

    return { totalProjects, totalSanctionedAmt, totalExpAmt, ongoingCount, completedCount, delayedCount, utilizationRate };
  }, [projects]);

  // Action Handlers
  const handleApproveSanction = (workId: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === workId ? { ...p, status: "Ongoing" } : p))
    );
    setActionNotice(`Sanction & Funds Release Approved for Work ID #${workId}. Transmitted to Implementing Agency.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleFlagWork = (workId: string, reason: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === workId ? { ...p, status: "Delayed" } : p))
    );
    setActionNotice(`Work ID #${workId} Flagged by District Authority: ${reason}. Escalated to State Nodal Department.`);
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

      <main className="container" style={{ flex: 1, padding: "20px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* District Collectorate Branding Banner */}
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
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#ffffff", margin: "0 0 6px 0" }}>
              {districtName} District Authority Workspace
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#cbd5e1", maxWidth: "680px", lineHeight: "1.4", margin: 0 }}>
              Review MP work recommendations, grant administrative sanctions, and verify project milestone execution.
            </p>
          </div>

          <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-xs)", fontSize: "0.80rem", border: "1px solid rgba(255, 255, 255, 0.15)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399", display: "inline-block" }}></span>
            <span>District Authority · {districtName}</span>
          </div>
        </div>

        {actionNotice && (
          <Alert type="success" title="District Authority Action Recorded">
            {actionNotice}
          </Alert>
        )}

        {/* KPI Summary Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          
          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              District MPLADS Projects
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
              {kpis.totalProjects} Works
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Sanctioned: <strong>₹{kpis.totalSanctionedAmt.toFixed(2)} Cr</strong>
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Fund Expenditure & Release
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-info-text)", marginTop: "2px" }}>
              ₹{kpis.totalExpAmt.toFixed(2)} Cr
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Expenditure Rate: <strong>{kpis.utilizationRate}%</strong>
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Active Ongoing Works
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
              {kpis.ongoingCount} Ongoing
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Completed: <strong>{kpis.completedCount} Projects</strong>
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              High-Risk / Flagged Works
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: highRiskProjects.length > 0 ? "var(--status-danger-text)" : "var(--status-success-text)", marginTop: "2px" }}>
              {highRiskProjects.length} Flagged
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Priority 1 Audit Inspection
            </div>
          </div>

        </div>

        {/* Section Tabs */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--border-light)", paddingBottom: "2px", flexWrap: "wrap" }}>
          
          <button
            onClick={() => setActiveTab("district_projects")}
            className={`gov-tab ${activeTab === "district_projects" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Building size={15} />
            <span>District Projects & Sanctioning ({districtProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("verifications_review")}
            className={`gov-tab ${activeTab === "verifications_review" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <FileCheck size={15} />
            <span>Field Officer Verifications Review</span>
          </button>

          <button
            onClick={() => setActiveTab("anomaly_dossiers")}
            className={`gov-tab ${activeTab === "anomaly_dossiers" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ShieldAlert size={15} />
            <span>AI Anomaly & Risk Dossiers ({highRiskProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("district_reports")}
            className={`gov-tab ${activeTab === "district_reports" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <FileText size={15} />
            <span>District Reports & State Escalations</span>
          </button>

        </div>

        {/* TAB 1: DISTRICT PROJECTS & SANCTIONING */}
        {activeTab === "district_projects" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* Filter Bar */}
            <div className="gov-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    type="text"
                    className="gov-input"
                    placeholder="Search by title, work ID, MP, agency..."
                    style={{ width: "240px" }}
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
                  <option value="all">All Statuses</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Sanctioned">Sanctioned</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>

                <select
                  className="gov-select"
                  style={{ width: "160px" }}
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                >
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk / Flagged</option>
                </select>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Showing <strong>{districtProjects.length}</strong> of <strong>{projects.length}</strong> district works
              </div>
            </div>

            {/* Table */}
            <div className="gov-card" style={{ overflowX: "auto" }}>
              <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Work ID</th>
                    <th style={{ padding: "10px 12px" }}>Project Name & Category</th>
                    <th style={{ padding: "10px 12px" }}>Recommending MP</th>
                    <th style={{ padding: "10px 12px" }}>Sanction Cost</th>
                    <th style={{ padding: "10px 12px" }}>Expenditure</th>
                    <th style={{ padding: "10px 12px" }}>Physical Progress</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                    <th style={{ padding: "10px 12px" }}>District Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {districtProjects.map((work) => (
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
                      <td style={{ padding: "10px 12px", fontSize: "0.78rem" }}>{work.mpName}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--gov-primary)" }}>
                        ₹{work.sanctionedAmt.toFixed(2)} Cr
                      </td>
                      <td style={{ padding: "10px 12px" }}>₹{work.expenditureAmt.toFixed(2)} Cr</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "60px", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${work.physicalProgress}%`, height: "100%", background: "#10b981" }} />
                          </div>
                          <span style={{ fontWeight: 700 }}>{work.physicalProgress}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span className={`gov-badge ${work.status === "Completed" ? "gov-badge-success" : work.status === "Delayed" ? "gov-badge-danger" : "gov-badge-info"}`}>
                          {work.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <Button variant="secondary" size="sm" onClick={() => setSelectedWorkForDetail(work)} icon={<Eye size={12} />}>
                            Inspect
                          </Button>
                          {work.status === "Sanctioned" && (
                            <Button variant="primary" size="sm" onClick={() => handleApproveSanction(work.id)} icon={<CheckCircle2 size={12} />}>
                              Approve Fund Release
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => setSelectedWorkForDossier(work)} icon={<ShieldAlert size={12} />}>
                            Risk Dossier
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

        {/* TAB 2: FIELD OFFICER VERIFICATIONS REVIEW */}
        {activeTab === "verifications_review" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Alert type="info" title="District Collectorate Inspection Review Portal">
              Inspect submitted field reports from Senior Field Officers, verify geotagged photos, and issue administrative sanction approvals or show-cause notices.
            </Alert>

            <div className="gov-card" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "12px" }}>
                Recent Field Inspection Submissions for Collectorate Review
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {projects.slice(0, 3).map((work) => (
                  <div key={work.id} style={{ padding: "14px 16px", border: "1px solid var(--border-main)", borderRadius: "var(--radius-xs)", background: "var(--bg-surface)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem", color: "var(--gov-primary)" }}>{work.id}</span>
                          <span className="gov-badge gov-badge-info">FIELD REPORT SUBMITTED</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Verified Physical Progress: {work.physicalProgress}%</span>
                        </div>

                        <h4 style={{ fontSize: "0.92rem", fontWeight: 700, margin: "4px 0 2px 0" }}>{work.title}</h4>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                          Field Officer: <strong>Suresh Patil (Pune Division)</strong> | Location: <strong>{work.district}, {work.state}</strong>
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-body)", margin: "6px 0 0 0", lineHeight: "1.4" }}>
                          "On-site inspection completed. Foundation laying verified with geotagged photographic proof. Material quality complies with PWD standards."
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <Button variant="primary" size="sm" onClick={() => handleApproveSanction(work.id)} icon={<CheckCircle2 size={13} />}>
                          Approve Milestone Tranche
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleFlagWork(work.id, "Collectorate review flagged discrepancy in outlay")} icon={<AlertTriangle size={13} />}>
                          Flag & Request Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI ANOMALY & RISK DOSSIERS */}
        {activeTab === "anomaly_dossiers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Alert type="warning" title="District Anomaly & Risk Dossier Notice">
              <strong>STATUTORY PRINCIPLE:</strong> AI risk scoring means <strong>verification priority</strong>, NOT proof of fraud or non-compliance.
            </Alert>

            {highRiskProjects.map((work) => (
              <div key={work.id} className="gov-card" style={{ padding: "16px", borderLeft: "4px solid var(--status-danger-text)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="gov-badge gov-badge-danger">HIGH RISK (PRIORITY 1)</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.82rem" }}>{work.id}</span>
                      <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Agency: {work.agency}</span>
                    </div>

                    <h4 style={{ fontSize: "1rem", fontWeight: 800, margin: "6px 0 2px 0", color: "var(--gov-primary)" }}>{work.title}</h4>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Financial Progress: <strong>{work.financialProgress}%</strong> vs Physical Progress: <strong>{work.physicalProgress}%</strong> (Discrepancy: +{work.financialProgress - work.physicalProgress}%)
                    </div>
                  </div>

                  <Button variant="primary" size="sm" onClick={() => setSelectedWorkForDossier(work)} icon={<Eye size={14} />}>
                    Open 6-Point Audit Dossier
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: DISTRICT REPORTS & STATE ESCALATIONS */}
        {activeTab === "district_reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="gov-card" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                District Statutory Compliance & State Escalation Log
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                Transmitted reports and formal escalations from {districtName} District Collectorate to the State Nodal Department.
              </p>

              <div style={{ padding: "12px 14px", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", fontSize: "0.78rem" }}>
                <div style={{ fontWeight: 700, color: "var(--gov-primary)" }}>Statutory Compliance Summary:</div>
                <ul style={{ margin: "4px 0 0 16px", color: "var(--text-body)" }}>
                  <li>Annual District Entitlement Utilization: {kpis.utilizationRate}%</li>
                  <li>100% Geotagged Milestone Verification Enforced</li>
                  <li>Escalated Cases Pending State Nodal Review: {highRiskProjects.length}</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 6-POINT ANOMALY DOSSIER MODAL */}
      {selectedWorkForDossier && (
        <Modal
          isOpen={!!selectedWorkForDossier}
          onClose={() => setSelectedWorkForDossier(null)}
          title={`District Collectorate 6-Point Audit Dossier — ${selectedWorkForDossier.id}`}
          maxWidth="780px"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Alert type="info" title="Explainable AI & Risk Semantics">
              Risk level means verification priority, NOT proof of fraud or non-compliance.
            </Alert>

            {/* 6 Mandatory Audit Questions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              
              <div style={{ padding: "10px 12px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", background: "var(--bg-surface-subtle)" }}>
                <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--gov-primary)" }}>1. WHY WAS IT FLAGGED?</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-body)", marginTop: "2px" }}>
                  Financial disbursement trajectory ({selectedWorkForDossier.financialProgress}%) substantially exceeds physical completion ({selectedWorkForDossier.physicalProgress}%).
                </div>
              </div>

              <div style={{ padding: "10px 12px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", background: "var(--bg-surface-subtle)" }}>
                <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--gov-primary)" }}>2. WHAT DOES THE AI INDICATE?</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-body)", marginTop: "2px" }}>
                  ML Isolation Forest Decision Score: <strong>0.784</strong> (88th Anomaly Percentile). Predicted completion delay: <strong>+45 Days</strong>.
                </div>
              </div>

              <div style={{ padding: "10px 12px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", background: "var(--bg-surface-subtle)" }}>
                <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--gov-primary)" }}>3. WHAT RULES WERE TRIGGERED?</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-body)", marginTop: "2px" }}>
                  • Rule #4: Expenditure burn-rate divergence exceeding 15% threshold.<br />
                  • Rule #7: Milestone completion timeline violation.
                </div>
              </div>

              <div style={{ padding: "10px 12px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", background: "var(--bg-surface-subtle)" }}>
                <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--gov-primary)" }}>4. WHAT EVIDENCE EXISTS?</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-body)", marginTop: "2px" }}>
                  2 Geotagged Contractor Progress Photos (12 May 2024), 1 Resident Citizen Petition, 1 Measurement Book extract.
                </div>
              </div>

              <div style={{ padding: "10px 12px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", background: "var(--bg-surface-subtle)" }}>
                <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--gov-primary)" }}>5. WHAT DID THE FIELD OFFICER REPORT?</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-body)", marginTop: "2px" }}>
                  Senior Field Officer Suresh Patil verified physical execution on site. Recommended physical verification approval with tranche hold.
                </div>
              </div>

              <div style={{ padding: "10px 12px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", background: "var(--bg-surface-subtle)" }}>
                <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--gov-primary)" }}>6. WHAT ACTION IS REQUIRED BY DM?</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-body)", marginTop: "2px" }}>
                  Select Collectorate Executive Order:
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <Button variant="primary" size="sm" onClick={() => { handleApproveSanction(selectedWorkForDossier.id); setSelectedWorkForDossier(null); }}>
                    Approve Sanction Tranche
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { handleFlagWork(selectedWorkForDossier.id, "Freeze Tranche Release"); setSelectedWorkForDossier(null); }}>
                    Freeze Tranche & Issue Notice
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </Modal>
      )}

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

export default DistrictDashboard;
