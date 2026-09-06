import React, { useState, useEffect } from "react";
import { Plus, Search, FileText, Bell, Wifi, WifiOff, RefreshCw, Shield, MapPin, Landmark } from "lucide-react";
import { Header } from "../components/Header";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WorkDetailModal } from "../components/WorkDetailModal";
import { AttachmentsModal } from "../components/AttachmentsModal";
import { PolicyModal } from "../components/PolicyModal";
import { Button, Alert, Card, CardHeader, CardBody } from "../components/ui";
import { 
  CitizenIssue, 
  INITIAL_CITIZEN_ISSUES, 
  getOfflineDrafts, 
  saveOfflineDraft 
} from "../data/citizenData";
import { INITIAL_WORKS, WorkItem } from "../data/mpladsData";
import { TRANSLATIONS } from "../data/translations";
import { 
  SubmitIssueModal, 
  IssueTracker, 
  CitizenProjectSearch, 
  CitizenNotifications 
} from "../components/citizen";
import { apiClient, mapBackendProjectsToWorkItems } from "../api/client";

export const CitizenDashboard: React.FC = () => {
  const [fontScale, setFontScale] = useState<"sm" | "base" | "lg">("base");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const t = TRANSLATIONS[lang];

  const [activeTab, setActiveTab] = useState<"my_issues" | "projects" | "notifications">("my_issues");
  const [issues, setIssues] = useState<CitizenIssue[]>(INITIAL_CITIZEN_ISSUES);
  const [offlineDrafts, setOfflineDrafts] = useState<CitizenIssue[]>([]);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const [attachmentWork, setAttachmentWork] = useState<WorkItem | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [works, setWorks] = useState<WorkItem[]>(INITIAL_WORKS);

  useEffect(() => {
    setOfflineDrafts(getOfflineDrafts());
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    async function loadPublicProjects() {
      try {
        const data = await apiClient.getPublicProjects();
        setWorks(mapBackendProjectsToWorkItems(data));
      } catch {
        // keep offline fallback
      }
    }
    loadPublicProjects();
  }, []);

  const handleIssueSubmitted = (newIssue: CitizenIssue) => {
    setIssues([newIssue, ...issues]);
    setOfflineDrafts(getOfflineDrafts());
  };

  const handleSyncOfflineDrafts = () => {
    if (offlineDrafts.length === 0) return;
    setIssues([...offlineDrafts, ...issues]);
    localStorage.removeItem("mplads_citizen_offline_drafts");
    setOfflineDrafts([]);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)" }}>
      {/* Top Header & Navigation Bar */}
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
        flagCount={2}
      />

      <main className="container" style={{ flex: 1, padding: "20px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Network & PWA Sync Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem" }}>
            {isOnline ? (
              <span className="gov-badge gov-badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Wifi size={12} /> ONLINE MODE
              </span>
            ) : (
              <span className="gov-badge gov-badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <WifiOff size={12} /> OFFLINE PWA MODE
              </span>
            )}
            <span style={{ color: "var(--text-muted)" }}>
              Constituency: <strong>Pune (MH-PUNE-01)</strong> | State: <strong>Maharashtra</strong>
            </span>
          </div>

          {offlineDrafts.length > 0 && (
            <Button variant="secondary" size="sm" onClick={handleSyncOfflineDrafts} icon={<RefreshCw size={13} />}>
              Sync {offlineDrafts.length} Offline Drafts
            </Button>
          )}
        </div>

        {/* Hero Welcome & Primary Action CTA Banner */}
        <div style={{ background: "var(--gov-header)", color: "#ffffff", padding: "20px 24px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255, 255, 255, 0.15)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "#93c5fd", fontWeight: 700 }}>
              e-SAKSHI Citizen Public Portal
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#ffffff", margin: "4px 0 6px 0" }}>
              Public Area Grievance & MPLADS Project Tracking
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#cbd5e1", maxWidth: "600px", lineHeight: "1.4" }}>
              Report local infrastructure issues directly to District Nodal Authorities, track field inspection progress, and inspect constituency MP development works.
            </p>
          </div>

          <Button variant="primary" size="lg" onClick={() => setIsSubmitOpen(true)} icon={<Plus size={18} />} style={{ background: "#155eef", borderColor: "#155eef" }}>
            Submit Local Issue
          </Button>
        </div>

        {/* Summary KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <div className="gov-card" style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Submitted Issues</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>{issues.length}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Registered Grievances</div>
          </div>

          <div className="gov-card" style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Inspections Assigned</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--status-warning-text)", marginTop: "2px" }}>
              {issues.filter((i) => i.status === "INSPECTION_ASSIGNED").length}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Field Officer Assigned</div>
          </div>

          <div className="gov-card" style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Resolved Issues</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--status-success-text)", marginTop: "2px" }}>
              {issues.filter((i) => i.status === "RESOLVED").length}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Action Completed</div>
          </div>

          <div className="gov-card" style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Constituency Works</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--gov-primary)", marginTop: "2px" }}>{works.length}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Sanctioned Projects</div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid var(--border-light)", paddingBottom: "2px" }}>
          <button
            onClick={() => setActiveTab("my_issues")}
            className={`gov-tab ${activeTab === "my_issues" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <FileText size={15} />
            <span>My Issues & Grievances ({issues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("projects")}
            className={`gov-tab ${activeTab === "projects" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Landmark size={15} />
            <span>Search Constituency Works</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`gov-tab ${activeTab === "notifications" ? "active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Bell size={15} />
            <span>Portal Notifications</span>
          </button>
        </div>

        {/* Tab Content Display */}
        {activeTab === "my_issues" && <IssueTracker issues={issues} />}

        {activeTab === "projects" && (
          <CitizenProjectSearch
            works={works}
            onSelectWork={(work) => setSelectedWork(work)}
          />
        )}

        {activeTab === "notifications" && <CitizenNotifications />}

      </main>

      {/* Modals */}
      <SubmitIssueModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmitted={handleIssueSubmitted}
      />

      <WorkDetailModal
        work={selectedWork}
        onClose={() => setSelectedWork(null)}
        onViewAttachments={(work) => { setSelectedWork(null); setAttachmentWork(work); }}
        onViewReviews={() => {}}
      />

      <AttachmentsModal
        work={attachmentWork}
        onClose={() => setAttachmentWork(null)}
      />

      <PolicyModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
      />

      <Footer t={t} onOpenPolicy={() => setIsPolicyOpen(true)} />
    </div>
  );
}
export default CitizenDashboard;
