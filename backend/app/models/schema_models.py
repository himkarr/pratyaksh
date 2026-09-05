from datetime import datetime, date
import uuid
from typing import Optional, List, Any
from sqlalchemy import (
    String, Text, Boolean, Integer, Numeric, Date, DateTime, 
    ForeignKey, text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..db.session import Base

# Postgres Custom Enums (create_type=False because they are already created in Supabase DB)
agency_type_enum = ENUM('GovtDept', 'Trust', 'Cooperative', 'NGO', name='agency_type_enum', create_type=False)
user_status_enum = ENUM('active', 'inactive', 'suspended', name='user_status_enum', create_type=False)
project_status_enum = ENUM('Proposed', 'Sanctioned', 'InProgress', 'Completed', 'Delayed', 'Cancelled', name='project_status_enum', create_type=False)
recommendation_status_enum = ENUM('Pending', 'Accepted', 'Rejected', 'Withdrawn', name='recommendation_status_enum', create_type=False)
evidence_type_enum = ENUM('photo', 'video', 'document', name='evidence_type_enum', create_type=False)
evidence_status_enum = ENUM('Pending', 'Verified', 'Rejected', name='evidence_status_enum', create_type=False)
outside_limit_enum = ENUM('within_limit', 'calamity_exception', 'over_limit', name='outside_limit_enum', create_type=False)
payment_mode_enum = ENUM('Cheque', 'NEFT', 'RTGS', 'UPI', name='payment_mode_enum', create_type=False)
verification_priority_enum = ENUM('High', 'Medium', 'Low', name='verification_priority_enum', create_type=False)
verification_status_enum = ENUM('Assigned', 'InProgress', 'Completed', 'Rejected', name='verification_status_enum', create_type=False)
fund_transfer_status_enum = ENUM('Requested', 'Approved', 'Rejected', name='fund_transfer_status_enum', create_type=False)
notification_channel_enum = ENUM('in-app', 'email', 'sms', name='notification_channel_enum', create_type=False)
rule_result_enum = ENUM('Pass', 'Fail', name='rule_result_enum', create_type=False)
rule_type_enum = ENUM('MPLADS_Guideline', 'Geographic_Limit', 'Prohibited_Category', 'Missing_Recommendation', 'SC_ST_Compliance', 'Unauthorized_Fund_Transfer', 'Payment_Without_Tender', 'Financial', 'Business_Logic', name='rule_type_enum', create_type=False)
sc_st_compliance_enum = ENUM('Compliant', 'NonCompliant', name='sc_st_compliance_enum', create_type=False)

# 1. ROLES
class Role(Base):
    __tablename__ = "roles"

    role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    permissions: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    users: Mapped[List["User"]] = relationship("User", back_populates="role")

# 2. USERS
class User(Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("roles.role_id"), nullable=False)
    profile_photo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    aadhaar_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(user_status_enum, default="active", nullable=False)
    constituency_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    device_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    role: Mapped["Role"] = relationship("Role", back_populates="users")

# 3. MP CONSTITUENCY MAPPING
class MPConstituencyMapping(Base):
    __tablename__ = "mp_constituency_mapping"

    mapping_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mp_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    constituency_name: Mapped[str] = mapped_column(String(255), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    term_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    term_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    boundary_geojson: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

# 4. STATE NODAL MAPPING
class StateNodalMapping(Base):
    __tablename__ = "state_nodal_mapping"

    nodal_mapping_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    officer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    term_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    term_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

# 5. IMPLEMENTING AGENCIES
class ImplementingAgency(Base):
    __tablename__ = "implementing_agencies"

    agency_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_name: Mapped[str] = mapped_column(String(255), nullable=False)
    agency_type: Mapped[str] = mapped_column(agency_type_enum, nullable=False)
    registration_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    bank_account_masked: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    verified_by_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

# 6. AGENCY USERS
class AgencyUser(Base):
    __tablename__ = "agency_users"

    agency_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agency_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("implementing_agencies.agency_id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    is_primary_contact: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

# 7. RECOMMENDATIONS
class Recommendation(Base):
    __tablename__ = "recommendations"

    recommendation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mp_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    recommendation_letter_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommended_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    recommendation_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    district_authority_ack_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    status: Mapped[str] = mapped_column(recommendation_status_enum, default="Pending", nullable=False)

# 8. PROJECTS
class Project(Base):
    __tablename__ = "projects"

    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    recommendation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("recommendations.recommendation_id"), nullable=False)
    mp_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    constituency_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    is_outside_constituency: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    outside_limit_category: Mapped[Optional[str]] = mapped_column(outside_limit_enum, default="within_limit", nullable=True)
    sanctioned_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    released_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    utilized_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    tender_reference_no: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    implementing_agency_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("implementing_agencies.agency_id"), nullable=True)
    sc_st_beneficiary_flag: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(project_status_enum, default="Sanctioned", nullable=False)
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expected_completion_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_completion_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    latest_risk_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), default=0.0, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

