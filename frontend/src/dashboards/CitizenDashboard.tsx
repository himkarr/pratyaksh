import React, { useState } from "react";
import { 
  Home, Search, FileText, Bell, MapPin, Landmark, 
  Plus, AlertTriangle, ArrowRight, CheckCircle2, Clock, 
  ChevronRight, Sparkles, Building2
} from "lucide-react";
import { Header } from "../components/Header";
import { PolicyModal } from "../components/PolicyModal";
import { LoginModal } from "../components/LoginModal";
import { Button } from "../components/ui";
import { 
  CitizenIssue, 
  INITIAL_CITIZEN_ISSUES 
} from "../data/citizenData";
import { 
  ALL_WORKS, 
  WorkItem 
} from "../data/mpladsData";
import { usePreferences } from "../context/PreferencesContext";
import { 
  SubmitIssueModal, 
  IssueTracker, 
  CitizenProjectSearch, 
  CitizenNotifications,
  CitizenWorkDetailModal,
  CitizenFooter,
  CitizenNavbar
} from "../components/citizen";

export const CitizenDashboard: React.FC = () => {
  const { fontScale, setFontScale, theme, setTheme, lang, setLang, t } = usePreferences();

  // 4 Core Citizen Portal Actions: "home" | "find_works" | "my_reports" | "notifications"
  const [activeTab, setActiveTab] = useState<"home" | "find_works" | "my_reports" | "notifications">("home");

  // State Management
  const [currentConstituency, setCurrentConstituency] = useState<string>("Pune");
  const [currentState, setCurrentState] = useState<string>("Maharashtra");
  const [issues, setIssues] = useState<CitizenIssue[]>(INITIAL_CITIZEN_ISSUES);
  
  // Modals State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [reportTargetWork, setReportTargetWork] = useState<WorkItem | null>(null);
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [targetLoginRole, setTargetLoginRole] = useState<any>(undefined);
  
  // Search query on Home hero
  const [homeSearchQuery, setHomeSearchQuery] = useState("");

  // Filter works by current constituency or show all
  const constituencyWorks = ALL_WORKS.filter(
    (w) => !currentConstituency || w.constituency.toLowerCase() === currentConstituency.toLowerCase()
  );
  const displayWorks = constituencyWorks.length > 0 ? constituencyWorks : ALL_WORKS;

  // Local works statistics (compact citizen counts)
  const totalWorksCount = displayWorks.length;
  const ongoingWorksCount = displayWorks.filter((w) => w.status === "Ongoing" || w.status === "Sanctioned").length;
  const completedWorksCount = displayWorks.filter((w) => w.status === "Completed").length;
  const delayedWorksCount = displayWorks.filter((w) => w.status === "Delayed").length;

  // Recent 3 citizen reports for home preview
  const recentReports = issues.slice(0, 3);

  // Handlers
  const handleIssueSubmitted = (newIssue: CitizenIssue) => {
    setIssues([newIssue, ...issues]);
  };

  const handleOpenReportWithWork = (work: WorkItem) => {
    setReportTargetWork(work);
    setIsSubmitOpen(true);
  };

  const handleOpenGeneralReport = () => {
    setReportTargetWork(null);
    setIsSubmitOpen(true);
  };

  const handleHomeSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab("find_works");
  };

  const handleConstituencyChange = (constituencyName: string) => {
    setCurrentConstituency(constituencyName);
    if (constituencyName === "Pune") setCurrentState("Maharashtra");
    else if (constituencyName === "Varanasi") setCurrentState("Uttar Pradesh");
    else if (constituencyName === "New Delhi") setCurrentState("Delhi");
    else if (constituencyName.includes("Bangalore")) setCurrentState("Karnataka");
    else if (constituencyName.includes("Chennai")) setCurrentState("Tamil Nadu");
  };

  const getReportStageBadge = (issue: CitizenIssue) => {
    switch (issue.status) {
      case "RESOLVED":
        return <span className="gov-badge gov-badge-success">Resolved</span>;
      case "INSPECTION_ASSIGNED":
        return <span className="gov-badge gov-badge-warning">Inspection Scheduled</span>;
      case "UNDER_REVIEW":
        return <span className="gov-badge gov-badge-info">Received</span>;
      case "REJECTED":
        return <span className="gov-badge gov-badge-danger">Closed</span>;
      default:
        return <span className="gov-badge gov-badge-neutral">Submitted</span>;
    }
  };

  const getWorkStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <span className="gov-badge gov-badge-success">Completed</span>;
      case "Delayed":
        return <span className="gov-badge gov-badge-danger">Delayed</span>;
      case "Ongoing":
        return <span className="gov-badge gov-badge-info">In Progress</span>;
      case "Sanctioned":
      case "Recommended":
        return <span className="gov-badge gov-badge-warning">Sanctioned</span>;
      default:
        return <span className="gov-badge gov-badge-neutral">{status}</span>;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)", overflowX: "hidden", width: "100%" }}>
      {/* Scoped Responsive Styles */}
      <style>{`
        .citizen-main-container {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 20px 24px 36px 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-sizing: border-box;
        }

        .citizen-location-bar {
          background: var(--bg-surface);
          padding: 10px 18px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-main);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          box-sizing: border-box;
        }

        .citizen-tab-bar {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid var(--border-light);
          padding-bottom: 2px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .citizen-tab-bar::-webkit-scrollbar {
          display: none;
        }

        .citizen-tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          font-size: 0.86rem;
          white-space: nowrap;
          cursor: pointer;
          background: transparent;
          border: none;
          border-radius: 6px 6px 0 0;
          color: var(--text-body);
        }

        .citizen-hero-box {
          background: linear-gradient(135deg, var(--gov-primary) 0%, #1e3a5f 100%);
          color: var(--text-white);
          padding: 24px 26px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-sizing: border-box;
        }

        .citizen-hero-form {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          width: 100%;
          max-width: 760px;
        }

        .citizen-hero-input-wrap {
          position: relative;
          flex: 1 1 280px;
          min-width: 0;
        }

        .citizen-hero-btn-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .citizen-works-section {
          background: var(--bg-surface);
          padding: 20px 24px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-main);
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-sizing: border-box;
        }

        .citizen-works-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .citizen-stats-group {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .citizen-works-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .citizen-recent-reports-section {
          background: var(--bg-surface);
          padding: 20px 24px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-main);
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-sizing: border-box;
        }

        /* Mobile Responsive Overrides */
        @media (max-width: 900px) {
          .citizen-works-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .citizen-main-container {
            padding: 12px 16px 24px 16px;
            gap: 14px;
          }

          .citizen-location-bar {
            padding: 10px 12px;
            gap: 8px;
          }

          .citizen-tab-bar {
            gap: 4px;
            padding-bottom: 4px;
          }

          .citizen-tab-btn {
            padding: 8px 10px;
            font-size: 0.80rem;
            flex: 1 1 auto;
            justify-content: center;
            min-height: 40px;
          }

          .citizen-hero-box {
            padding: 18px 14px;
            gap: 12px;
          }

          .citizen-hero-form {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            max-width: 100%;
          }

          .citizen-hero-input-wrap {
            flex: 1 1 auto;
            width: 100%;
          }

          .citizen-hero-btn-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            width: 100%;
          }

          .citizen-hero-btn-group button {
            width: 100%;
            justify-content: center;
            min-height: 42px;
          }

          .citizen-works-section {
            padding: 14px 14px;
            gap: 12px;
          }

          .citizen-works-header {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .citizen-stats-group {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
            width: 100%;
          }

          .citizen-stats-group > div {
            text-align: center;
          }

          .citizen-works-grid {
            grid-template-columns: 1fr !important;
            gap: 10px;
          }

          .citizen-recent-reports-section {
            padding: 14px 14px;
          }
        }

        @media (max-width: 420px) {
          .citizen-hero-btn-group {
            grid-template-columns: 1fr;
          }

          .citizen-tab-btn span {
            font-size: 0.76rem;
          }
        }
      `}</style>

      {/* Official Government Top Header (Accessibility, Font, Theme, Lang) */}
      <Header
        fontScale={fontScale}
        setFontScale={setFontScale}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        t={t}
      />

      {/* Clean Compact Citizen Navigation Bar with Notifications and Account Dropdown */}
      <CitizenNavbar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        unreadCount={2}
        currentConstituency={currentConstituency}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Centered Main Content Container (max-width: 1200px) */}
      <main className="citizen-main-container">
        {/* Compact Location Header & Area Switcher */}
        <div className="citizen-location-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <MapPin size={16} color="var(--gov-accent)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "0.84rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Constituency: <strong style={{ color: "var(--gov-primary)" }}>{currentConstituency}</strong> ({currentState})
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Change Area:</span>
            <select
              value={currentConstituency}
              onChange={(e) => handleConstituencyChange(e.target.value)}
              style={{
                padding: "4px 8px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--border-main)",
                background: "var(--bg-surface)",
                color: "var(--text-main)",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
                maxWidth: "180px"
              }}
            >
              <option value="Pune">Pune (Maharashtra)</option>
              <option value="Varanasi">Varanasi (Uttar Pradesh)</option>
              <option value="New Delhi">New Delhi (Delhi)</option>
              <option value="Bangalore South">Bangalore South (Karnataka)</option>
              <option value="Chennai South">Chennai South (Tamil Nadu)</option>
            </select>
          </div>
        </div>

        {/* Compact 3-Action Primary Tab Navigation */}
        <div className="citizen-tab-bar">
          {/* Tab 1: Home */}
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={`citizen-tab-btn gov-tab ${activeTab === "home" ? "active" : ""}`}
            style={{ fontWeight: activeTab === "home" ? 700 : 500 }}
          >
            <Home size={15} />
            <span>Home</span>
          </button>

          {/* Tab 2: Find Works */}
          <button
            type="button"
            onClick={() => setActiveTab("find_works")}
            className={`citizen-tab-btn gov-tab ${activeTab === "find_works" ? "active" : ""}`}
            style={{ fontWeight: activeTab === "find_works" ? 700 : 500 }}
          >
            <Search size={15} />
            <span>Find Works</span>
          </button>

          {/* Tab 3: My Reports */}
          <button
            type="button"
            onClick={() => setActiveTab("my_reports")}
            className={`citizen-tab-btn gov-tab ${activeTab === "my_reports" ? "active" : ""}`}
            style={{ fontWeight: activeTab === "my_reports" ? 700 : 500 }}
          >
            <FileText size={15} />
            <span>My Reports</span>
            <span
              style={{
                fontSize: "0.68rem",
                padding: "1px 6px",
                borderRadius: "var(--radius-full)",
                background: activeTab === "my_reports" ? "var(--gov-accent)" : "var(--border-light)",
                color: activeTab === "my_reports" ? "#ffffff" : "var(--text-muted)",
                fontWeight: 700
              }}
            >
              {issues.length}
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: HOME VIEW */}
        {/* ========================================================================= */}
        {activeTab === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Simplified Hero: "Find development works near you" with single search & quick buttons */}
            <div className="citizen-hero-box">
              <div>
                <h2 style={{ fontSize: "1.30rem", fontWeight: 800, color: "var(--text-white)", margin: "0 0 4px 0", letterSpacing: "-0.2px" }}>
                  Find development works near you
                </h2>
                <p style={{ fontSize: "0.84rem", color: "#cbd5e1", maxWidth: "620px", lineHeight: 1.4, margin: 0 }}>
                  Search approved MPLADS community projects in your area, check execution progress, or report an issue with local infrastructure.
                </p>
              </div>

              {/* Single Search Field + Find Works & Report Buttons */}
              <form onSubmit={handleHomeSearchSubmit} className="citizen-hero-form">
                <div className="citizen-hero-input-wrap">
                  <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="Search by project name, locality, or sector..."
                    value={homeSearchQuery}
                    onChange={(e) => setHomeSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 36px",
                      borderRadius: "var(--radius-xs)",
                      border: "none",
                      background: "#ffffff",
                      color: "var(--text-main)",
                      fontSize: "0.86rem",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div className="citizen-hero-btn-group">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    icon={<Search size={14} />}
                    style={{ background: "var(--gov-accent)", borderColor: "var(--gov-accent)" }}
                  >
                    Find Works
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleOpenGeneralReport}
                    icon={<AlertTriangle size={14} />}
                    style={{ background: "#ea580c", borderColor: "#c2410c" }}
                  >
                    Report a Problem
                  </Button>
                </div>
              </form>
            </div>

            {/* Combined Section: "Development works near you" with compact stats + max 3 cards */}
            <div className="citizen-works-section">
              {/* Section Header & Compact Inline Statistics */}
              <div className="citizen-works-header">
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
                    Development works near you
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Sanctioned public projects in {currentConstituency}
                  </span>
                </div>

                {/* Compact Statistics (Inline Chips / 2x2 grid on mobile) */}
                <div className="citizen-stats-group">
                  <div style={{ background: "var(--bg-surface-subtle)", border: "1px solid var(--border-light)", padding: "4px 10px", borderRadius: "var(--radius-xs)", fontSize: "0.74rem" }}>
                    Total: <strong style={{ color: "var(--gov-primary)" }}>{totalWorksCount}</strong>
                  </div>
                  <div style={{ background: "var(--status-info-bg)", border: "1px solid var(--status-info-border)", padding: "4px 10px", borderRadius: "var(--radius-xs)", fontSize: "0.74rem" }}>
                    Ongoing: <strong style={{ color: "var(--gov-accent)" }}>{ongoingWorksCount}</strong>
                  </div>
                  <div style={{ background: "var(--status-success-bg)", border: "1px solid var(--status-success-border)", padding: "4px 10px", borderRadius: "var(--radius-xs)", fontSize: "0.74rem" }}>
                    Completed: <strong style={{ color: "var(--status-success-text)" }}>{completedWorksCount}</strong>
                  </div>
                  <div style={{ background: "var(--status-danger-bg)", border: "1px solid var(--status-danger-border)", padding: "4px 10px", borderRadius: "var(--radius-xs)", fontSize: "0.74rem" }}>
                    Delayed: <strong style={{ color: "var(--status-danger-text)" }}>{delayedWorksCount}</strong>
                  </div>
                </div>
              </div>

              {/* Project Cards Grid (3 Columns on Desktop, Single-column on Mobile) */}
              <div className="citizen-works-grid">
                {displayWorks.slice(0, 3).map((work) => {
                  const sanctioned = work.sanctionedAmt || work.recommendedAmt || 0;
                  const spent = work.expenditureAmt || 0;
                  const progress = work.physicalProgress || 0;

                  return (
                    <div
                      key={work.id}
                      style={{
                        background: "var(--bg-surface-subtle)",
                        borderRadius: "var(--radius-xs)",
                        border: "1px solid var(--border-light)",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        boxSizing: "border-box"
                      }}
                    >
                      <div>
                        {/* Type & Status */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "4px" }}>
                          <span className="gov-badge gov-badge-neutral" style={{ fontSize: "0.66rem" }}>
                            {work.sectorName || work.category || "Public Project"}
                          </span>
                          {getWorkStatusBadge(work.status)}
                        </div>

                        {/* Title */}
                        <h4 style={{ fontSize: "0.94rem", fontWeight: 700, color: "var(--gov-primary)", margin: "0 0 6px 0", lineHeight: 1.35, wordBreak: "break-word" }}>
                          {work.title}
                        </h4>

                        {/* Location */}
                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "12px" }}>
                          <MapPin size={12} color="var(--gov-accent)" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {work.constituency}, {work.district}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700, marginBottom: "4px" }}>
                            <span>Progress</span>
                            <span style={{ color: "var(--gov-accent)" }}>{progress}%</span>
                          </div>
                          <div style={{ width: "100%", height: "6px", background: "var(--border-light)", borderRadius: "3px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${Math.min(100, progress)}%`,
                                height: "100%",
                                background: work.status === "Completed" ? "var(--status-success-text)" : (work.status === "Delayed" ? "var(--status-warning-text)" : "var(--gov-accent)"),
                                borderRadius: "3px"
                              }}
                            />
                          </div>
                        </div>

                        {/* Financials & Target Date */}
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "6px", marginBottom: "12px" }}>
                          <span>Sanctioned: <strong>₹{sanctioned.toFixed(2)} Cr</strong></span>
                          <span>Spent: <strong>₹{spent.toFixed(2)} Cr</strong></span>
                          <span>Target: <strong>{work.targetCompletion || "2025-03-31"}</strong></span>
                        </div>
                      </div>

                      {/* Single Clean Action */}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedWork(work)}
                        style={{ width: "100%", fontSize: "0.76rem", minHeight: "36px" }}
                      >
                        View Details
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* View All Works Footer Action */}
              <div style={{ textAlign: "center", paddingTop: "4px" }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab("find_works")}
                  icon={<ArrowRight size={14} />}
                  style={{ width: "100%", maxWidth: "340px", minHeight: "36px" }}
                >
                  View all works in {currentConstituency} ({totalWorksCount})
                </Button>
              </div>
            </div>

            {/* Compact Recent Reports Section */}
            <div className="citizen-recent-reports-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <h3 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0 }}>
                    Recent Problem Reports
                  </h3>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                    Latest updates on citizen reported infrastructure issues
                  </span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab("my_reports")}
                  icon={<ArrowRight size={13} />}
                >
                  View all ({issues.length})
                </Button>
              </div>

              {recentReports.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px 10px", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  No problem reports submitted yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {recentReports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setActiveTab("my_reports")}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "var(--radius-xs)",
                        border: "1px solid var(--border-light)",
                        background: "var(--bg-surface-subtle)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                        boxSizing: "border-box"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-surface-subtle)"}
                    >
                      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--gov-primary)" }}>
                            #{report.id}
                          </span>
                          <span style={{ fontSize: "0.70rem", color: "var(--text-muted)" }}>
                            &bull; {report.locationName} &bull; {report.dateSubmitted}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--text-main)", wordBreak: "break-word" }}>
                          {report.title}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        {getReportStageBadge(report)}
                        <ChevronRight size={15} color="var(--text-muted)" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FIND WORKS VIEW */}
        {/* ========================================================================= */}
        {activeTab === "find_works" && (
          <CitizenProjectSearch
            works={displayWorks}
            onSelectWork={(work) => setSelectedWork(work)}
            currentConstituency={currentConstituency}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MY REPORTS VIEW */}
        {/* ========================================================================= */}
        {activeTab === "my_reports" && (
          <IssueTracker
            issues={issues}
            onOpenReportModal={handleOpenGeneralReport}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 4: NOTIFICATIONS VIEW */}
        {/* ========================================================================= */}
        {activeTab === "notifications" && (
          <CitizenNotifications />
        )}

      </main>

      {/* ========================================================================= */}
      {/* CITIZEN MODALS */}
      {/* ========================================================================= */}

      {/* 1. Report a Problem Modal */}
      <SubmitIssueModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmitted={handleIssueSubmitted}
        initialWork={reportTargetWork}
        worksList={displayWorks}
        currentConstituency={currentConstituency}
      />

      {/* 2. Public Work Details Modal (includes "Report a Problem with this Work") */}
      <CitizenWorkDetailModal
        work={selectedWork}
        onClose={() => setSelectedWork(null)}
        onReportProblem={handleOpenReportWithWork}
      />

      {/* 3. Guidelines & Policy Modal */}
      <PolicyModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
      />

      {/* 4. Stakeholder Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        initialRole={targetLoginRole}
      />

      {/* Clean Public Service Footer */}
      <CitizenFooter onOpenPolicy={() => setIsPolicyOpen(true)} />
    </div>
  );
};

export default CitizenDashboard;
