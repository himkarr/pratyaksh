/**
 * ============================================================================
 * MPLADS Decision Support System - Role Context & Authentication Provider (RBAC)
 * ============================================================================
 * 
 * Purpose:
 * Manages active stakeholder identity, permissions, and JWT token state.
 * Supports distinct government oversight roles:
 *  1. 'mp': Member of Parliament (Constituency scope, e.g. Rohtak, Varanasi)
 *  2. 'citizen': Citizen (Constituency / District scope)
 *  3. 'district': District Authority / DM (District execution scope)
 *  4. 'state_nodal': State Nodal Department (Statewide governance scope)
 *  5. 'contractor': Contractor / Implementing Agency
 *  6. 'field_officer': Field Inspection Officer
 *  7. 'ministry': Central Ministry MoSPI (National scope + Cryptographic Audit)
 */

import React, { createContext, useContext, useState } from "react";
import sampleUsers from "../../../contracts/sample-data/sample_users.json";
import { apiClient } from "../api/client";

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

export const ALL_ROLES_DEFAULT_USERS: User[] = [
  // MP Stakeholders (3 official MPs across Haryana, UP, and Maharashtra)
  {
    id: "usr-mp-rohtak",
    email: "mp.rohtak@nirikshak.gov.in",
    name: "Shri Deepender Singh Hooda",
    role: "mp",
    constituency: "Rohtak",
    constituency_code: "HR-ROH-01",
    state: "Haryana",
    district: "Rohtak"
  },
  {
    id: "usr-mp-varanasi",
    email: "mp.varanasi@nirikshak.gov.in",
    name: "Shri Narendra Modi",
    role: "mp",
    constituency: "Varanasi",
    constituency_code: "UP-VAR-01",
    state: "Uttar Pradesh",
    district: "Varanasi"
  },
  {
    id: "usr-mp-pune",
    email: "mp.pune@nirikshak.gov.in",
    name: "Shri Murlidhar Mohol",
    role: "mp",
    constituency: "Pune",
    constituency_code: "MH-PUN-01",
    state: "Maharashtra",
    district: "Pune"
  },

  // Citizens
  {
    id: "usr-citizen-rohtak-01",
    email: "rajesh.sharma@nirikshak.gov.in",
    name: "Rajesh Kumar Sharma",
    role: "citizen",
    state: "Haryana",
    district: "Rohtak",
    constituency: "Rohtak",
    constituency_code: "HR-ROH-01"
  },
  {
    id: "usr-citizen-rohtak-02",
    email: "vikas.hooda@nirikshak.gov.in",
    name: "Vikas Hooda",
    role: "citizen",
    state: "Haryana",
    district: "Rohtak",
    constituency: "Rohtak",
    constituency_code: "HR-ROH-01"
  },
  {
    id: "usr-citizen-jind-01",
    email: "pooja.rani@nirikshak.gov.in",
    name: "Pooja Rani",
    role: "citizen",
    state: "Haryana",
    district: "Jind",
    constituency: "Jind",
    constituency_code: "HR-JIN-01"
  },
  {
    id: "usr-citizen-jind-02",
    email: "amit.dahiya@nirikshak.gov.in",
    name: "Amit Dahiya",
    role: "citizen",
    state: "Haryana",
    district: "Jind",
    constituency: "Jind",
    constituency_code: "HR-JIN-01"
  },

  // District Authority
  {
    id: "usr-district-rohtak",
    email: "district.rohtak@nirikshak.gov.in",
    name: "Shri Ajay Kumar, IAS (District Magistrate - Rohtak)",
    role: "district",
    state: "Haryana",
    district: "Rohtak",
    constituency: "Rohtak"
  },
  {
    id: "usr-district-01",
    email: "district.gurugram@nirikshak.gov.in",
    name: "Shri Nishant Kumar Yadav, IAS (District Magistrate - Gurugram)",
    role: "district",
    state: "Haryana",
    district: "Gurugram",
    constituency: "Gurugram"
  },

  // State Nodal Officers
  {
    id: "usr-state-01",
    email: "state.haryana@nirikshak.gov.in",
    name: "State Nodal Officer (Haryana Planning & Dev)",
    role: "state_nodal",
    state: "Haryana"
  },
  {
    id: "usr-state-02",
    email: "state.up@nirikshak.gov.in",
    name: "State Nodal Officer (Uttar Pradesh Planning & Dev)",
    role: "state_nodal",
    state: "Uttar Pradesh"
  },

  // Contractors / Implementing Agencies (Synced with Official Supabase Contractors DB)
  {
    id: "2df07d35-4493-4bd4-b7e6-d6a55ea3d80d",
    email: "vendor.sahil.rohtak@contractor.gov.in",
    name: "The Sahil Co-operative Labour and Construction Society Ltd",
    role: "contractor",
    state: "Haryana",
    district: "Rohtak"
  },
  {
    id: "bb2e6047-1b01-44f1-9d8f-9266837807e3",
    email: "vendor.deepak.rohtak@contractor.gov.in",
    name: "Deepak Govt Contractor",
    role: "contractor",
    state: "Haryana",
    district: "Rohtak"
  },
  {
    id: "10d11672-ed12-44e3-872a-7a050fe19149",
    email: "vendor.winpower.gurugram@contractor.gov.in",
    name: "Win Power Construction Co",
    role: "contractor",
    state: "Haryana",
    district: "Gurugram"
  },
  {
    id: "a15337f8-9f87-4c04-bb04-19b4127f963d",
    email: "vendor.lalkripa.gurugram@contractor.gov.in",
    name: "The Lal Kripa Coop L&C Society Ltd",
    role: "contractor",
    state: "Haryana",
    district: "Gurugram"
  },

  // Field Inspection Officer
  {
    id: "usr-field-01",
    email: "field.inspector@nirikshak.gov.in",
    name: "Field Quality Inspection Officer (Er. Rajesh Kumar)",
    role: "field_officer",
    state: "Haryana",
    district: "Rohtak"
  },

  // Ministry MoSPI Apex
  {
    id: "usr-ministry-01",
    email: "admin@nirikshak.gov.in",
    name: "Central Admin (NIC MoSPI)",
    role: "ministry"
  }
];

