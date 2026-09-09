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
import "./styles/Compare.css";
import "./styles/Dashboard.css";
import "./styles/civicTheme.css";
import "./styles/ProjectDetailModal.css";
import "./styles/ProjectListing.css";
import "./styles/PaymentDetailsModal.css";
import "./styles/ResponsiveTable.css";
import "./styles/Report.css";
import "./styles/TrackArea.css";
import "./styles/Admin.css";
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
