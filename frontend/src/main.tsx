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
import "./style.css";
import { PreferencesProvider } from "./context/PreferencesContext";
import { RoleProvider, useRole } from "./auth/roleContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NetworkStatusBanner } from "./components/NetworkStatusBanner";
import { LoginPage } from "./pages/LoginPage";
import { CitizenDashboard } from "./dashboards/CitizenDashboard";
import { MPDashboard } from "./dashboards/MPDashboard";
import { ContractorDashboard } from "./dashboards/ContractorDashboard";
import { FieldOfficerDashboard } from "./dashboards/FieldOfficerDashboard";
import { DistrictDashboard } from "./dashboards/DistrictDashboard";
import { StateNodalDashboard } from "./dashboards/StateNodalDashboard";
import { MinistryDashboard } from "./dashboards/MinistryDashboard";

function AppContent() {
  const { user, isAuthenticated, setRole } = useRole();

  if (!isAuthenticated) {
    return <LoginPage />;
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
    <ErrorBoundary activeRole={user.role} onSelectRole={setRole}>
      {renderDashboard()}
    </ErrorBoundary>
  );
}

function RootApp() {
  useEffect(() => {
    // Register PWA Service Worker for offline shell caching
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        console.log("eSAKSHI PWA Service Worker registered:", reg.scope);
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
