import type { FlagItem } from "../components/FlagCard";
import type { WorkItem } from "../data/mpladsData";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const ML_API_URL = import.meta.env.VITE_ML_API_URL ?? "http://localhost:8001";

export type FrontendRole =
  | "citizen"
  | "mp"
  | "contractor"
  | "field_officer"
  | "district"
  | "state_nodal"
  | "ministry";

export interface LoginUserProfile {
  user_id: string;
  name: string;
  email: string;
  role: string;
  role_id: string;
  district?: string | null;
  state?: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: LoginUserProfile;
}

export interface DashboardResponse {
  role: string;
  projects: BackendProject[];
  flags: any[];
  summary: {
    project_count: number;
    flag_count: number;
  };
}

export interface AuditVerifyResponse {
  verified: boolean;
  total_records: number;
  broken_at?: string | null;
}

export interface BackendProject {
  project_id: string;
  project_name: string;
  description?: string;
  category?: string;
  sanctioned_amount?: number;
  utilized_amount?: number;
  progress_percentage?: number;
  status?: string;
  district?: string;
  state?: string;
  implementing_agency_name?: string;
  expected_completion_date?: string | null;
  start_date?: string | null;
}

export const mapBackendRoleToFrontendRole = (role?: string): FrontendRole => {
  const normalized = (role ?? "").trim().toLowerCase();
  if (normalized === "mpuser" || normalized === "mp") return "mp";
  if (normalized === "districtauthority" || normalized === "district") return "district";
  if (normalized === "statenodalauthority" || normalized === "state_nodal") return "state_nodal";
  if (normalized === "fieldofficer" || normalized === "field_officer") return "field_officer";
  if (normalized === "vendor" || normalized === "contractor") return "contractor";
  if (normalized === "citizen") return "citizen";
  return "ministry";
};

const normalizeStatus = (status?: string): WorkItem["status"] => {
  const value = (status ?? "").trim().toLowerCase();
  if (value === "completed") return "Completed";
  if (value === "delayed") return "Delayed";
  if (value === "inprogress" || value === "in_progress" || value === "ongoing") return "Ongoing";
  if (value === "proposed" || value === "recommended") return "Recommended";
  return "Sanctioned";
};

const normalizeCategory = (category?: string): string => {
  const value = (category ?? "").toLowerCase();
  if (value.includes("water")) return "water";
  if (value.includes("education") || value.includes("school")) return "education";
  if (value.includes("health")) return "healthcare";
  if (value.includes("road") || value.includes("bridge")) return "roads";
  if (value.includes("solar") || value.includes("energy")) return "solar";
  if (value.includes("sport")) return "sports";
  return "community";
};

export const mapBackendProjectToWorkItem = (project: BackendProject, idx = 0): WorkItem => {
  const sanctionedAmt = Number(((project.sanctioned_amount ?? 0) / 10000000).toFixed(2));
  const expenditureAmt = Number(((project.utilized_amount ?? 0) / 10000000).toFixed(2));
  const progress = Math.max(0, Math.min(100, Number(project.progress_percentage ?? 0)));
  const financialProgress = sanctionedAmt > 0 ? Math.round((expenditureAmt / sanctionedAmt) * 100) : 0;

  return {
    id: project.project_id,
    title: project.project_name,
    house: "Lok Sabha",
    state: project.state || "Unknown",
    district: project.district || "Unknown",
    constituency: project.district || "Constituency",
    constituency_code: project.district || "CONST",
    mpName: "Member of Parliament",
    category: normalizeCategory(project.category),
    sectorName: project.category || "Community Infrastructure",
    recommendedAmt: sanctionedAmt,
    sanctionedAmt,
    expenditureAmt,
    physicalProgress: progress,
    financialProgress,
    dateSanctioned: project.start_date || "",
    targetCompletion: project.expected_completion_date || "",
    status: normalizeStatus(project.status),
    agency: project.implementing_agency_name || "Unassigned",
    contractor: project.implementing_agency_name || "Implementing Agency",
    rating: Number((4.0 + (idx % 5) * 0.1).toFixed(1)),
    reviewsCount: 0,
    attachments: [],
    reviews: []
  };
};

