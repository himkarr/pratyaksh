/**
 * ============================================================================
 * NATIONAL MPLADS DECISION SUPPORT SYSTEM (SIH26102)
 * MODULE: api/types.ts (Strongly Typed Schema Contracts)
 * ============================================================================
 * 
 * Purpose:
 * TypeScript interfaces matching backend SQLAlchemy models & FastAPI response schemas.
 */

export interface UserProfileResponse {
  user_id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  role_id: string;
  district?: string | null;
  state?: string | null;
  status: string;
  aadhaar_verified: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: UserProfileResponse;
  role?: string;
}

export interface DemoUser {
  user_id: string;
  name: string;
  email: string;
  role: string;
  district?: string | null;
  state?: string | null;
  default_password: string;
}

export interface PublicProject {
  project_id: string;
  project_name: string;
  description?: string | null;
  category: string;
  status: string;
  progress_percentage: number;
  district: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  start_date?: string | null;
  expected_completion_date?: string | null;
  citizen_reports_count: number;
  citizen_confirmed_count: number;
}

export interface BackendProject {
  project_id: string;
  project_name: string;
  description?: string | null;
  category: string;
  recommendation_id?: string | null;
  mp_id: string;
  mp_name?: string | null;
  sanctioned_amount: number;
  released_amount: number;
  utilized_amount: number;
  tender_reference_no?: string | null;
  implementing_agency_id?: string | null;
  implementing_agency_name?: string | null;
  sc_st_beneficiary_flag: boolean;
  status: string;
  progress_percentage: number;
  is_flagged: boolean;
  latest_risk_score: number;
  district: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  start_date?: string | null;
  expected_completion_date?: string | null;
  actual_completion_date?: string | null;
  created_at: string;
}

export interface ProjectStatusHistoryItem {
  previous_status: string;
  new_status: string;
  reason: string;
  changed_at: string;
}

export interface BackendProjectDetail extends BackendProject {
  risk_details?: any;
  status_history: ProjectStatusHistoryItem[];
}

export interface RecommendationItem {
  recommendation_id: string;
  mp_id: string;
  mp_name: string;
  recommended_amount: number;
  recommendation_date: string;
  status: string;
  project_id?: string | null;
  project_name?: string | null;
  category?: string | null;
  recommendation_letter_url?: string | null;
}

export interface CreateRecommendationPayload {
  project_name: string;
  description: string;
  category: string;
  recommended_amount: number;
  district?: string;
  state?: string;
  is_outside_constituency?: boolean;
  outside_limit_category?: string;
  sc_st_beneficiary_flag?: boolean;
  recommendation_letter_url?: string;
}

export interface ActionRecommendationPayload {
  action: "Accepted" | "Rejected";
  remarks?: string;
  sanctioned_amount?: number;
  tender_reference_no?: string;
  implementing_agency_id?: string;
}

export interface VerificationItem {
  verification_id: string;
  project_id: string;
  project_name: string;
  district: string;
  state: string;
  category: string;
  assigned_officer_id?: string | null;
  assigned_officer_name?: string | null;
  priority_level: string;
  status: string;
  site_visit_date?: string | null;
  verification_report?: string | null;
  gps_lat?: number | null;
  gps_long?: number | null;
  assigned_at: string;
  completed_at?: string | null;
}

export interface CreateVerificationPayload {
  project_id: string;
  assigned_officer_id?: string;
  priority_level?: string;
  site_visit_date?: string;
  instructions?: string;
}

export interface CompleteVerificationPayload {
  verification_report: string;
  gps_lat: number;
  gps_long: number;
  site_visit_date?: string;
  checklist?: any;
  evidence_ids?: string[];
}

export interface EvidenceItem {
  evidence_id: string;
  project_id: string;
  uploaded_by: string;
  uploader_name?: string;
  uploader_role?: string;
  evidence_type: string;
  evidence_category: string;
  file_url: string;
  thumbnail_url?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_geotagged: boolean;
  duplicate_flag: boolean;
  authenticity_score: number;
  status: string;
  remarks?: string | null;
  uploaded_at: string;
}

export interface UploadEvidencePayload {
  project_id: string;
  latitude: number;
  longitude: number;
  evidence_type?: string;
  evidence_category?: string;
  remarks?: string;
  file: File;
}

export interface NotificationItem {
  notification_id: string;
  channel: string;
  title: string;
  message: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface FlagItem {
  id: string;
  project_id: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  reason: string;
  origin: string;
  created_at?: string | null;
}

export interface AuditLogItem {
  log_id: string;
  user_id?: string | null;
  user_name?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_value?: any;
  new_value?: any;
  prev_hash?: string | null;
  this_hash?: string | null;
  ip_address?: string | null;
  timestamp: string;
}

export interface AuditVerifyResponse {
  valid: boolean;
  event_count: number;
  broken_event_id?: string | null;
}

export interface DashboardResponse {
  role: string;
  projects: BackendProject[];
  flags: FlagItem[];
  summary: {
    project_count: number;
    flag_count: number;
  };
}

export interface MpRecommendationSummary {
  mp_id: string;
  total_recommendations: number;
  total_recommended_amount: number;
  status_counts: Record<string, number>;
}

export interface MpStatusSummary {
  total_projects: number;
  flagged_projects: number;
  financial_summary: {
    total_sanctioned: number;
    total_released: number;
    total_utilized: number;
    utilization_rate_percentage: number;
  };
  status_breakdown: Record<string, number>;
}

export interface DistrictSummaryItem {
  district: string;
  state: string;
  total_projects: number;
  flagged_projects: number;
  total_sanctioned: number;
  total_utilized: number;
  status_counts: Record<string, number>;
}

export interface VendorProjectSummaryItem {
  project_id: string;
  project_name: string;
  status: string;
  progress_percentage: number;
  sanctioned_amount: number;
  released_amount: number;
  utilized_amount: number;
  latest_halt_reason?: string | null;
}

export interface VendorProcurementDetailItem {
  procurement_id: string;
  project_id: string;
  project_name: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  purchase_date: string;
  remarks?: string | null;
}

export interface SCSTComplianceResponse {
  mp_id: string;
  financial_year: string;
  total_recommended: number;
  sc_allocated: number;
  st_allocated: number;
  sc_percentage: number;
  st_percentage: number;
  compliance_status: "Compliant" | "NonCompliant";
}
