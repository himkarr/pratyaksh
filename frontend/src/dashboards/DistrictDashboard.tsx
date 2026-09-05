/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: DistrictDashboard (District Authority / Collectorate Perspective)
 * ============================================================================
 * 
 * ROLE CONTEXT:
 * - Scoped to District Planning Officers & District Magistrates.
 * - Focuses on granting administrative sanctions, verifying geotagged site milestone
 *   photographs, releasing milestone tranches, and enforcing vendor delivery.
 */

import React from 'react';
import { Dashboard } from "./Dashboard";

export const DistrictDashboard = () => <Dashboard title="District Authority / DM Dashboard" />;
export default DistrictDashboard;