export const mapBackendProjectsToWorkItems = (projects: BackendProject[] = []): WorkItem[] =>
  projects.map((project, idx) => mapBackendProjectToWorkItem(project, idx));

const authHeaders = (token?: string): Record<string, string> =>
  token ? { Authorization: "Bearer " + token } : {};

export const apiClient = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Authentication failed");
    }
    return response.json();
  },

  async getDashboard(role: string, token: string): Promise<DashboardResponse> {
    const response = await fetch(`${API_URL}/dashboard/${role}`, {
      headers: authHeaders(token)
    });
    if (!response.ok) throw new Error("Failed to fetch scoped dashboard data");
    return response.json();
  },

  async getProjects(token?: string): Promise<BackendProject[]> {
    const headers = authHeaders(token);
    const response = await fetch(`${API_URL}/projects`, { headers });
    if (!response.ok) throw new Error("Failed to fetch projects");
    return response.json();
  },

  async getPublicProjects(params?: { state?: string; district?: string; category?: string; search?: string }): Promise<BackendProject[]> {
    const query = new URLSearchParams();
    if (params?.state) query.append("state", params.state);
    if (params?.district) query.append("district", params.district);
    if (params?.category) query.append("category", params.category);
    if (params?.search) query.append("search", params.search);

    const queryString = query.toString();
    const endpoint = queryString ? `${API_URL}/projects/public?${queryString}` : `${API_URL}/projects/public`;
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to fetch public projects");
    return response.json();
  },

  async createRecommendation(data: { project_name: string; description: string; category: string; recommended_amount: number; district?: string; state?: string }, token?: string): Promise<any> {
    const headers = { "Content-Type": "application/json", ...authHeaders(token) };

    const response = await fetch(`${API_URL}/recommendations`, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to submit recommendation");
    return response.json();
  },

  async createVerification(data: { project_id: string; assigned_officer_id?: string; priority_level?: string; instructions?: string }, token?: string): Promise<any> {
    const headers = { "Content-Type": "application/json", ...authHeaders(token) };

    const response = await fetch(`${API_URL}/verifications`, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to create verification task");
    return response.json();
  },

  async completeVerification(verificationId: string, data: { verification_report: string; gps_lat: number; gps_long: number; checklist?: any }, token?: string): Promise<any> {
    const headers = { "Content-Type": "application/json", ...authHeaders(token) };

    const response = await fetch(`${API_URL}/verifications/${verificationId}/complete`, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to submit completion report");
    return response.json();
  },

  async getFlags(token?: string): Promise<any[]> {
    const headers = authHeaders(token);
    const response = await fetch(`${API_URL}/flags`, { headers });
    if (!response.ok) throw new Error("Failed to fetch flags");
    return response.json();
  },

  async getNotifications(token?: string): Promise<any[]> {
    const headers = authHeaders(token);
    const response = await fetch(`${API_URL}/notifications`, { headers });
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return response.json();
  },

  async getAuditTrail(token?: string): Promise<any[]> {
    const headers = authHeaders(token);
    const response = await fetch(`${API_URL}/audit/logs`, { headers });
    if (!response.ok) throw new Error("Failed to fetch audit trail");
    return response.json();
  },

  async verifyAuditTrail(token?: string): Promise<AuditVerifyResponse> {
    const headers = authHeaders(token);
    const response = await fetch(`${API_URL}/audit/verify`, { headers });
    if (!response.ok) throw new Error("Audit verification failed");
    return response.json();
  },

  async retrainModel(token?: string): Promise<any> {
    const headers = authHeaders(token);
    const response = await fetch(`${API_URL}/admin/model-versions`, {
      method: "GET",
      headers
    });
    if (!response.ok) throw new Error("Model status request failed");
    return response.json();
  },

  async predictAnomaly(projectPayload: any): Promise<FlagItem[]> {
    const response = await fetch(`${ML_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectPayload)
    });
    if (!response.ok) throw new Error("ML inference request failed");
    return response.json();
  }
};

export default apiClient;