export const ALL_USERS: User[] = [
  ...ALL_ROLES_DEFAULT_USERS
];

const DEFAULT_USERS: User[] = [
  ...ALL_ROLES_DEFAULT_USERS,
  ...(sampleUsers as any[])
];

export interface RoleContextType {
  user: User;
  token?: string;
  isAuthenticated: boolean;
  setRole: (role: Role, userProfile?: User) => void;
  setUserProfile: (userProfile: User) => void;
  login: (email: string, password: string, userProfile?: User) => Promise<void>;
  logout: () => void;
  showLogin: () => void;
  allUsers: User[];
}

const RoleContext = createContext<RoleContextType>({
  user: ALL_ROLES_DEFAULT_USERS[0],
  isAuthenticated: true,
  setRole: () => undefined,
  setUserProfile: () => undefined,
  login: async () => undefined,
  logout: () => undefined,
  showLogin: () => undefined,
  allUsers: ALL_USERS
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    try {
      const savedUser = localStorage.getItem("mplads_active_user");
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      const savedRole = localStorage.getItem("mplads_active_role") as Role | null;
      if (savedRole) {
        const found = ALL_USERS.find(item => item.role === savedRole);
        if (found) return found;
      }
    } catch {}
    // Default to Ministry or first user
    return ALL_USERS.find(u => u.role === "ministry") || ALL_USERS[0];
  });

  const [token, setToken] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem("mplads_token") || undefined;
    } catch {
      return undefined;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const auth = localStorage.getItem("mplads_authenticated");
      if (auth === "false") return false;
      return true;
    } catch {
      return true;
    }
  });

  /**
   * Authenticates user against backend POST /auth/login or local fallback.
   */
  const login = async (email: string, password: string, userProfile?: User) => {
    if (!password || password.trim().length === 0) {
      throw new Error("Password is required. Please enter official password.");
    }

    if (userProfile) {
      setUser(userProfile);
      setIsAuthenticated(true);
      try {
        localStorage.setItem("mplads_active_role", userProfile.role);
        localStorage.setItem("mplads_active_user", JSON.stringify(userProfile));
        localStorage.setItem("mplads_authenticated", "true");
      } catch {}
      return;
    }

    try {
      const data = await apiClient.login(email, password);
      setToken(data.access_token);
      const matched = ALL_USERS.find(item => item.role === data.role) || {
        id: "usr-live",
        email,
        name: email.split("@")[0].toUpperCase(),
        role: data.role as Role
      };
      setUser(matched);
      setIsAuthenticated(true);
      try {
        localStorage.setItem("mplads_token", data.access_token);
        localStorage.setItem("mplads_active_role", matched.role);
        localStorage.setItem("mplads_active_user", JSON.stringify(matched));
        localStorage.setItem("mplads_authenticated", "true");
      } catch {}
    } catch {
      // Offline fallback: match user by email or role
      const emailLower = email.toLowerCase();
      const matched = ALL_USERS.find(item => item.email.toLowerCase() === emailLower) ||
                      DEFAULT_USERS.find(item => item.email.toLowerCase() === emailLower) ||
                      ALL_USERS.find(item => item.role === 'ministry') ||
                      ALL_USERS[0];
      setUser(matched);
      setIsAuthenticated(true);
      try {
        localStorage.setItem("mplads_active_role", matched.role);
        localStorage.setItem("mplads_active_user", JSON.stringify(matched));
        localStorage.setItem("mplads_authenticated", "true");
      } catch {}
    }
  };

  /**
   * Role and User Profile setter
   */
  const setRole = (role: Role, userProfile?: User) => {
    const matched = userProfile || ALL_USERS.find(item => item.role === role) || ALL_USERS[0];
    setUser(matched);
    setIsAuthenticated(true);
    try {
      localStorage.setItem("mplads_active_role", matched.role);
      localStorage.setItem("mplads_active_user", JSON.stringify(matched));
      localStorage.setItem("mplads_authenticated", "true");
    } catch {}
  };

  const setUserProfile = (userProfile: User) => {
    setUser(userProfile);
    setIsAuthenticated(true);
    try {
      localStorage.setItem("mplads_active_role", userProfile.role);
      localStorage.setItem("mplads_active_user", JSON.stringify(userProfile));
      localStorage.setItem("mplads_authenticated", "true");
    } catch {}
  };

  /**
   * Clears active token and resets to unauthenticated state.
   */
  const logout = () => {
    setToken(undefined);
    setIsAuthenticated(false);
    setUser(ALL_USERS.find(u => u.role === "citizen") || ALL_USERS[0]);
    try {
      localStorage.removeItem("mplads_token");
      localStorage.removeItem("mplads_active_role");
      localStorage.removeItem("mplads_active_user");
      localStorage.setItem("mplads_authenticated", "false");
    } catch {}
  };

  const showLogin = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem("mplads_authenticated", "false");
    } catch {}
  };

  return (
    <RoleContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated, 
      login, 
      logout, 
      setRole, 
      setUserProfile, 
      showLogin, 
      allUsers: ALL_USERS 
    }}>
      {children}
    </RoleContext.Provider>
  );
}

/**
 * Custom hook to access role context anywhere in the component tree
 */
export const useRole = () => useContext(RoleContext);
export default useRole;
