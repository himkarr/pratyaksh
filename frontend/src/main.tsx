/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * MODULE: main.tsx (Application Bootstrap & Stakeholder Dashboard Router)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * Root entrypoint of the React application. Integrates PWA Service Worker registration,
 * Network Connection Status banner, PreferencesProvider (Theme/Font/Lang), RoleProvider RBAC,
 * ErrorBoundary fault-tolerance, and dynamic stakeholder dashboard routing.
 */

import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles/reference-app.css";
import "./styles/Layout.css";
import "./styles/Navigation.css";
import "./styles/StateCard.css";
import "./styles/StateCardList.css";
import "./styles/MPCard.css";
import "./styles/StateList.css";
import "./styles/StateDetail.css";
import "./styles/MPList.css";
import "./styles/MPDetail.css";
import "./styles/ProjectDetail.css";
import "./styles/Compare.css";
import "./styles/Dashboard.css";
import "./styles/civicTheme.css";
import "./styles/ProjectDetailModal.css";
import "./styles/ProjectListing.css";
import "./styles/PaymentDetailsModal.css";
import "./styles/ResponsiveTable.css";
import "./styles/WorksDirectory.css";
import "./styles/ProjectGroups.css";
import "./styles/Report.css";
import "./styles/TrackArea.css";
import "./styles/Admin.css";
import "./style.css";
import { PreferencesProvider } from "./context/PreferencesContext";
import { RoleProvider, useRole } from "./auth/roleContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NetworkStatusBanner } from "./components/NetworkStatusBanner";

// Lazy-load dashboard routes for instant initial page loading & optimal bundle chunking
const LoginPage = React.lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const CitizenDashboard = React.lazy(() => import("./dashboards/CitizenDashboard").then(m => ({ default: m.CitizenDashboard })));
const MPDashboard = React.lazy(() => import("./dashboards/MPDashboard").then(m => ({ default: m.MPDashboard })));
const ContractorDashboard = React.lazy(() => import("./dashboards/ContractorDashboard").then(m => ({ default: m.ContractorDashboard })));
const FieldOfficerDashboard = React.lazy(() => import("./dashboards/FieldOfficerDashboard").then(m => ({ default: m.FieldOfficerDashboard })));
const DistrictDashboard = React.lazy(() => import("./dashboards/DistrictDashboard").then(m => ({ default: m.DistrictDashboard })));
const StateNodalDashboard = React.lazy(() => import("./dashboards/StateNodalDashboard").then(m => ({ default: m.StateNodalDashboard })));
const MinistryDashboard = React.lazy(() => import("./dashboards/MinistryDashboard").then(m => ({ default: m.MinistryDashboard })));

function DashboardLoader() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-page, #f8fafc)",
      color: "var(--gov-primary, #0a2540)",
      fontFamily: "Outfit, system-ui, sans-serif",
      gap: "16px"
    }}>
      <div style={{
        width: "48px",
        height: "48px",
        border: "4px solid rgba(10, 37, 64, 0.15)",
        borderTopColor: "var(--gov-primary, #0a2540)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <div style={{ fontSize: "0.92rem", fontWeight: 700, letterSpacing: "0.4px" }}>
        Loading Official Workspace...
      </div>
    </div>
  );
}

function AppContent() {
  const { user, isAuthenticated, setRole } = useRole();

  if (!isAuthenticated) {
    return (
      <React.Suspense fallback={<DashboardLoader />}>
        <LoginPage />
      </React.Suspense>
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
      case "citizen":
        return <CitizenDashboard />;
      case "mp":
        return <MPDashboard />;
      case "contractor":
        return <ContractorDashboard />;
      case "field_officer":
        return <FieldOfficerDashboard />;
      case "district":
        return <DistrictDashboard />;
      case "state_nodal":
        return <StateNodalDashboard />;
      case "ministry":
      default:
        return <MinistryDashboard />;
    }
  };

  return (
    <ErrorBoundary key={user.role} activeRole={user.role} onSelectRole={setRole}>
      <React.Suspense fallback={<DashboardLoader />}>
        {renderDashboard()}
      </React.Suspense>
    </ErrorBoundary>
  );
}

function RootApp() {
  useEffect(() => {
    // Register PWA Service Worker for offline shell caching
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        console.log("Pratyaksh PWA Service Worker registered:", reg.scope);
      }).catch((err) => {
        console.warn("Service Worker registration failed:", err);
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <PreferencesProvider>
        <RoleProvider>
          <AppContent />
        </RoleProvider>
      </PreferencesProvider>
    </ErrorBoundary>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<RootApp />);
}
