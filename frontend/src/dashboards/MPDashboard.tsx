/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * COMPONENT: MPDashboard (Hon'ble Member of Parliament Constituency Perspective)
 * ============================================================================
 * 
 * ROLE CONTEXT:
 * - Scoped to the individual MP's parliamentary constituency (e.g. Pune, Varanasi, New Delhi).
 * - Focuses on proposing local development works, tracking implementation pace,
 *   and auditing the 1-year linear burn rate ceiling.
 */

import React from 'react';
import { Dashboard } from "./Dashboard";

export const MPDashboard = () => <Dashboard title="Hon'ble MP Constituency Dashboard" />;
export default MPDashboard;