# 9. PROJECT STATUS HISTORY
class ProjectStatusHistory(Base):
    __tablename__ = "project_status_history"

    history_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.project_id"), nullable=False)
    previous_status: Mapped[str] = mapped_column(project_status_enum, nullable=False)
    new_status: Mapped[str] = mapped_column(project_status_enum, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    expected_resume_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

# 10. PROJECT MILESTONES
class ProjectMilestone(Base):
    __tablename__ = "project_milestones"

    milestone_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.project_id"), nullable=False)
    milestone_name: Mapped[str] = mapped_column(String(255), nullable=False)
    expected_percentage: Mapped[int] = mapped_column(Integer, nullable=False)
    evidence_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verified_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

# 11. PROJECT FINANCIALS
class ProjectFinancial(Base):
    __tablename__ = "project_financials"

    financial_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.project_id"), nullable=False)
    installment_no: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    amount_released: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    release_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    amount_utilized: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    utilization_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    balance: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

# 12. PAYMENT TRANSACTIONS
class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    transaction_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.project_id"), nullable=False)
    implementing_agency_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("implementing_agencies.agency_id"), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    payment_mode: Mapped[str] = mapped_column(payment_mode_enum, default="NEFT", nullable=False)
    cheque_or_utr_no: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payment_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    linked_milestone_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("project_milestones.milestone_id"), nullable=True)
    anomaly_flag: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

# 13. PROJECT PROCUREMENT RECORDS (GeM Benchmarking)
class ProjectProcurementRecord(Base):
    __tablename__ = "project_procurement_records"

    procurement_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.project_id"), nullable=False)
    vendor_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    item_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), default=1.0, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), default="Unit", nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    purchase_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    linked_milestone_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

# 14. EVIDENCE
class Evidence(Base):
    __tablename__ = "evidence"

    evidence_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.project_id"), nullable=False)
    uploaded_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    evidence_type: Mapped[str] = mapped_column(evidence_type_enum, default="photo", nullable=False)
    evidence_category: Mapped[Optional[str]] = mapped_column(String(100), default="WorkProgress", nullable=True)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    captured_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_geotagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    device_info: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    duplicate_flag: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    duplicate_of: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("evidence.evidence_id"), nullable=True)
    authenticity_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), default=1.0, nullable=True)
    status: Mapped[str] = mapped_column(evidence_status_enum, default="Pending", nullable=False)

# 15. EVIDENCE MODERATION QUEUE
class EvidenceModerationQueue(Base):
    __tablename__ = "evidence_moderation_queue"

    moderation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evidence_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("evidence.evidence_id"), nullable=False)
    flagged_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    moderator_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    decision: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

# 16. VERIFICATION REQUESTS
class VerificationRequest(Base):
    __tablename__ = "verification_requests"

    verification_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.project_id"), nullable=False)
    assigned_officer_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    assigned_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    priority_level: Mapped[str] = mapped_column(verification_priority_enum, default="Medium", nullable=False)
    status: Mapped[str] = mapped_column(verification_status_enum, default="Assigned", nullable=False)
    site_visit_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    verification_report: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gps_lat: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    gps_long: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

