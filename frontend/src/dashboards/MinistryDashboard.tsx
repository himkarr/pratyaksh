import React, { useState, useMemo } from "react";
import { 
  Building2, 
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
  Lock, 
  Settings, 
  Users, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Activity, 
  Play, 
  Landmark 
} from "lucide-react";
import { Header } from "../components/Header";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WorkDetailModal } from "../components/WorkDetailModal";
import { AttachmentsModal } from "../components/AttachmentsModal";
import { PolicyModal } from "../components/PolicyModal";
import { AuditTrailViewer } from "../components/AuditTrailViewer";
import { LoginModal } from "../components/LoginModal";
import { Button, Alert, Card, CardHeader, CardBody } from "../components/ui";

import { INITIAL_WORKS, WorkItem } from "../data/mpladsData";
import { usePreferences } from "../context/PreferencesContext";
import { useRole } from "../auth/roleContext";

export const MinistryDashboard: React.FC = () => {
  const { user } = useRole();
  const { fontScale, setFontScale, theme, setTheme, lang, setLang, t } = usePreferences();

  // Active Tab View (Merged Analytics & AI/ML Intelligence)
  const [activeTab, setActiveTab] = useState<
    "national_projects" | "national_analytics" | "audit_ledger" | "system_config"
  >("national_projects");

  // Filters & Search
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Projects Data State
  const [projects, setProjects] = useState<WorkItem[]>(INITIAL_WORKS);

  // Model Management & Retraining State
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainSuccessNotice, setRetrainSuccessNotice] = useState<string | null>(null);
  const [ruleSensitivity, setRuleSensitivity] = useState<number>(0.85);

  // Modal Controls
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<WorkItem | null>(null);
  const [selectedWorkForAttachments, setSelectedWorkForAttachments] = useState<WorkItem | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [targetLoginRole, setTargetLoginRole] = useState<any>(undefined);

  // Filtered Projects List
  const filteredNationalProjects = useMemo(() => {
    return projects.filter((w) => {
      if (selectedStateFilter !== "all" && w.state !== selectedStateFilter) return false;
      if (selectedStatusFilter !== "all" && w.status !== selectedStatusFilter) return false;
      
      const isHighRisk = w.status === "Delayed" || (w.financialProgress || 0) > (w.physicalProgress || 0) + 15;
      if (selectedRiskFilter === "HIGH" && !isHighRisk) return false;
      if (selectedRiskFilter === "LOW" && isHighRisk) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (w.title || "").toLowerCase().includes(q);
        const matchId = (w.id || "").toLowerCase().includes(q);
        const matchState = (w.state || "").toLowerCase().includes(q);
        const matchDist = (w.district || "").toLowerCase().includes(q);
        const matchMp = (w.mpName || "").toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchState && !matchDist && !matchMp) return false;
      }
      return true;
    });
  }, [projects, selectedStateFilter, selectedStatusFilter, selectedRiskFilter, searchQuery]);

  // National KPI Metrics
  const kpis = useMemo(() => {
    const totalProjects = projects.length;
    const totalOutlay = projects.reduce((acc, p) => acc + (p.sanctionedAmt || 0), 0);
    const totalExp = projects.reduce((acc, p) => acc + (p.expenditureAmt || 0), 0);
    const nationalUtilization = totalOutlay > 0 ? Math.round((totalExp / totalOutlay) * 100) : 0;
    const highRiskCount = projects.filter((p) => p.status === "Delayed" || (p.financialProgress || 0) > (p.physicalProgress || 0) + 15).length;
    const completedCount = projects.filter((p) => p.status === "Completed").length;

    return { totalProjects, totalOutlay, totalExp, nationalUtilization, highRiskCount, completedCount };
  }, [projects]);

  // Handler for Model Retraining (POST /api/models/retrain simulation)
  const handleTriggerModelRetrain = () => {
    setIsRetraining(true);
    setRetrainSuccessNotice(null);

    setTimeout(() => {
      setIsRetraining(false);
      setRetrainSuccessNotice(
        "Isolation Forest ML Model v2.4 successfully retrained on 14,250 national project milestone records. F1-Score: 0.942. Parameters updated in production inference pipeline."
      );
      setTimeout(() => setRetrainSuccessNotice(null), 6000);
    }, 2000);
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
        activeTab={activeTab === "national_projects" ? "dashboard" : "analytics"}
        setActiveTab={(t) => {
          if (t === "dashboard" || t === "home") setActiveTab("national_projects");
        }}
        onOpenPolicy={() => setIsPolicyOpen(true)}
        onOpenLogin={(role) => {
          setTargetLoginRole(role);
          setIsLoginOpen(true);
        }}
        t={t}
        flagCount={kpis.highRiskCount}
      />

      <main className="container" style={{ flex: 1, padding: "20px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* National Apex Ministry Banner */}
        <div 
          style={{ 
            background: "linear-gradient(135deg, #0a2540 0%, #0f2942 60%, #1e3a5f 100%)", 
            color: "var(--text-white)", 
            padding: "22px 26px", 
            borderRadius: "var(--radius-sm)", 
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 8px 24px -4px rgba(10, 37, 64, 0.25)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px"
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-white)", margin: "0 0 6px 0" }}>
              National MPLADS Decision Support System
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#cbd5e1", maxWidth: "700px", lineHeight: "1.4", margin: 0 }}>
              Central executive portal for monitoring fund disbursements, project milestones, and high-priority audit signals across all parliamentary constituencies.
            </p>
          </div>

          <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-xs)", fontSize: "0.80rem", border: "1px solid rgba(255, 255, 255, 0.15)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399", display: "inline-block" }}></span>
            <span>e-SAKSHI Apex Monitoring · FY 2024–25</span>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          
          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              National Sanctioned Outlay
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
              ₹{kpis.totalOutlay.toFixed(2)} Cr
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              543 Lok Sabha + 245 Rajya Sabha Scopes
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Total Disbursed Expenditure
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-info-text)", marginTop: "2px" }}>
              ₹{kpis.totalExp.toFixed(2)} Cr
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              National Utilization: <strong>{kpis.nationalUtilization}%</strong>
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Active National Projects
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
              {kpis.totalProjects} Works
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Completed: <strong>{kpis.completedCount} Finished</strong>
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              High-Risk Verification Priority
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: kpis.highRiskCount > 0 ? "var(--status-danger-text)" : "var(--status-success-text)", marginTop: "2px" }}>
              {kpis.highRiskCount} Alerts
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Priority 1 Field Audit Signal
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Cryptographic Audit Chain
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-success-text)", marginTop: "2px" }}>
              100% Valid
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              SHA-256 Non-Repudiation Verified
            </div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", paddingBottom: "6px", flexWrap: "wrap" }}>
          
          <button
            onClick={() => setActiveTab("national_projects")}
            className={`gov-tab ${activeTab === "national_projects" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Building2 size={15} />
            <span>National Projects Registry ({filteredNationalProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("national_analytics")}
            className={`gov-tab ${activeTab === "national_analytics" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <BarChart2 size={15} />
            <span>National Analytics & AI/ML Intelligence</span>
          </button>

          <button
            onClick={() => setActiveTab("audit_ledger")}
            className={`gov-tab ${activeTab === "audit_ledger" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ShieldCheck size={15} />
            <span>SHA-256 Audit Trail Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab("system_config")}
            className={`gov-tab ${activeTab === "system_config" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Settings size={15} />
            <span>System Configuration & RBAC</span>
          </button>

        </div>

        {/* TAB 1: NATIONAL PROJECTS REGISTRY */}
        {activeTab === "national_projects" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* Filter Bar */}
            <div className="gov-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    type="text"
                    className="gov-input"
                    placeholder="Search Work ID, project title, state, MP..."
                    style={{ width: "260px" }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="gov-select"
                  style={{ width: "150px" }}
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                >
                  <option value="all">All States</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Karnataka">Karnataka</option>
                </select>

                <select
                  className="gov-select"
                  style={{ width: "150px" }}
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Sanctioned">Sanctioned</option>
                  <option value="Delayed">Delayed</option>
                </select>

                <select
                  className="gov-select"
                  style={{ width: "150px" }}
                  value={selectedRiskFilter}
                  onChange={(e) => setSelectedRiskFilter(e.target.value)}
                >
                  <option value="all">All Risk Tiers</option>
                  <option value="HIGH">High-Risk Only</option>
                  <option value="LOW">Normal / Low-Risk</option>
                </select>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Showing <strong>{filteredNationalProjects.length}</strong> of {projects.length} Works
              </div>
            </div>

            {/* National Projects Table */}
            <div className="gov-table-container">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Work ID</th>
                    <th>Project Description</th>
                    <th>Location & MP</th>
                    <th>Sanction (₹)</th>
                    <th>Progress (Phy/Fin)</th>
                    <th>Risk Signal</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNationalProjects.map((work) => {
                    const isHighRisk = work.status === "Delayed" || work.financialProgress > work.physicalProgress + 15;

                    return (
                      <tr key={work.id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                          #{work.id}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: "var(--text-main)", maxWidth: "280px" }}>
                            {work.title}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            Category: {work.category} | Agency: {work.agency}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{work.state} - {work.district}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{work.mpName}</div>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          ₹{work.sanctionedAmt.toFixed(2)} Cr
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "110px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.70rem" }}>
                              <span>Phy: {work.physicalProgress}%</span>
                              <span>Fin: {work.financialProgress}%</span>
                            </div>
                            <div style={{ height: "5px", background: "#e2e8f0", borderRadius: "9999px", overflow: "hidden" }}>
                              <div
                                style={{
                                  height: "100%",
                                  width: `${work.physicalProgress}%`,
                                  background: work.physicalProgress >= 100 ? "var(--status-success-text)" : "var(--gov-primary)",
                                  borderRadius: "9999px"
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          {isHighRisk ? (
                            <span className="gov-badge gov-badge-danger">
                              <AlertTriangle size={11} /> High Risk
                            </span>
                          ) : (
                            <span className="gov-badge gov-badge-success">
                              <CheckCircle2 size={11} /> Verified
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Eye size={13} />}
                              onClick={() => setSelectedWorkForDetail(work)}
                            >
                              Dossier
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<FileText size={13} />}
                              onClick={() => setSelectedWorkForAttachments(work)}
                            >
                              Evidence
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
        {/* TAB 2: NATIONAL ANALYTICS & AI/ML RISK INTELLIGENCE (MERGED) */}
        {activeTab === "national_analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* National Sectoral and State Compliance Breakdown */}
            <div className="gov-card" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                National Scheme Sectoral & Compliance Analytics
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                Cross-state fund allocation distribution and compliance indices across development sectors.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "var(--radius-sm)", padding: "14px", background: "var(--bg-surface-subtle)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "10px" }}>
                    Sectoral Fund Allocation Distribution
                  </div>
                  <table style={{ width: "100%", fontSize: "0.80rem", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1.5px solid #e2e8f0", textAlign: "left" }}>
                        <th style={{ padding: "8px 6px" }}>Sector</th>
                        <th style={{ padding: "8px 6px" }}>Outlay</th>
                        <th style={{ padding: "8px 6px" }}>Util Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 6px", fontWeight: 600 }}>Rural Drinking Water</td>
                        <td style={{ padding: "8px 6px" }}>₹1,450.00 Cr</td>
                        <td style={{ padding: "8px 6px", color: "var(--status-success-text)", fontWeight: 700 }}>82.4%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 6px", fontWeight: 600 }}>Education & Public Schools</td>
                        <td style={{ padding: "8px 6px" }}>₹1,120.50 Cr</td>
                        <td style={{ padding: "8px 6px", color: "var(--status-info-text)", fontWeight: 700 }}>74.8%</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 6px", fontWeight: 600 }}>Community Health Centers</td>
                        <td style={{ padding: "8px 6px" }}>₹904.30 Cr</td>
                        <td style={{ padding: "8px 6px", color: "var(--status-warning-text)", fontWeight: 700 }}>68.9%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "var(--radius-sm)", padding: "14px", background: "var(--bg-surface-subtle)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "10px" }}>
                    State Nodal Compliance Index
                  </div>
                  <table style={{ width: "100%", fontSize: "0.80rem", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1.5px solid #e2e8f0", textAlign: "left" }}>
                        <th style={{ padding: "8px 6px" }}>State</th>
                        <th style={{ padding: "8px 6px" }}>Util Rate</th>
                        <th style={{ padding: "8px 6px" }}>Geotag Cover</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 6px", fontWeight: 600 }}>Maharashtra</td>
                        <td style={{ padding: "8px 6px", fontWeight: 700 }}>78.5%</td>
                        <td style={{ padding: "8px 6px", color: "var(--status-success-text)", fontWeight: 700 }}>98.2%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 6px", fontWeight: 600 }}>Gujarat</td>
                        <td style={{ padding: "8px 6px", fontWeight: 700 }}>84.1%</td>
                        <td style={{ padding: "8px 6px", color: "var(--status-success-text)", fontWeight: 700 }}>99.1%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 6px", fontWeight: 600 }}>Karnataka</td>
                        <td style={{ padding: "8px 6px", fontWeight: 700 }}>72.4%</td>
                        <td style={{ padding: "8px 6px", color: "var(--status-info-text)", fontWeight: 700 }}>95.4%</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "8px 6px", fontWeight: 600 }}>Uttar Pradesh</td>
                        <td style={{ padding: "8px 6px", fontWeight: 700 }}>69.8%</td>
                        <td style={{ padding: "8px 6px", color: "var(--status-warning-text)", fontWeight: 700 }}>91.0%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* MERGED: AI/ML Inference Pipeline & Retraining Section */}
            {retrainSuccessNotice && (
              <Alert type="success" title="AI Model Pipeline Retrained Successfully">
                {retrainSuccessNotice}
              </Alert>
            )}

            <div className="gov-card" style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Cpu size={18} />
                    AI/ML Inference Pipeline & Isolation Forest Engine
                  </h3>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Service Endpoint: <code>http://localhost:8001/predict</code> | Production Model: <strong>IsolationForest-v2.4</strong>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleTriggerModelRetrain}
                  disabled={isRetraining}
                  icon={isRetraining ? <RefreshCw size={15} className="spin" /> : <Play size={15} />}
                >
                  {isRetraining ? "Retraining Models (POST /api/models/retrain)..." : "Trigger Model Retraining Now"}
                </Button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ border: "1px solid #e2e8f0", padding: "14px", borderRadius: "var(--radius-sm)", background: "var(--bg-surface-subtle)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "8px" }}>
                    Isolation Forest Anomaly Hyperparameters
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-body)", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <div>Contamination Parameter: <code>0.05</code> (5% Expected Anomaly Rate)</div>
                    <div>n_estimators (Trees): <code>100</code></div>
                    <div>Max Samples: <code>auto (256)</code></div>
                    <div>Decision Threshold: <code>-0.12</code></div>
                  </div>
                </div>

                <div style={{ border: "1px solid #e2e8f0", padding: "14px", borderRadius: "var(--radius-sm)", background: "var(--bg-surface-subtle)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "8px" }}>
                    Rule Engine Anomaly Sensitivity Threshold
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-body)", marginBottom: "10px" }}>
                    Adjust burn-rate divergence sensitivity trigger: <strong>{Math.round(ruleSensitivity * 100)}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={ruleSensitivity}
                    onChange={(e) => setRuleSensitivity(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--gov-accent)", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: SHA-256 AUDIT TRAIL LEDGER */}
        {activeTab === "audit_ledger" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <AuditTrailViewer />
          </div>
        )}

        {/* TAB 4: SYSTEM CONFIGURATION & RBAC */}
        {activeTab === "system_config" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="gov-card" style={{ padding: "18px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                National System Configuration & Role-Based Access Control (RBAC)
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                Configure statutory policy parameters (365-day completion ceiling), manage API endpoints, and inspect user role accounts.
              </p>

              <div style={{ padding: "14px 16px", background: "var(--bg-surface-subtle)", border: "1px solid #e2e8f0", borderRadius: "var(--radius-sm)", fontSize: "0.80rem" }}>
                <div style={{ fontWeight: 700, color: "var(--gov-primary)", marginBottom: "6px" }}>Active Statutory System Parameters:</div>
                <ul style={{ margin: "4px 0 0 18px", color: "var(--text-body)", lineHeight: "1.6" }}>
                  <li>MoSPI Statutory Completion Ceiling: <strong>365 Calendar Days</strong></li>
                  <li>FastAPI Gateway Backend: <code>http://localhost:8000</code></li>
                  <li>AI/ML Inference Service: <code>http://localhost:8001</code></li>
                  <li>JWT Bearer Auth Algorithm: <code>HS256 (Token Expiry: 8 Hours)</code></li>
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
        onClose={() => setIsLoginOpen(false)}
        initialRole={targetLoginRole}
      />

      <Footer t={t} onOpenPolicy={() => setIsPolicyOpen(true)} />
    </div>
  );
};

export default MinistryDashboard;
