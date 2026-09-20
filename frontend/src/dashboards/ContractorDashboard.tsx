import React, { useState, useEffect } from "react";
import { 
  Building2, 
  RefreshCw 
} from "lucide-react";
import { Header } from "../components/Header";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PolicyModal } from "../components/PolicyModal";
import { LoginModal } from "../components/LoginModal";

import { usePreferences } from "../context/PreferencesContext";
import { useRole, Role } from "../auth/roleContext";

import { 
  ContractorProfile, 
  ContractorProject, 
  ContractorNotification,
  DEFAULT_CONTRACTOR_PROFILE 
} from "../data/contractorData";
import { contractorApi } from "../api/contractorApi";

import { ContractorHeaderBanner } from "../components/contractor/ContractorHeaderBanner";
import { ContractorSummaryCards } from "../components/contractor/ContractorSummaryCards";
import { ContractorProjectTable } from "../components/contractor/ContractorProjectTable";
import { ContractorProjectDetail } from "../components/contractor/ContractorProjectDetail";
import { ContractorNotificationsModal } from "../components/contractor/ContractorNotifications";

export const ContractorDashboard: React.FC = () => {
  const { user } = useRole();
  const { fontScale, setFontScale, theme, setTheme, lang, setLang, t } = usePreferences();

  // Helper to extract active vendor ID from authenticated user
  const getActiveVendorId = (): string => {
    if (user && user.role === "contractor" && user.id) {
      if (user.id.startsWith("USR-")) {
        return user.id.replace("USR-", "");
      }
      return user.id;
    }
    return "VEN-HR-GGM-01";
  };

  // Selected Vendor Identity state
  const [selectedVendorId, setSelectedVendorId] = useState<string>(getActiveVendorId);

  // Sync selected vendor ID whenever logged-in contractor user changes
  useEffect(() => {
    const currentVendorId = getActiveVendorId();
    setSelectedVendorId(currentVendorId);
    setSelectedProject(null);
  }, [user.id, user.role]);

  // Contractor Data State
  const [profile, setProfile] = useState<ContractorProfile>(DEFAULT_CONTRACTOR_PROFILE);
  const [projects, setProjects] = useState<ContractorProject[]>([]);
  const [notifications, setNotifications] = useState<ContractorNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Selected Project (if viewing detail page)
  const [selectedProject, setSelectedProject] = useState<ContractorProject | null>(null);

  // Modals & Overlay state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [targetLoginRole, setTargetLoginRole] = useState<Role | undefined>(undefined);

  // Fetch Contractor Data whenever selectedVendorId changes
  useEffect(() => {
    async function loadContractorData() {
      setIsLoading(true);
      try {
        const [profData, projData, notifData] = await Promise.all([
          contractorApi.getContractorProfile(selectedVendorId),
          contractorApi.getContractorProjects(selectedVendorId),
          contractorApi.getContractorNotifications()
        ]);
        setProfile(profData);
        setProjects(projData);
        setNotifications(notifData);
      } catch (err) {
        console.error("Failed to load contractor portal data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadContractorData();
  }, [selectedVendorId]);

  const handleVendorIdChange = (newVendorId: string) => {
    setSelectedVendorId(newVendorId);
    setSelectedProject(null); // Return to project table overview
  };

  // Handler when contractor updates or confirms project details
  const handleUpdateProject = (updatedProject: ContractorProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    if (selectedProject && selectedProject.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }
  };

  // Handler when contractor submits stage evidence
  const handleSubmitStageEvidence = async (
    workId: string, 
    stageId: string, 
    payload: any
  ) => {
    try {
      const { project: updatedProj } = await contractorApi.submitStageEvidence(workId, stageId, payload);
      handleUpdateProject(updatedProj);
      // Reload notifications & project list
      const [notifs, refreshedProjects] = await Promise.all([
        contractorApi.getNotifications(),
        contractorApi.getContractorProjects(selectedVendorId)
      ]);
      setNotifications(notifs);
      setProjects(refreshedProjects);
    } catch (err) {
      console.error("Error submitting stage evidence:", err);
    }
  };

  const handleRequestCompletionCertificate = async (workId: string, remarks: string) => {
    try {
      const updatedProj = await contractorApi.requestCompletionCertificate(workId, remarks);
      handleUpdateProject(updatedProj);
      const [notifs, refreshedProjects] = await Promise.all([
        contractorApi.getNotifications(),
        contractorApi.getContractorProjects(selectedVendorId)
      ]);
      setNotifications(notifs);
      setProjects(refreshedProjects);
    } catch (err) {
      console.error("Error requesting completion certificate:", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    await contractorApi.markNotificationsRead();
    const updatedNotifs = await contractorApi.getNotifications();
    setNotifications(updatedNotifs);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-page)" }}>
      {/* 1. Official Header & Navigation */}
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
        flagCount={projects.filter(p => p.riskIndicator === "Delay Risk" || p.riskIndicator === "Critical Delay").length}
        selectedVendorId={selectedVendorId}
        onSelectVendorId={handleVendorIdChange}
      />

      {/* 2. Main Portal Container */}
      <main className="mplads-main" style={{ flex: 1, padding: "2rem 0 4rem" }}>
        <div className="mplads-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
          {/* Contractor Header Banner displaying active vendor details */}
          <ContractorHeaderBanner
            profile={profile}
            notifications={notifications}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            assignedProjectCount={projects.length}
          />

          {isLoading ? (
            <div className="civic-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              <RefreshCw size={36} color="var(--gov-primary)" className="spin" style={{ margin: "0 auto 12px auto" }} />
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Loading Contractor Portal Workspace for {profile.agencyName}...</div>
            </div>
          ) : (
            <div key={selectedProject ? selectedProject.id : "table-view"} className="view-transition-container">
              {selectedProject ? (
                /* CONTRACTOR PROJECT DETAIL VIEW */
                <ContractorProjectDetail
                  project={selectedProject}
                  onBack={() => setSelectedProject(null)}
                  onSubmitStageEvidence={handleSubmitStageEvidence}
                  onRequestCompletionCertificate={handleRequestCompletionCertificate}
                />
              ) : (
                /* CONTRACTOR DASHBOARD MAIN VIEW */
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* KPI Summary Cards */}
                  <ContractorSummaryCards projects={projects} />

                  {/* My Assigned Works Table */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-light)", paddingBottom: "8px" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--gov-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        <Building2 size={18} />
                        My Assigned Works & Monitoring Portal — {profile.agencyName} ({projects.length})
                      </h3>
                    </div>

                    <ContractorProjectTable
                      projects={projects}
                      onSelectProject={(proj) => setSelectedProject(proj)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Notifications Modal */}
      <ContractorNotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onSelectProject={(workId) => {
          const found = projects.find(p => p.id === workId);
          if (found) setSelectedProject(found);
        }}
      />

      {/* Policy & Login Modals */}
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

      {/* Footer */}
      <Footer t={t} onOpenPolicy={() => setIsPolicyOpen(true)} />
    </div>
  );
};

export default ContractorDashboard;