# 17. VERIFICATION EVIDENCE LINK
class VerificationEvidenceLink(Base):
    __tablename__ = "verification_evidence_link"

    link_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    verification_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("verification_requests.verification_id"), nullable=False)
    evidence_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("evidence.evidence_id"), nullable=False)

# 18. PROHIBITED CATEGORIES
class ProhibitedCategory(Base):
    __tablename__ = "prohibited_categories"

    category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_name: Mapped[str] = mapped_column(String(255), nullable=False)
    guideline_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

# 19. RULE ENGINE LOGS
class RuleEngineLog(Base):
    __tablename__ = "rule_engine_logs"

    rule_log_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.project_id"), nullable=False)
    rule_type: Mapped[str] = mapped_column(rule_type_enum, nullable=False)
    rule_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rule_result: Mapped[str] = mapped_column(rule_result_enum, nullable=False)  # Pass or Fail
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

# 20. RISK SCORES
class RiskScore(Base):
    __tablename__ = "risk_scores"

    risk_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.project_id"), nullable=False)
    risk_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    anomaly_reasons: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    priority_level: Mapped[str] = mapped_column(verification_priority_enum, default="Low", nullable=False)
    recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    model_version: Mapped[Optional[str]] = mapped_column(String(50), default="v1.0-hybrid", nullable=True)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

# 21. AI ANALYSIS RESULTS
class AIAnalysisResult(Base):
    __tablename__ = "ai_analysis_results"

    analysis_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.project_id"), nullable=True)
    evidence_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("evidence.evidence_id"), nullable=True)
    anomaly_detected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    anomaly_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    image_analysis_result: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    duplicate_detection_result: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    progress_estimation_percentage: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    confidence_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    model_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    analyzed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

# 22. CITIZEN TRUST SCORES
class CitizenTrustScore(Base):
    __tablename__ = "citizen_trust_scores"

    trust_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    citizen_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    trust_score: Mapped[float] = mapped_column(Numeric(5, 2), default=50.0, nullable=False)
    verified_submissions_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rejected_false_reports_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    gps_timestamp_consistency_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), default=1.0, nullable=True)
    image_authenticity_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), default=1.0, nullable=True)
    independent_corroboration_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), default=1.0, nullable=True)
    last_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

# 23. SC/ST ALLOCATION TRACKER
class SCSTAllocationTracker(Base):
    __tablename__ = "sc_st_allocation_tracker"

    tracker_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mp_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    financial_year: Mapped[str] = mapped_column(String(20), nullable=False)
    total_recommended: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    sc_allocated: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    st_allocated: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    compliance_status: Mapped[str] = mapped_column(sc_st_compliance_enum, default="Compliant", nullable=False)

# 24. SYSTEM CONFIG
class SystemConfig(Base):
    __tablename__ = "system_config"

    config_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    config_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    config_value: Mapped[dict] = mapped_column(JSONB, nullable=False)
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

# 25. NOTIFICATIONS
class Notification(Base):
    __tablename__ = "notifications"

    notification_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    channel: Mapped[str] = mapped_column(notification_channel_enum, default="in-app", nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    related_entity_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    related_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

# 26. AUDIT LOGS (Hash Chained)
class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    old_value: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    new_value: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

# 27. MODEL VERSIONS
class ModelVersion(Base):
    __tablename__ = "model_versions"

    model_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    deployed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    performance_metrics: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

# 28. FUND TRANSFERS
class FundTransfer(Base):
    __tablename__ = "fund_transfers"

    transfer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.project_id"), nullable=False)
    destination_project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.project_id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    requested_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    status: Mapped[str] = mapped_column(fund_transfer_status_enum, default="Requested", nullable=False)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

# 29. SUPPORTING DOCUMENTS LINK
class SupportingDocumentsLink(Base):
    __tablename__ = "supporting_documents_link"

    link_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    evidence_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("evidence.evidence_id"), nullable=False)
    added_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
