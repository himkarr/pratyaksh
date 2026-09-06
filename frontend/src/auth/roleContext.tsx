/**
 * ============================================================================
 * MPLAD Aqua - Role Context & Authentication Provider (RBAC)
 * ============================================================================
 * 
 * Purpose:
 * Manages active stakeholder identity, permissions, and JWT token state.
 * Supports 4 distinct government oversight roles:
 *  1. 'mp': Member of Parliament (Constituency scope, e.g. AST-01 / Pune)
 *  2. 'district': District Authority / DM (District execution scope)
 *  3. 'state_nodal': State Nodal Department (Statewide governance scope)
 *  4. 'ministry': Central Ministry MoSPI (National scope + Cryptographic Audit)
 * 
 * Demo Features:
 * - Instant Role Switching without manual relogin for demo evaluation.
 * - Offline fallback matching against synthetic sample users in `contracts/sample-data/`.
 */

import React, { createContext, useContext, useState } from "react";
import sampleUsers from "../../../contracts/sample-data/sample_users.json";
import { apiClient, mapBackendRoleToFrontendRole } from "../api/client";

export type Role =
  | "citizen"
  | "mp"
  | "contractor"
  | "field_officer"
  | "district"
  | "state_nodal"
  | "ministry";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  constituency?: string;
  constituency_code?: string;
  state?: string;
  district?: string;
}

const ALL_ROLES_DEFAULT_USERS: User[] = [
  {
    id: "usr-citizen-01",
    email: "citizen.pune@gmail.com",
    name: "Rajesh Kumar (Citizen)",
    role: "citizen",
    state: "Maharashtra",
    district: "Pune"
  },
  {
    id: "usr-mp-01",
    email: "mp.pune@sansad.nic.in",
    name: "Hon. MP - Pune Constituency",
    role: "mp",
    constituency_code: "AST-01",
    state: "Maharashtra",
    district: "Pune"
  },
  {
    id: "usr-contractor-01",
    email: "contractor.infra@agency.gov.in",
    name: "Maharashtra State PWD Contractor",
    role: "contractor",
    state: "Maharashtra",
    district: "Pune"
  },
  {
    id: "usr-field-01",
    email: "field.pune@nic.in",
    name: "Senior Field Inspection Officer",
    role: "field_officer",
    state: "Maharashtra",
    district: "Pune"
  },
  {
    id: "usr-district-01",
    email: "dm.pune@maharashtra.gov.in",
    name: "District Collector / DM Pune",
    role: "district",
    state: "Maharashtra",
    district: "Pune"
  },
  {
    id: "usr-state-01",
    email: "nodal.planning@maharashtra.gov.in",
    name: "State Nodal Department - Maharashtra",
    role: "state_nodal",
    state: "Maharashtra"
  },
  {
    id: "usr-ministry-01",
    email: "admin.mospi@gov.in",
    name: "Apex MoSPI Administrator",
    role: "ministry"
  }
];

const DEFAULT_USERS: User[] = [
  ...ALL_ROLES_DEFAULT_USERS,
  ...(sampleUsers as any[])
];

interface RoleContextType {
  user: User;
  token?: string;
  isAuthenticated: boolean;
  setRole: (role: Role) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  showLogin: () => void;
}


const RoleContext = createContext<RoleContextType>({
  user: DEFAULT_USERS[0],
  isAuthenticated: false,
  setRole: () => undefined,
  login: async () => undefined,
  logout: () => undefined,
  showLogin: () => undefined
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(DEFAULT_USERS[0]);
  const [token, setToken] = useState<string | undefined>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  /**
   * Authenticates user against backend POST /auth/login.
   * If the backend is running, stores the live JWT Bearer token in state.
   * If running offline, seamlessly falls back to synthetic catalog matching.
   */
  const login = async (email: string, password: string) => {
    try {
      const data = await apiClient.login(email, password);
      setToken(data.access_token);
      const frontendRole = mapBackendRoleToFrontendRole(data.user?.role);
      const matched = DEFAULT_USERS.find(item => item.role === frontendRole) || {
        id: data.user?.user_id || "usr-live",
        email: data.user?.email || email,
        name: data.user?.name || email.split("@")[0].toUpperCase(),
        role: frontendRole,
        district: data.user?.district || undefined,
        state: data.user?.state || undefined
      };
      setUser(matched);
      setIsAuthenticated(true);
    } catch {
      // Offline fallback: match user from synthetic catalog
      const matched = DEFAULT_USERS.find(item => item.email.toLowerCase() === email.toLowerCase()) ||
                      DEFAULT_USERS.find(item => item.role === 'ministry') ||
                      DEFAULT_USERS[0];
      setUser(matched);
      setIsAuthenticated(true);
    }
  };

  /**
   * Instant Role Switcher helper (for demo and jury presentations).
   */
  const setRole = (role: Role) => {
    const matched = DEFAULT_USERS.find(item => item.role === role) || DEFAULT_USERS[0];
    setUser(matched);
  };

  /**
   * Clears active token and resets to default unauthenticated state.
   */
  const logout = () => {
    setToken(undefined);
    setIsAuthenticated(false);
  };

  const showLogin = () => {
    setIsAuthenticated(false);
  };

  return (
    <RoleContext.Provider value={{ user, token, isAuthenticated, login, logout, setRole, showLogin }}>
      {children}
    </RoleContext.Provider>
  );
}

/**
 * Custom hook to access role context anywhere in the component tree
 */
export const useRole = () => useContext(RoleContext);
export default useRole;
