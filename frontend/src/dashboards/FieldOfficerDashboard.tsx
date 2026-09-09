import React, { useState, useMemo, useEffect } from "react";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Camera, 
  FileText, 
  Eye, 
  RefreshCw, 
  UserCheck, 
  AlertCircle, 
  Compass, 
  ShieldAlert,
  Database,
  Download
} from "lucide-react";
import { Header } from "../components/Header";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WorkDetailModal } from "../components/WorkDetailModal";
import { AttachmentsModal } from "../components/AttachmentsModal";
import { PolicyModal } from "../components/PolicyModal";
import { LoginModal } from "../components/LoginModal";
import { Button, Alert } from "../components/ui";
import { SubmitVerificationModal, VerificationReportSubmission } from "../components/field/SubmitVerificationModal";

import { INITIAL_WORKS, WorkItem } from "../data/mpladsData";
import { usePreferences } from "../context/PreferencesContext";
import { useRole, Role } from "../auth/roleContext";
import { adminDataService } from "../api/adminDataService";
import { 
  completeVerificationInSupabase, 
  updateProjectProgressInSupabase,
  logAuditEventInSupabase,
  ensureUUID 
} from "../api/supabaseSync";

export const FieldOfficerDashboard: React.FC = () => {
  const { user } = useRole();
  const { fontScale, setFontScale, theme, setTheme, lang, setLang, t } = usePreferences();

  // Tab View
  const [activeTab, setActiveTab] = useState<"pending_queue" | "my_verifications" | "flagged_projects">("pending_queue");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Projects State
  const [projects, setProjects] = useState<WorkItem[]>(INITIAL_WORKS);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  
  // Field Officer Info
  const officerName = user.name || "Senior Field Inspection Officer";
  const district = user.district || "Pune";

  // Hydrate projects from live Supabase
  useEffect(() => {
    async function loadOfficerProjects() {
      try {
        const liveProjs = await adminDataService.getRawProjects();
        if (liveProjs && liveProjs.length > 0) {
          const mapped: WorkItem[] = liveProjs.map((p, idx) => ({
            id: p.project_id || p.id || `INSP-${idx}`,
            title: p.project_name || p.title || "Public Infrastructure Inspection Task",
            house: "Lok Sabha",
            state: p.state || "Maharashtra",
            district: p.district || district,
            constituency: p.district || district,
            constituency_code: "DIST-01",
            mpName: "District Parliamentary Representative",
            category: p.category || "Community Work",
            sectorName: p.category || "Infrastructure",
            recommendedAmt: Number(p.sanctioned_amount || 1000000) / 10000000,
            sanctionedAmt: Number(p.sanctioned_amount || 1000000) / 10000000,
            expenditureAmt: Number(p.utilized_amount || 400000) / 10000000,
            physicalProgress: p.progress_percentage || (p.status === "Completed" ? 100 : 45),
            financialProgress: Math.round(
              ((Number(p.utilized_amount || 0)) / Math.max(1, Number(p.sanctioned_amount || 1))) * 100
            ) || 40,
            dateSanctioned: p.start_date || "2024-04-01",
            targetCompletion: p.expected_completion_date || "2025-06-30",
            status: (p.status || "Ongoing") as any,
            agency: "Division Public Works & Rural Engineering",
            contractor: "Contractor Executing Body",
            rating: 4.8,
            reviewsCount: 1,
            attachments: [],
            reviews: []
          }));

          setProjects(mapped);
          setIsLiveConnected(true);
        }
      } catch (err) {
        console.warn("FieldOfficerDashboard live fetch fallback:", err);
      }
    }
    loadOfficerProjects();
  }, [district]);

  // Verification Records List
  const [verificationRecords, setVerificationRecords] = useState<VerificationReportSubmission[]>([
    {
      workId: "WORK-MH-2024-001",
      verificationStatus: "VERIFIED",
      verificationOutcome: "Work Physically Verified on Site",
      verifiedBy: "Suresh Patil (Senior Field Inspection Officer)",
      verificationDate: "2024-05-15",
      verificationNotes: "Physical pipeline laying verified near Ward 12 depot. 40% physical progress confirmed with correct pipe diameter specifications.",
      verifiedPhysicalProgress: 40,
      evidenceAvailable: true,
      fieldPhotos: [
        {
          url: "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=800&auto=format&fit=crop&q=60",
          lat: 18.5314,
          lng: 73.8446,
          timestamp: "2024-05-15 10:30 AM"
        }
      ]
    }
  ]);

  // Modal Controls
  const [selectedWorkForVerification, setSelectedWorkForVerification] = useState<WorkItem | null>(null);
  const [selectedWorkForDetail, setSelectedWorkForDetail] = useState<WorkItem | null>(null);
  const [selectedWorkForAttachments, setSelectedWorkForAttachments] = useState<WorkItem | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [targetLoginRole, setTargetLoginRole] = useState<Role | undefined>(undefined);

  // Verification Tasks Queue with Priority Assignment
  const verificationQueue = useMemo(() => {
    return projects.map((work, idx) => {
      const isHighRisk = work.status === "Delayed" || (work.financialProgress || 0) > (work.physicalProgress || 0) + 15;
      const priority = isHighRisk ? "PRIORITY_1" : idx % 2 === 0 ? "PRIORITY_2" : "PRIORITY_3";
      const record = verificationRecords.find((r) => r.workId === work.id);
      const verificationStatus = record ? record.verificationStatus : "PENDING";

      return {
        ...work,
        priority,
        verificationStatus,
        record
      };
    });
  }, [projects, verificationRecords]);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return verificationQueue.filter((item) => {
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
      if (statusFilter !== "all" && item.verificationStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.title || "").toLowerCase().includes(q);
        const matchId = (item.id || "").toLowerCase().includes(q);
        const matchMp = (item.mpName || "").toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchMp) return false;
      }
      return true;
    });
  }, [verificationQueue, priorityFilter, statusFilter, searchQuery]);

  // Key KPI Numbers
  const kpis = useMemo(() => {
    const totalAssigned = verificationQueue.length;
    const priority1Count = verificationQueue.filter((q) => q.priority === "PRIORITY_1").length;
    const pendingCount = verificationQueue.filter((q) => q.verificationStatus === "PENDING").length;
    const verifiedCount = verificationQueue.filter((q) => q.verificationStatus === "VERIFIED").length;
    const flaggedCount = verificationQueue.filter((q) => q.verificationStatus === "FLAGGED").length;

    return { totalAssigned, priority1Count, pendingCount, verifiedCount, flaggedCount };
  }, [verificationQueue]);

  // Handlers
  const handleReportSubmitted = async (report: VerificationReportSubmission) => {
    setVerificationRecords([report, ...verificationRecords.filter((r) => r.workId !== report.workId)]);
    
    // Update local work status if flagged
    if (report.verificationStatus === "FLAGGED") {
      setProjects((prev) =>
        prev.map((p) => (p.id === report.workId ? { ...p, status: "Delayed" } : p))
      );
    }

    try {
      await Promise.all([
        completeVerificationInSupabase(ensureUUID(report.workId), {
          verification_report: report.verificationNotes,
          gps_lat: report.fieldPhotos[0]?.lat || 18.5204,
          gps_long: report.fieldPhotos[0]?.lng || 73.8567,
          status: report.verificationStatus === "VERIFIED" ? "Completed" : "Under Scrutiny"
        }),
        updateProjectProgressInSupabase(
          ensureUUID(report.workId),
          report.verifiedPhysicalProgress,
          undefined,
          report.verificationStatus === "FLAGGED" ? "Delayed" : undefined
        ),
        logAuditEventInSupabase(
          "FIELD_INSPECTION_SUBMITTED",
          "verification_requests",
          ensureUUID(report.workId),
          report
        )
      ]);
    } catch (err) {
      console.warn("Supabase field inspection sync failed:", err);
    }
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
        flagCount={kpis.priority1Count}
      />

      <main className="mplads-main" style={{ flex: 1, padding: "2rem 0 4rem" }}>
        <div className="mplads-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Field Officer Workspace Banner */}
        <div 
          className="civic-card"
          style={{ 
            background: "linear-gradient(135deg, #0a2540 0%, #1e3a5f 100%)", 
            color: "#ffffff", 
            padding: "24px 28px", 
            borderRadius: "14px", 
            border: "1px solid rgba(255, 255, 255, 0.12)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "18px",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.12)"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Field Engineer Inspection Desk · {district} District
              </span>
              {isLiveConnected && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "20px", padding: "2px 8px", fontSize: "0.70rem", color: "#34d399", fontWeight: 600 }}>
                  <Database size={11} />
                  <span>Live Supabase Connected</span>
                </div>
              )}
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", margin: "0 0 6px 0", lineHeight: 1.25, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              {officerName} — Field Inspection Workspace
            </h1>
            <p style={{ fontSize: "0.84rem", color: "#cbd5e1", maxWidth: "760px", lineHeight: 1.45, margin: 0 }}>
              On-site physical verifications, geotagged evidence capture, and inspection report submissions.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              icon={<Download size={14} />}
              style={{ background: "#ffffff", color: "var(--gov-primary, #0a2540)", borderColor: "#ffffff", fontWeight: 700, borderRadius: "8px" }}
            >
              Export Inspection Log (PDF)
            </Button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
          
          <div className="civic-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", borderTop: "3.5px solid #0a2540" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.3px" }}>
              Assigned Tasks
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main, #0f172a)", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              {kpis.totalAssigned}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Pending Action: <strong>{kpis.pendingCount}</strong>
            </div>
          </div>

          <div className="civic-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", borderTop: "3.5px solid #dc2626" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.3px" }}>
              Priority 1 (Urgent Audit)
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#dc2626", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              {kpis.priority1Count}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Immediate Field Audit Needed
            </div>
          </div>

          <div className="civic-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", borderTop: "3.5px solid #16a34a" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.3px" }}>
              Verified Clean
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#16a34a", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              {kpis.verifiedCount}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Report Transmitted to DM
            </div>
          </div>

          <div className="civic-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "8px", borderTop: "3.5px solid #ea580c" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.3px" }}>
              Flagged Issues
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ea580c", lineHeight: 1.1, fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
              {kpis.flaggedCount}
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              Escalated to District Collector
            </div>
          </div>

        </div>

        {/* Civic Navigation Tabs */}
        <div className="civic-nav-tabs">
          <button
            onClick={() => setActiveTab("pending_queue")}
            className={`civic-tab-btn ${activeTab === "pending_queue" ? "active" : ""}`}
          >
            <ShieldCheck size={15} />
            <span>Assigned Queue</span>
            <span className="civic-tab-badge">{filteredQueue.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("my_verifications")}
            className={`civic-tab-btn ${activeTab === "my_verifications" ? "active" : ""}`}
          >
            <CheckCircle2 size={15} />
            <span>Completed Reports</span>
            <span className="civic-tab-badge">{verificationRecords.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("flagged_projects")}
            className={`civic-tab-btn ${activeTab === "flagged_projects" ? "active" : ""}`}
          >
            <ShieldAlert size={15} />
            <span>Flagged Dossiers</span>
            <span className="civic-tab-badge">{verificationRecords.filter(r => r.verificationStatus === "FLAGGED").length}</span>
          </button>
        </div>

        {/* TAB 1: PENDING VERIFICATION QUEUE */}
        {activeTab === "pending_queue" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* Mandatory AI Risk Semantics Banner */}
            <Alert type="info" title="Statutory AI Verification Priority Semantics">
              <strong>IMPORTANT:</strong> AI risk scoring means <strong>verification priority</strong>, NOT proof of fraud or non-compliance.
            </Alert>

            {/* Filter Bar */}
            <div className="civic-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input
                    type="text"
                    className="gov-input"
                    placeholder="Search work ID, project title, MP..."
                    style={{ width: "240px" }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="gov-select"
                  style={{ width: "160px" }}
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="PRIORITY_1">PRIORITY 1 (High Risk)</option>
                  <option value="PRIORITY_2">PRIORITY 2 (Medium Risk)</option>
                  <option value="PRIORITY_3">PRIORITY 3 (Standard)</option>
                </select>

                <select
                  className="gov-select"
                  style={{ width: "160px" }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending Verification</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="FLAGGED">Flagged</option>
                  <option value="REQUIRES_MORE_EVIDENCE">More Evidence Req.</option>
                </select>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Showing <strong>{filteredQueue.length}</strong> of <strong>{verificationQueue.length}</strong> tasks
              </div>
            </div>

            {/* Queue Table */}
            <div className="civic-card" style={{ padding: "16px 20px", overflowX: "auto" }}>
              <table className="gov-table" style={{ width: "100%", fontSize: "0.82rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface-subtle)", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Priority</th>
                    <th style={{ padding: "10px 12px" }}>Work ID & Title</th>
                    <th style={{ padding: "10px 12px" }}>Location & MP</th>
                    <th style={{ padding: "10px 12px" }}>Sanction Cost</th>
                    <th style={{ padding: "10px 12px" }}>Physical Progress</th>
                    <th style={{ padding: "10px 12px" }}>Verification Status</th>
                    <th style={{ padding: "10px 12px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                        No verification tasks found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <span className={`gov-badge ${item.priority === "PRIORITY_1" ? "gov-badge-danger" : item.priority === "PRIORITY_2" ? "gov-badge-warning" : "gov-badge-info"}`}>
                            {item.priority.replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", maxWidth: "260px" }}>
                          <div style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--gov-primary)", fontSize: "0.78rem" }}>
                            {item.id}
                          </div>
                          <div style={{ fontWeight: 700, color: "var(--text-main)", marginTop: "2px" }}>
                            {item.title}
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "0.76rem" }}>
                          <div style={{ fontWeight: 600 }}>{item.district}, {item.state}</div>
                          <div style={{ color: "var(--text-muted)" }}>MP: {item.mpName}</div>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--gov-primary)" }}>
                          ₹{item.sanctionedAmt.toFixed(2)} Cr
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "60px", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${item.physicalProgress}%`, height: "100%", background: "#3b82f6" }} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: "0.76rem" }}>{item.physicalProgress}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {item.verificationStatus === "VERIFIED" && <span className="gov-badge gov-badge-success">VERIFIED</span>}
                          {item.verificationStatus === "FLAGGED" && <span className="gov-badge gov-badge-danger">FLAGGED</span>}
                          {item.verificationStatus === "REQUIRES_MORE_EVIDENCE" && <span className="gov-badge gov-badge-warning">MORE EVIDENCE REQ.</span>}
                          {item.verificationStatus === "PENDING" && <span className="gov-badge gov-badge-neutral">PENDING FIELD AUDIT</span>}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setSelectedWorkForVerification(item)}
                              icon={<Camera size={12} />}
                            >
                              Inspect & Verify
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedWorkForDetail(item)}
                              icon={<Eye size={12} />}
                            >
                              Details
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

        {/* TAB 2: COMPLETED VERIFICATION REPORTS */}
        {activeTab === "my_verifications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="civic-card" style={{ padding: "20px 24px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main, #0f172a)", marginBottom: "4px", fontFamily: "var(--font-display, Outfit, sans-serif)" }}>
                Field Officer Submitted Verification Audit Reports ({verificationRecords.length})
              </h3>
              <p style={{ fontSize: "0.80rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                Log of physical inspection reports transmitted to District Collectorate by {officerName}.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {verificationRecords.map((r, idx) => (
                  <div key={idx} style={{ padding: "16px 18px", border: "1px solid var(--border-light, #e2e8f0)", borderRadius: "10px", background: "var(--bg-surface-subtle, #f8fafc)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem", color: "var(--gov-primary)" }}>
                            {r.workId}
                          </span>
                          <span className={`gov-badge ${r.verificationStatus === "VERIFIED" ? "gov-badge-success" : r.verificationStatus === "FLAGGED" ? "gov-badge-danger" : "gov-badge-warning"}`}>
                            {r.verificationStatus}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Date: {r.verificationDate}</span>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: "0.88rem", marginTop: "4px" }}>
                          {r.verificationOutcome}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-body)", marginTop: "4px", lineHeight: "1.4" }}>
                          {r.verificationNotes}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          Verified Progress: <strong>{r.verifiedPhysicalProgress}%</strong> | Inspector: <strong>{r.verifiedBy}</strong> | Geotagged Photos: <strong>{r.fieldPhotos.length}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        </div>
      </main>

      {/* Modals */}
      <SubmitVerificationModal
        isOpen={!!selectedWorkForVerification}
        onClose={() => setSelectedWorkForVerification(null)}
        work={selectedWorkForVerification}
        officerName={officerName}
        onSubmitted={handleReportSubmitted}
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

export default FieldOfficerDashboard;
