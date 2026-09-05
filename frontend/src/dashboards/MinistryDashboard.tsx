/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: MinistryDashboard (Ministry of Statistics & Programme Implementation)
 * ============================================================================
 * 
 * ROLE CONTEXT:
 * - Scoped to the Central Ministry (MoSPI Apex Administration).
 * - Focuses on national fund allocations, central AI anomaly & fraud detection signals,
 *   PFMS single-nodal account synchronizations, and tamper-evident SHA-256 audit ledger verification.
 */

import React from 'react';
import { Dashboard } from "./Dashboard";

export const MinistryDashboard = () => <Dashboard title="Ministry of Statistics (MoSPI) Dashboard" />;
export default MinistryDashboard;
