/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * MODULE: main.tsx (Application Bootstrap & Stakeholder Dashboard Router)
 * ============================================================================
 * 
 * DOMAIN CONTEXT & PURPOSE:
 * -------------------------
 * This is the root entrypoint of the React application. It wraps the entire component
 * tree with `RoleProvider` (Role-Based Access Control) and dynamically routes users
 * to their respective stakeholder dashboard view based on authenticated perspective:
 * 
 * - `mp`           -> MPDashboard (Constituency Recommendation & Local Progress)
 * - `district`     -> DistrictDashboard (Sanctions, Milestone Verification & Fund Releases)
 * - `state_nodal`  -> StateNodalDashboard (Cross-District Progress & State Compliance)
 * - `ministry`     -> MinistryDashboard (Apex MoSPI Oversight, AI Anomaly Review & Hash Ledger)
 */

import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { RoleProvider, useRole } from "./auth/roleContext";
import { MPDashboard } from "./dashboards/MPDashboard";
import { StateNodalDashboard } from "./dashboards/StateNodalDashboard";
import { DistrictDashboard } from "./dashboards/DistrictDashboard";
import { MinistryDashboard } from "./dashboards/MinistryDashboard";

function App() {
  const { user } = useRole();

  switch (user.role) {
    case "mp":
      return <MPDashboard />;
    case "district":
      return <DistrictDashboard />;
    case "state_nodal":
      return <StateNodalDashboard />;
    default:
      return <MinistryDashboard />;
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <RoleProvider>
      <App />
    </RoleProvider>
  );
}
