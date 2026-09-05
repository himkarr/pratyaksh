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
import { apiClient } from "../api/client";

export type Role = "mp" | "state_nodal" | "district" | "ministry";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  constituency_code?: string;
  state?: string;
  district?: string;
}

const DEFAULT_USERS: User[] = sampleUsers as User[];

interface RoleContextType {
  user: User;
  token?: string;
  setRole: (role: Role) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType>({
  user: DEFAULT_USERS[0],
  setRole: () => undefined,
  login: async () => undefined,
  logout: () => undefined
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(DEFAULT_USERS[0]);
  const [token, setToken] = useState<string | undefined>();

  /**
   * Authenticates user against backend POST /auth/login.
   * If the backend is running, stores the live JWT Bearer token in state.
   * If running offline, seamlessly falls back to synthetic catalog matching.
   */
  const login = async (email: string, password: string) => {
    try {
      const data = await apiClient.login(email, password);
      setToken(data.access_token);
      const matched = DEFAULT_USERS.find(item => item.role === data.role) || {
        id: "usr-live",
        email,
        name: email.split("@")[0].toUpperCase(),
        role: data.role as Role
      };
      setUser(matched);
    } catch {
      // Offline fallback: match user from synthetic catalog
      const matched = DEFAULT_USERS.find(item => item.email.toLowerCase() === email.toLowerCase()) ||
                      DEFAULT_USERS.find(item => item.role === 'ministry') ||
                      DEFAULT_USERS[0];
      setUser(matched);
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
   * Clears active token and resets to default public session.
   */
  const logout = () => {
    setToken(undefined);
    setUser(DEFAULT_USERS[0]);
  };

  return (
    <RoleContext.Provider value={{ user, token, login, logout, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

/**
 * Custom hook to access role context anywhere in the component tree
 */
export const useRole = () => useContext(RoleContext);
export default useRole;
