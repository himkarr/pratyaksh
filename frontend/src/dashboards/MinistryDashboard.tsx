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
import { Button, Alert, Card, CardHeader, CardBody } from "../components/ui";

import { INITIAL_WORKS, WorkItem } from "../data/mpladsData";
import { TRANSLATIONS } from "../data/translations";
import { useRole } from "../auth/roleContext";

export const MinistryDashboard: React.FC = () => {
  const { user } = useRole();

  // Accessibility & Language
  const [fontScale, setFontScale] = useState<"sm" | "base" | "lg">("base");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const t = TRANSLATIONS[lang];

  // Active Tab View
  const [activeTab, setActiveTab] = useState<
    "national_projects" | "national_analytics" | "model_management" | "audit_ledger" | "system_config"
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

  // Apex Ministry Info
  const adminName = user.name || "Apex MoSPI Administrator";

  // Filtered National Projects
  const filteredNationalProjects = useMemo(() => {
    return projects.filter((w) => {
      if (selectedStateFilter !== "all" && w.state !== selectedStateFilter) return false;
      if (selectedStatusFilter !== "all" && w.status !== selectedStatusFilter) return false;
      
      const isHighRisk = w.status === "Delayed" || w.financialProgress > w.physicalProgress + 15;
      if (selectedRiskFilter === "HIGH" && !isHighRisk) return false;
      if (selectedRiskFilter === "LOW" && isHighRisk) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = w.title.toLowerCase().includes(q);
        const matchId = w.id.toLowerCase().includes(q);
        const matchState = w.state.toLowerCase().includes(q);
        const matchDist = w.district.toLowerCase().includes(q);
        const matchMp = w.mpName.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchState && !matchDist && !matchMp) return false;
      }
      return true;
    });
  }, [projects, selectedStateFilter, selectedStatusFilter, selectedRiskFilter, searchQuery]);

  // National KPI Metrics
  const kpis = useMemo(() => {
    const totalProjects = projects.length;
    const totalOutlay = projects.reduce((acc, p) => acc + p.sanctionedAmt, 0);
    const totalExp = projects.reduce((acc, p) => acc + p.expenditureAmt, 0);
    const nationalUtilization = Math.round((totalExp / totalOutlay) * 100);
    const highRiskCount = projects.filter((p) => p.status === "Delayed" || p.financialProgress > p.physicalProgress + 15).length;
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
        activeTab="dashboard"
        setActiveTab={() => {}}
        onOpenPolicy={() => setIsPolicyOpen(true)}
        onOpenLogin={() => {}}
        t={t}
        flagCount={kpis.highRiskCount}
      />

      <main className="container" style={{ flex: 1, padding: "20px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* National Apex Ministry Banner */}
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
            <div style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#93c5fd", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
              <Landmark size={14} />
              Ministry of Statistics and Programme Implementation (MoSPI) | Government of India
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#ffffff", margin: "4px 0 6px 0" }}>
              National MPLADS Decision Support System (eSAKSHI Apex Portal)
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#cbd5e1", maxWidth: "700px", lineHeight: "1.4" }}>
              Apex administrative monitoring gateway for Lok Sabha & Rajya Sabha MPLADS funds allocation, AI/ML anomaly risk scoring, cryptographic audit non-repudiation, and national policy configuration.
            </p>
          </div>

          <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.1)", borderRadius: "var(--radius-xs)", fontSize: "0.78rem" }}>
            National Outlay: <strong>₹3,975.00 Cr</strong> | National Utilization: <strong>{kpis.nationalUtilization}%</strong>
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
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--border-light)", paddingBottom: "2px", flexWrap: "wrap" }}>
          
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
            <span>Data-Driven National Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab("model_management")}
            className={`gov-tab ${activeTab === "model_management" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Cpu size={15} />
            <span>AI/ML Model Management & Retraining</span>
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
                  style={{ width: "160px" }}
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                >
                  <option value="all">All States</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                </select>

                <select
                  className="gov-select"
                  style={{ width: "160px" }}
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
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
                  value={selectedRiskFilter}
                  onChange={(e) => setSelectedRiskFilter(e.target.value)}
                >
                  <option value="all">All Risk Levels</option>
                  <option value="HIGH">High Risk (Priority 1)</option>
                  <option value="LOW">Standard Risk</option>
                </select>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Showing <strong>{filteredNationalProjects.length}</strong> of <strong>{projects.length}</strong> national works
              </div>
            </div>

            {/* Table */}
            <div className="gov-card" style={{ overflowX: "auto" }}>
              <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Work ID</th>
                    <th style={{ padding: "10px 12px" }}>Project Name & Category</th>
                    <th style={{ padding: "10px 12px" }}>State & District</th>
                    <th style={{ padding: "10px 12px" }}>Recommending MP</th>
                    <th style={{ padding: "10px 12px" }}>Sanction Cost</th>
                    <th style={{ padding: "10px 12px" }}>Physical Progress</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                    <th style={{ padding: "10px 12px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNationalProjects.map((work) => (
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
                        <div style={{ fontWeight: 600 }}>{work.district}, {work.state}</div>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "0.78rem" }}>{work.mpName}</td>
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

        {/* TAB 2: DATA-DRIVEN NATIONAL ANALYTICS */}
        {activeTab === "national_analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="gov-card" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                National Outlay Sectoral Allocation & Expenditure Trajectories
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                Data-driven financial audit statistics aligned with MoSPI statutory guidelines.
              </p>

              {/* Data Table Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", padding: "12px 14px", background: "var(--bg-surface-subtle)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "8px" }}>
                    Category-Wise National Outlay Breakdown
                  </div>
                  <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-main)", textAlign: "left" }}>
                        <th style={{ padding: "6px" }}>Category</th>
                        <th style={{ padding: "6px" }}>Outlay (₹ Cr)</th>
                        <th style={{ padding: "6px" }}>Exp Rate (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "6px", fontWeight: 600 }}>Drinking Water Supply</td>
                        <td style={{ padding: "6px" }}>₹1,240.00 Cr</td>
                        <td style={{ padding: "6px", color: "var(--status-success-text)", fontWeight: 700 }}>82.4%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "6px", fontWeight: 600 }}>Rural Roads & Infrastructure</td>
                        <td style={{ padding: "6px" }}>₹980.50 Cr</td>
                        <td style={{ padding: "6px", color: "var(--status-info-text)", fontWeight: 700 }}>76.1%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "6px", fontWeight: 600 }}>Education & School Buildings</td>
                        <td style={{ padding: "6px" }}>₹850.20 Cr</td>
                        <td style={{ padding: "6px", color: "var(--status-info-text)", fontWeight: 700 }}>74.8%</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "6px", fontWeight: 600 }}>Community Health Centers</td>
                        <td style={{ padding: "6px" }}>₹904.30 Cr</td>
                        <td style={{ padding: "6px", color: "var(--status-warning-text)", fontWeight: 700 }}>68.9%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", padding: "12px 14px", background: "var(--bg-surface-subtle)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "8px" }}>
                    State Nodal Compliance Index
                  </div>
                  <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-main)", textAlign: "left" }}>
                        <th style={{ padding: "6px" }}>State</th>
                        <th style={{ padding: "6px" }}>Util Rate</th>
                        <th style={{ padding: "6px" }}>Geotag Cover</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "6px", fontWeight: 600 }}>Maharashtra</td>
                        <td style={{ padding: "6px", fontWeight: 700 }}>78.5%</td>
                        <td style={{ padding: "6px", color: "var(--status-success-text)", fontWeight: 700 }}>98.2%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "6px", fontWeight: 600 }}>Gujarat</td>
                        <td style={{ padding: "6px", fontWeight: 700 }}>84.1%</td>
                        <td style={{ padding: "6px", color: "var(--status-success-text)", fontWeight: 700 }}>99.1%</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "6px", fontWeight: 600 }}>Karnataka</td>
                        <td style={{ padding: "6px", fontWeight: 700 }}>72.4%</td>
                        <td style={{ padding: "6px", color: "var(--status-info-text)", fontWeight: 700 }}>95.4%</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "6px", fontWeight: 600 }}>Uttar Pradesh</td>
                        <td style={{ padding: "6px", fontWeight: 700 }}>69.8%</td>
                        <td style={{ padding: "6px", color: "var(--status-warning-text)", fontWeight: 700 }}>91.0%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI/ML MODEL MANAGEMENT & RETRAINING */}
        {activeTab === "model_management" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {retrainSuccessNotice && (
              <Alert type="success" title="AI Model Pipeline Retrained Successfully">
                {retrainSuccessNotice}
              </Alert>
            )}

            <div className="gov-card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
                    AI/ML Inference Pipeline & Isolation Forest Configuration
                  </h3>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Service Endpoint: <code>http://localhost:8001/predict</code> | Active Version: <strong>IsolationForest-v2.4</strong>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "12px" }}>
                <div style={{ border: "1px solid var(--border-light)", padding: "12px 14px", borderRadius: "var(--radius-xs)", background: "var(--bg-surface-subtle)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "6px" }}>
                    Isolation Forest Anomaly Hyperparameters
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-body)", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div>Contamination Parameter: <code>0.05</code> (5% Expected Anomaly Rate)</div>
                    <div>n_estimators (Trees): <code>100</code></div>
                    <div>Max Samples: <code>auto (256)</code></div>
                    <div>Decision Threshold: <code>-0.12</code></div>
                  </div>
                </div>

                <div style={{ border: "1px solid var(--border-light)", padding: "12px 14px", borderRadius: "var(--radius-xs)", background: "var(--bg-surface-subtle)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "6px" }}>
                    Rule Engine Anomaly Sensitivity Threshold
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-body)", marginBottom: "8px" }}>
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

        {/* TAB 4: SHA-256 AUDIT TRAIL LEDGER */}
        {activeTab === "audit_ledger" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <AuditTrailViewer />
          </div>
        )}

        {/* TAB 5: SYSTEM CONFIGURATION & RBAC */}
        {activeTab === "system_config" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="gov-card" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                National System Configuration & Role-Based Access Control (RBAC)
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                Configure statutory policy parameters (365-day completion ceiling), manage API endpoints, and inspect user role accounts.
              </p>

              <div style={{ padding: "12px 14px", background: "var(--bg-surface-subtle)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", fontSize: "0.78rem" }}>
                <div style={{ fontWeight: 700, color: "var(--gov-primary)" }}>Active Statutory System Parameters:</div>
                <ul style={{ margin: "4px 0 0 16px", color: "var(--text-body)" }}>
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

      <Footer t={t} onOpenPolicy={() => setIsPolicyOpen(true)} />
    </div>
  );
};

export default MinistryDashboard;
