import React, { useState, useMemo } from "react";
import { 
  Building2, 
  Search, 
  Filter, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Camera, 
  FileText, 
  Eye, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  HardHat, 
  Calendar, 
  ArrowUpRight 
} from "lucide-react";
import { Header } from "../components/Header";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WorkDetailModal } from "../components/WorkDetailModal";
import { AttachmentsModal } from "../components/AttachmentsModal";
import { PolicyModal } from "../components/PolicyModal";
import { LoginModal } from "../components/LoginModal";
import { Button, Alert } from "../components/ui";
import { UpdateProgressModal, ProgressUpdateSubmission } from "../components/contractor/UpdateProgressModal";

import { INITIAL_WORKS, WorkItem } from "../data/mpladsData";
import { usePreferences } from "../context/PreferencesContext";
import { useRole, Role } from "../auth/roleContext";

export const ContractorDashboard: React.FC = () => {
  const { user } = useRole();
  const { fontScale, setFontScale, theme, setTheme, lang, setLang, t } = usePreferences();

  // Active View Tab
  const [activeTab, setActiveTab] = useState<"assigned_projects" | "offline_queue" | "completion_records">("assigned_projects");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  // Local State for Projects
  const [projects, setProjects] = useState<WorkItem[]>(INITIAL_WORKS);
  
  // Offline Draft Queue
  const [offlineQueue, setOfflineQueue] = useState<ProgressUpdateSubmission[]>([
    {
      workId: "WORK-MH-2024-002",
      physicalProgress: 65,
      expenditureIncurredAmt: 1.45,
      stageName: "Structural Superstructure Execution",
      notes: "Level 2 RCC slab casting finalized with ultrasonic compressive strength testing. Reinforcement steel bar bending verified.",
      photos: [
        { name: "Slab_Casting_Level2.jpg", url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=400&q=80", lat: 18.5204, lng: 73.8567, timestamp: "2024-05-18 10:45 AM" }
      ],
      documents: [{ name: "MB_Extract_Cycle_3.pdf", size: "1.8 MB", type: "Measurement Book" }],
      isCompletionReport: false,
      timestamp: "2024-05-18 11:20 AM"
    }
  ]);

  // Modal Controls
  const [selectedWorkForProgress, setSelectedWorkForProgress] = useState<WorkItem | null>(null);
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<WorkItem | null>(null);
  const [selectedWorkForAttachments, setSelectedWorkForAttachments] = useState<WorkItem | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [targetLoginRole, setTargetLoginRole] = useState<Role | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);

  // Contractor info
  const agencyName = user.name || "Maharashtra State PWD Infrastructure Agency";
  const district = user.district || "Pune";

  // Filtered Assigned Works
  const assignedWorks = useMemo(() => {
    return projects.filter((w) => {
      if (selectedStatusFilter !== "all" && w.status !== selectedStatusFilter) return false;
      if (selectedCategoryFilter !== "all" && w.category !== selectedCategoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (w.title || "").toLowerCase().includes(q);
        const matchId = (w.id || "").toLowerCase().includes(q);
        const matchAgency = (w.agency || "").toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchAgency) return false;
      }
      return true;
    });
  }, [projects, selectedStatusFilter, selectedCategoryFilter, searchQuery]);

  // Key KPI Summary Numbers
  const kpis = useMemo(() => {
    const totalAssigned = projects.length;
    const totalOutlay = projects.reduce((acc, p) => acc + (p.sanctionedAmt || 0), 0);
    const ongoing = projects.filter((p) => p.status === "Ongoing").length;
    const completed = projects.filter((p) => p.status === "Completed").length;
    const delayed = projects.filter((p) => p.status === "Delayed").length;
    const pendingDrafts = offlineQueue.length;

    return { totalAssigned, totalOutlay, ongoing, completed, delayed, pendingDrafts };
  }, [projects, offlineQueue]);

  // Handlers
  const handleProgressSubmitted = (submission: ProgressUpdateSubmission) => {
    // Update local project state
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === submission.workId) {
          const newStatus = submission.isCompletionReport || submission.physicalProgress === 100 ? "Completed" : "Ongoing";
          const newFinancialProgress = Math.round((submission.expenditureIncurredAmt / p.sanctionedAmt) * 100);
          return {
            ...p,
            physicalProgress: submission.physicalProgress,
            expenditureAmt: submission.expenditureIncurredAmt,
            financialProgress: Math.min(100, newFinancialProgress),
            status: newStatus
          };
        }
        return p;
      })
    );
  };

  const handleSyncOfflineQueue = () => {
    setIsSyncing(true);
    setTimeout(() => {
      offlineQueue.forEach((submission) => handleProgressSubmitted(submission));
      setOfflineQueue([]);
      setIsSyncing(false);
    }, 1200);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)" }}>
      {/* 1. Official Header Navigation */}
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
        flagCount={kpis.delayed}
      />

      <main className="container" style={{ flex: 1, padding: "20px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Contractor Workspace Branding Banner */}
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
              {agencyName} ({district} Circle)
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#cbd5e1", maxWidth: "680px", lineHeight: "1.4", margin: 0 }}>
              Milestone progress updates, geotagged site photographs, and Measurement Book (MB) submissions.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {offlineQueue.length > 0 && (
              <Button
                variant="primary"
                size="md"
                onClick={handleSyncOfflineQueue}
                disabled={isSyncing}
                icon={isSyncing ? <RefreshCw size={15} className="spin" /> : <UploadCloud size={15} />}
              >
                {isSyncing ? "Syncing Uploads..." : `Sync Offline Drafts (${offlineQueue.length})`}
              </Button>
            )}
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          
          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Assigned Works
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>
              {kpis.totalAssigned} Projects
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Outlay: <strong>₹{kpis.totalOutlay.toFixed(2)} Cr</strong>
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Active Ongoing
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-info-text)", marginTop: "2px" }}>
              {kpis.ongoing} Active
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Field Execution Phase
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Completed & Verified
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--status-success-text)", marginTop: "2px" }}>
              {kpis.completed} Finished
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Completion Certificate Filed
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Behind Schedule / Delayed
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: kpis.delayed > 0 ? "var(--status-danger-text)" : "var(--status-success-text)", marginTop: "2px" }}>
              {kpis.delayed} Delayed
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Milestone Extension Review
            </div>
          </div>

          <div className="gov-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Offline Draft Queue
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: kpis.pendingDrafts > 0 ? "var(--status-warning-text)" : "var(--text-main)", marginTop: "2px" }}>
              {kpis.pendingDrafts} Pending
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Low-Connectivity Field Storage
            </div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--border-light)", paddingBottom: "2px", flexWrap: "wrap" }}>
          
          <button
            onClick={() => setActiveTab("assigned_projects")}
            className={`gov-tab ${activeTab === "assigned_projects" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Building2 size={15} />
            <span>Assigned Works & Progress Portal ({assignedWorks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("offline_queue")}
            className={`gov-tab ${activeTab === "offline_queue" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <UploadCloud size={15} />
            <span>Offline Draft Queue ({offlineQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("completion_records")}
            className={`gov-tab ${activeTab === "completion_records" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <CheckCircle2 size={15} />
            <span>Completed Works & Certificates ({projects.filter(p => p.status === "Completed").length})</span>
          </button>

        </div>

        {/* TAB 1: ASSIGNED WORKS */}
        {activeTab === "assigned_projects" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* Filter Bar */}
            <div className="gov-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    type="text"
                    className="gov-input"
                    placeholder="Search by title, work ID, category..."
                    style={{ width: "240px" }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

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
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Drinking Water">Drinking Water</option>
                  <option value="Education">Education</option>
                  <option value="Roads">Roads</option>
                  <option value="Health">Health</option>
                  <option value="Community Assets">Community Assets</option>
                </select>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Showing <strong>{assignedWorks.length}</strong> of <strong>{projects.length}</strong> assigned contracts
              </div>
            </div>

            {/* Works List / Table */}
            <div className="gov-card" style={{ overflowX: "auto" }}>
              <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Work ID</th>
                    <th style={{ padding: "10px 12px" }}>Contract Project & Location</th>
                    <th style={{ padding: "10px 12px" }}>Sanction Cost</th>
                    <th style={{ padding: "10px 12px" }}>Expenditure Incurred</th>
                    <th style={{ padding: "10px 12px" }}>Physical Progress</th>
                    <th style={{ padding: "10px 12px" }}>Target Completion</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                    <th style={{ padding: "10px 12px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedWorks.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                        No assigned projects found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    assignedWorks.map((work) => (
                      <tr key={work.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, color: "var(--gov-primary)" }}>
                          {work.id}
                        </td>
                        <td style={{ padding: "10px 12px", maxWidth: "260px" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{work.title}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {work.district}, {work.state} | MP: {work.mpName}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--gov-primary)" }}>
                          ₹{work.sanctionedAmt.toFixed(2)} Cr
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          ₹{work.expenditureAmt.toFixed(2)} Cr ({work.financialProgress}%)
                        </td>
                        <td style={{ padding: "10px 12px", minWidth: "140px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                              <div 
                                style={{ 
                                  width: `${work.physicalProgress}%`, 
                                  height: "100%", 
                                  background: work.physicalProgress === 100 ? "#10b981" : "#3b82f6" 
                                }} 
                              />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: "0.76rem" }}>{work.physicalProgress}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontSize: "0.76rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Calendar size={12} color="var(--text-muted)" />
                            <span>{work.targetCompletion}</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span className={`gov-badge ${work.status === "Completed" ? "gov-badge-success" : work.status === "Delayed" ? "gov-badge-danger" : "gov-badge-info"}`}>
                            {work.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            <Button 
                              variant="primary" 
                              size="sm" 
                              onClick={() => setSelectedWorkForProgress(work)}
                              icon={<Camera size={12} />}
                            >
                              Update Progress
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => setSelectedWorkForDetail(work)}
                              icon={<Eye size={12} />}
                            >
                              Inspect
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: OFFLINE DRAFT QUEUE */}
        {activeTab === "offline_queue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Alert type="info" title="Offline Draft Storage & Upload Queue">
              When field engineers operate in low-connectivity areas, progress updates and photos are saved locally in the PWA storage shell. Click "Sync Queue Now" when back in cellular coverage.
            </Alert>

            {offlineQueue.length === 0 ? (
              <div className="gov-card" style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                <CheckCircle2 size={36} color="var(--status-success-text)" style={{ margin: "0 auto 8px auto" }} />
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>All field progress drafts are fully synchronized</div>
                <div style={{ fontSize: "0.78rem", marginTop: "2px" }}>No pending offline uploads in local PWA storage.</div>
              </div>
            ) : (
              <div className="gov-card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
                    Pending Offline Milestone Uploads ({offlineQueue.length})
                  </h3>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSyncOfflineQueue}
                    disabled={isSyncing}
                    icon={isSyncing ? <RefreshCw size={14} className="spin" /> : <UploadCloud size={14} />}
                  >
                    {isSyncing ? "Transmitting..." : "Sync All Queued Drafts"}
                  </Button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {offlineQueue.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: "12px 14px", 
                        border: "1px solid var(--status-warning-border)", 
                        background: "var(--status-warning-bg)", 
                        borderRadius: "var(--radius-xs)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "10px"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem", color: "var(--gov-primary)" }}>
                            {item.workId}
                          </span>
                          <span className="gov-badge gov-badge-warning">QUEUED LOCAL DRAFT</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{item.timestamp}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "0.86rem", marginTop: "4px" }}>
                          Stage: {item.stageName} — Reported Physical Progress: {item.physicalProgress}%
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-body)", marginTop: "2px" }}>
                          Attached: {item.photos.length} Geotagged Photos | {item.documents.length} MB Documents
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSyncOfflineQueue}
                        disabled={isSyncing}
                        icon={<RefreshCw size={13} />}
                      >
                        Transmit Now
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPLETION RECORDS */}
        {activeTab === "completion_records" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="gov-card" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gov-primary)", marginBottom: "4px" }}>
                Statutory Completion Certificates & Final Handover Registry
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                Projects completed by {agencyName} with final 100% verification certificates submitted to District Authorities.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {projects.filter(p => p.status === "Completed").map((work) => (
                  <div 
                    key={work.id}
                    style={{ 
                      padding: "14px 16px", 
                      border: "1px solid var(--border-main)", 
                      borderRadius: "var(--radius-xs)",
                      background: "var(--bg-surface)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem", color: "var(--gov-primary)" }}>
                          {work.id}
                        </span>
                        <span className="gov-badge gov-badge-success">COMPLETED & VERIFIED</span>
                      </div>
                      <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "2px" }}>
                        {work.title}
                      </h4>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                        Sanction Outlay: ₹{work.sanctionedAmt.toFixed(2)} Cr | Final Expenditure: ₹{work.expenditureAmt.toFixed(2)} Cr | Handed Over: {work.targetCompletion}
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedWorkForAttachments(work)}
                      icon={<FileText size={13} />}
                    >
                      View Completion Docs
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      <UpdateProgressModal
        isOpen={!!selectedWorkForProgress}
        onClose={() => setSelectedWorkForProgress(null)}
        work={selectedWorkForProgress}
        onSubmitted={handleProgressSubmitted}
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

export default ContractorDashboard;
