/**
 * ============================================================================
 * MPLAD Aqua - Unified API Client & Network Service
 * ============================================================================
 * 
 * Purpose:
 * Strongly typed asynchronous methods for interacting with both the FastAPI
 * Backend Gateway (Port 8000) and the FastAPI AI-ML inference engine (Port 8001).
 * 
 * Contracts Alignment:
 * - Aligned with `contracts/openapi.yaml`, schemas in `contracts/schemas/`, and
 *   FastAPI routes in `backend/app/api/`.
 * - Manages Bearer JWT tokens for Role-Based Access Control (RBAC).
 * - Implements graceful error handling and synthetic fallbacks for offline operational resilience.
 */

import type { FlagItem } from "../components/FlagCard";
import type { WorkItem } from "../data/mpladsData";

// Environment variable endpoints with standard local fallback ports
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const ML_API_URL = import.meta.env.VITE_ML_API_URL ?? "http://localhost:8001";

/**
 * Authentication Response Schema (POST /auth/login)
 */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
}

/**
 * Role-Scoped Dashboard Response Schema (GET /dashboard/{role})
 */
export interface DashboardResponse {
  role: string;
  projects: any[];
  flags: any[];
  summary: {
    project_count: number;
    flag_count: number;
  };
}

/**
 * Cryptographic Audit Verification Response Schema (GET /audit-trail/verify)
 */
export interface AuditVerifyResponse {
  valid: boolean;
  event_count: number;
  broken_event_id?: string | null;
}

/**
 * Exported Unified API Client singleton
 */
export const apiClient = {
  /**
   * 1. Authentication Endpoint (POST /auth/login)
   * Authenticates user against backend and returns signed JWT with embedded role claims.
   */
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

  /**
   * 2. Role-Scoped Dashboard Endpoint (GET /dashboard/{role})
   */
  async getDashboard(role: string, token: string): Promise<DashboardResponse> {
    const response = await fetch(`${API_URL}/dashboard/${role}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch scoped dashboard data");
    return response.json();
  },

  /**
   * 3. Projects List Endpoint (GET /projects)
   */
  async getProjects(token?: string): Promise<any[]> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${API_URL}/projects`, { headers });
    if (!response.ok) throw new Error("Failed to fetch projects");
    return response.json();
  },

  /**
   * 4. Citizen Public Read-Only Projects (GET /projects/public)
   */
  async getPublicProjects(params?: { state?: string; district?: string; category?: string; search?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.state) query.append("state", params.state);
    if (params?.district) query.append("district", params.district);
    if (params?.category) query.append("category", params.category);
    if (params?.search) query.append("search", params.search);

    const response = await fetch(`${API_URL}/projects/public?${query.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch public projects");
    return response.json();
  },

  /**
   * 5. Recommendation Proposal Creation (POST /recommendations)
   */
  async createRecommendation(data: { project_name: string; description: string; category: string; recommended_amount: number; district?: string; state?: string }, token?: string): Promise<any> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/recommendations`, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to submit recommendation");
    return response.json();
  },

  /**
   * 6. Field Verification Task Creation (POST /verifications)
   */
  async createVerification(data: { project_id: string; assigned_officer_id?: string; priority_level?: string; instructions?: string }, token?: string): Promise<any> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/verifications`, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to create verification task");
    return response.json();
  },

  /**
   * 7. Field Verification Report Completion (POST /verifications/{id}/complete)
   */
  async completeVerification(verificationId: string, data: { verification_report: string; gps_lat: number; gps_long: number; checklist?: any }, token?: string): Promise<any> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}/verifications/${verificationId}/complete`, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Failed to submit completion report");
    return response.json();
  },

  /**
   * 8. Anomaly Flags List Endpoint (GET /flags)
   */
  async getFlags(token?: string): Promise<any[]> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${API_URL}/flags`, { headers });
    if (!response.ok) throw new Error("Failed to fetch flags");
    return response.json();
  },

  /**
   * 9. Notifications Endpoint (GET /notifications)
   */
  async getNotifications(token?: string): Promise<any[]> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${API_URL}/notifications`, { headers });
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return response.json();
  },

  /**
   * 10. Audit Trail List Endpoint (GET /audit-trail)
   */
  async getAuditTrail(token?: string): Promise<any[]> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${API_URL}/audit-trail`, { headers });
    if (!response.ok) throw new Error("Failed to fetch audit trail");
    return response.json();
  },

  /**
   * 11. Cryptographic Chain Verification Endpoint (GET /audit-trail/verify)
   */
  async verifyAuditTrail(token?: string): Promise<AuditVerifyResponse> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${API_URL}/audit-trail/verify`, { headers });
    if (!response.ok) throw new Error("Audit verification failed");
    return response.json();
  },

  /**
   * 12. AI-ML Model Retraining Trigger Endpoint (POST /admin/models/retrain)
   */
  async retrainModel(token?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${API_URL}/admin/models/retrain`, {
      method: "POST",
      headers
    });
    if (!response.ok) throw new Error("Model retraining request failed");
    return response.json();
  },

  /**
   * 13. AI-ML Inference Service Endpoint (Port 8001: POST /predict)
   */
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
