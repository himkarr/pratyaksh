import json
import uuid
from datetime import datetime, date, timedelta, timezone
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import select, text
from ..db.session import SessionLocal, engine
from ..core.security import hash_password
from ..models import (
    Role, User, MPConstituencyMapping, StateNodalMapping, ImplementingAgency,
    AgencyUser, ProhibitedCategory, SystemConfig, CitizenTrustScore,
    Recommendation, Project, ProjectStatusHistory, ProjectMilestone,
    ProjectFinancial, PaymentTransaction, ProjectProcurementRecord, Evidence,
    EvidenceModerationQueue, VerificationRequest, VerificationEvidenceLink,
    RuleEngineLog, RiskScore, AIAnalysisResult, SCSTAllocationTracker,
    Notification, AuditLog, ModelVersion, FundTransfer, SupportingDocumentsLink,
)
from ..services.analysis_service import analyze_project
from ..services.audit_service import record_audit_event

# Known demo credentials for fast live demo
DEMO_PASSWORD = "demo1234"
DEMO_PASSWORD_HASH = hash_password(DEMO_PASSWORD)

DEMO_ROLES = [
    {"name": "Citizen", "id": uuid.UUID("70962d01-4091-47d2-9ad2-bab83151efc9")},
    {"name": "Vendor", "id": uuid.UUID("03f123e8-2497-4560-a430-52b05ab9f3ea")},
    {"name": "FieldOfficer", "id": uuid.UUID("456d6eb1-8ef1-4c31-a724-ec237f902302")},
    {"name": "DistrictAuthority", "id": uuid.UUID("be0d319f-bce2-44d1-880f-d097594add7f")},
    {"name": "StateNodalAuthority", "id": uuid.UUID("576a0831-dee9-486c-bd3f-b4e844e838a7")},
    {"name": "MinistryUser", "id": uuid.UUID("28c37254-3b5d-47f4-9048-3bd8cfcc6769")},
    {"name": "MPUser", "id": uuid.UUID("d26ac9bf-1c4c-472a-9bd6-0c762643ff31")},
    {"name": "Admin", "id": uuid.UUID("60bbc4d8-9582-4650-9ff2-4876793b6ef6")}
]

# Fixed UUIDs for predictable testing
MP_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
DISTRICT_USER_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
STATE_USER_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")
MINISTRY_USER_ID = uuid.UUID("44444444-4444-4444-4444-444444444444")
FIELD_USER_ID = uuid.UUID("55555555-5555-5555-5555-555555555555")
VENDOR_USER_ID = uuid.UUID("66666666-6666-6666-6666-666666666666")
CITIZEN_USER_ID = uuid.UUID("77777777-7777-7777-7777-777777777777")
ADMIN_USER_ID = uuid.UUID("88888888-8888-8888-8888-888888888888")

AGENCY_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CONSTITUENCY_MAP_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
SEED_NAMESPACE = uuid.UUID("9d8ce821-4e2e-4ce4-8e99-eb6350336a6f")


def stable_uuid(name: str) -> uuid.UUID:
    return uuid.uuid5(SEED_NAMESPACE, name)


def parse_status(raw_status: str) -> str:
    status = (raw_status or "").strip().lower()
    if status == "completed":
        return "Completed"
    if status == "delayed":
        return "Delayed"
    if status in ("in_progress", "inprogress", "ongoing"):
        return "InProgress"
    if status == "cancelled":
        return "Cancelled"
    if status == "proposed":
        return "Proposed"
    return "Sanctioned"


def seed_operational_and_ml_data(db: Session) -> None:
    """Seed cross-module records so frontend, backend and AI/ML flows share real DB data."""
    repo_root = Path(__file__).resolve().parents[3]
    projects_path = repo_root / "contracts" / "sample-data" / "sample_projects.json"
    flags_path = repo_root / "contracts" / "sample-data" / "sample_flags.json"

    if not projects_path.exists():
        return

    sample_projects = json.loads(projects_path.read_text(encoding="utf-8"))
    sample_flags = json.loads(flags_path.read_text(encoding="utf-8")) if flags_path.exists() else []
    flags_by_project = {f.get("project_id"): f for f in sample_flags}

    seeded_project_ids: list[uuid.UUID] = []
    seeded_evidence_ids: list[uuid.UUID] = []

    for idx, item in enumerate(sample_projects):
        source_id = item.get("id", f"SAMPLE-{idx + 1}")
        rec_id = stable_uuid(f"recommendation:{source_id}")
        project_id = stable_uuid(f"project:{source_id}")
        milestone_id = stable_uuid(f"milestone:{source_id}")
        evidence_id = stable_uuid(f"evidence:{source_id}")
        verification_id = stable_uuid(f"verification:{source_id}")
        seeded_project_ids.append(project_id)
        seeded_evidence_ids.append(evidence_id)

        state = item.get("state") or "Uttar Pradesh"
        district = item.get("district") or "Varanasi"
        if idx < 3:
            state = "Uttar Pradesh"
            district = "Varanasi"

        sanctioned = float(item.get("sanctioned_amount") or 0.0)
        utilized = float(item.get("utilized_amount") or 0.0)
        progress = int(item.get("physical_progress_percent") or 0)
        project_status = parse_status(item.get("status", "Sanctioned"))
        sanction_date = date.fromisoformat(item.get("sanction_date")) if item.get("sanction_date") else date.today()
        expected_date = date.fromisoformat(item.get("expected_completion_date")) if item.get("expected_completion_date") else sanction_date + timedelta(days=365)
        actual_completion = date.fromisoformat(item["actual_completion_date"]) if item.get("actual_completion_date") else None

        existing_rec = db.execute(
            select(Recommendation).where(Recommendation.recommendation_id == rec_id)
        ).scalar_one_or_none()
        if not existing_rec:
            db.add(
                Recommendation(
                    recommendation_id=rec_id,
                    mp_id=MP_USER_ID,
                    project_id=project_id,
                    recommendation_letter_url=f"https://docs.sapphire.gov.in/recommendations/{source_id}.pdf",
                    recommended_amount=max(sanctioned, 1000000.0),
                    recommendation_date=sanction_date,
                    district_authority_ack_id=DISTRICT_USER_ID,
                    status="Accepted",
                )
            )

        existing_project = db.execute(
            select(Project).where(Project.project_id == project_id)
        ).scalar_one_or_none()
        if not existing_project:
            db.add(
                Project(
                    project_id=project_id,
                    project_name=item.get("title") or f"MPLADS Work {source_id}",
                    description=f"Imported from sample dataset ({source_id})",
                    category=item.get("category") or "Community Infrastructure",
                    recommendation_id=rec_id,
                    mp_id=MP_USER_ID,
                    constituency_id=CONSTITUENCY_MAP_ID,
                    is_outside_constituency=False,
                    outside_limit_category="within_limit",
                    sanctioned_amount=max(sanctioned, 1000000.0),
                    released_amount=max(sanctioned, 1000000.0),
                    utilized_amount=max(utilized, 0.0),
                    tender_reference_no=f"TND-{source_id}",
                    implementing_agency_id=AGENCY_ID,
                    sc_st_beneficiary_flag=idx % 2 == 0,
                    status=project_status,
                    progress_percentage=max(0, min(progress, 100)),
                    is_flagged=False,
                    latitude=25.3176 + idx * 0.01,
                    longitude=82.9739 + idx * 0.01,
                    address=f"Project Zone {idx + 1}, {district}",
                    district=district,
                    state=state,
                    start_date=sanction_date,
                    expected_completion_date=expected_date,
                    actual_completion_date=actual_completion,
                    created_by=DISTRICT_USER_ID,
                    latest_risk_score=0.0,
                )
            )

        if not db.execute(select(ProjectStatusHistory).where(ProjectStatusHistory.history_id == stable_uuid(f"history:{source_id}"))).scalar_one_or_none():
            db.add(
                ProjectStatusHistory(
                    history_id=stable_uuid(f"history:{source_id}"),
                    project_id=project_id,
                    previous_status="Proposed",
                    new_status=project_status,
                    reason="Initial seeded status for integrated demo",
                    changed_by=DISTRICT_USER_ID,
                    expected_resume_date=expected_date,
                )
            )

        if not db.execute(select(ProjectMilestone).where(ProjectMilestone.milestone_id == milestone_id)).scalar_one_or_none():
            db.add(
                ProjectMilestone(
                    milestone_id=milestone_id,
                    project_id=project_id,
                    milestone_name="Execution Milestone 1",
                    expected_percentage=max(20, min(progress, 100)),
                    evidence_id=evidence_id,
                    verified=progress >= 40,
                    verified_by=DISTRICT_USER_ID if progress >= 40 else None,
                    verified_at=datetime.now(timezone.utc) if progress >= 40 else None,
                )
            )

        if not db.execute(select(ProjectFinancial).where(ProjectFinancial.financial_id == stable_uuid(f"financial:{source_id}"))).scalar_one_or_none():
            db.add(
                ProjectFinancial(
                    financial_id=stable_uuid(f"financial:{source_id}"),
                    project_id=project_id,
                    installment_no=1,
                    amount_released=max(sanctioned, 1000000.0),
                    release_date=sanction_date,
                    amount_utilized=max(utilized, 0.0),
                    utilization_date=date.today(),
                    balance=max(sanctioned - utilized, 0.0),
                    remarks="Seeded from integrated sample contracts",
                )
            )

        if not db.execute(select(PaymentTransaction).where(PaymentTransaction.transaction_id == stable_uuid(f"payment:{source_id}"))).scalar_one_or_none():
            db.add(
                PaymentTransaction(
                    transaction_id=stable_uuid(f"payment:{source_id}"),
                    project_id=project_id,
                    implementing_agency_id=AGENCY_ID,
                    amount=max(utilized, sanctioned * 0.3 if sanctioned else 300000.0),
                    payment_mode="NEFT",
                    cheque_or_utr_no=f"UTR-{source_id}",
                    payment_date=date.today(),
                    linked_milestone_id=milestone_id,
                    anomaly_flag=(project_status == "Delayed"),
                )
            )

        if not db.execute(select(ProjectProcurementRecord).where(ProjectProcurementRecord.procurement_id == stable_uuid(f"procurement:{source_id}"))).scalar_one_or_none():
            db.add(
                ProjectProcurementRecord(
                    procurement_id=stable_uuid(f"procurement:{source_id}"),
                    project_id=project_id,
                    vendor_user_id=VENDOR_USER_ID,
                    item_name="Construction Material Kit",
                    item_description=f"Procurement for {item.get('title') or source_id}",
                    quantity=10.0,
                    unit="Unit",
                    unit_price=50000.0,
                    total_amount=500000.0,
                    purchase_date=date.today(),
                    linked_milestone_id=milestone_id,
                    remarks="Seed procurement record",
                )
            )

        if not db.execute(select(Evidence).where(Evidence.evidence_id == evidence_id)).scalar_one_or_none():
            db.add(
                Evidence(
                    evidence_id=evidence_id,
                    project_id=project_id,
                    uploaded_by=VENDOR_USER_ID if idx % 2 == 0 else CITIZEN_USER_ID,
                    evidence_type="photo",
                    evidence_category="site_photo",
                    file_url=f"https://storage.sapphire.gov.in/evidence/{source_id}.jpg",
                    thumbnail_url=f"https://storage.sapphire.gov.in/evidence/{source_id}_thumb.jpg",
                    latitude=25.3176 + idx * 0.01,
                    longitude=82.9739 + idx * 0.01,
                    captured_at=datetime.now(timezone.utc),
                    remarks="Seeded geotagged evidence",
                    is_geotagged=True,
                    device_info={"device": "android", "app": "mplads-mobile"},
                    duplicate_flag=False,
                    authenticity_score=0.95,
                    status="Verified" if idx % 2 == 0 else "Pending",
                )
            )

        if idx == 0 and not db.execute(select(EvidenceModerationQueue).where(EvidenceModerationQueue.moderation_id == stable_uuid("moderation:seed"))).scalar_one_or_none():
            db.add(
                EvidenceModerationQueue(
                    moderation_id=stable_uuid("moderation:seed"),
                    evidence_id=evidence_id,
                    flagged_reason="Random moderation sample",
                    moderator_id=ADMIN_USER_ID,
                    decision="Approved",
                    decided_at=datetime.now(timezone.utc),
                )
            )

        if not db.execute(select(VerificationRequest).where(VerificationRequest.verification_id == verification_id)).scalar_one_or_none():
            db.add(
                VerificationRequest(
                    verification_id=verification_id,
                    project_id=project_id,
                    assigned_officer_id=FIELD_USER_ID,
                    assigned_by=DISTRICT_USER_ID,
                    priority_level="High" if project_status == "Delayed" else "Medium",
                    status="Completed" if idx == 0 else "Assigned",
                    site_visit_date=date.today(),
                    verification_report="Seeded field verification baseline",
                    gps_lat=25.3176 + idx * 0.01,
                    gps_long=82.9739 + idx * 0.01,
                    synced_at=datetime.now(timezone.utc),
                    completed_at=datetime.now(timezone.utc) if idx == 0 else None,
                )
            )

        if idx == 0 and not db.execute(select(VerificationEvidenceLink).where(VerificationEvidenceLink.link_id == stable_uuid("verification-link:seed"))).scalar_one_or_none():
            db.add(
                VerificationEvidenceLink(
                    link_id=stable_uuid("verification-link:seed"),
                    verification_id=verification_id,
                    evidence_id=evidence_id,
                )
            )

        if not db.execute(select(SupportingDocumentsLink).where(SupportingDocumentsLink.link_id == stable_uuid(f"supporting:{source_id}"))).scalar_one_or_none():
            db.add(
                SupportingDocumentsLink(
                    link_id=stable_uuid(f"supporting:{source_id}"),
                    entity_type="project",
                    entity_id=project_id,
                    evidence_id=evidence_id,
                    added_by=VENDOR_USER_ID,
                )
            )

        sample_flag = flags_by_project.get(source_id)
        ai_id = stable_uuid(f"ai-result:{source_id}")
        if not db.execute(select(AIAnalysisResult).where(AIAnalysisResult.analysis_id == ai_id)).scalar_one_or_none():
            db.add(
                AIAnalysisResult(
                    analysis_id=ai_id,
                    project_id=project_id,
                    evidence_id=evidence_id,
                    anomaly_detected=bool(sample_flag),
                    anomaly_type=(sample_flag or {}).get("category", "statistical_review"),
                    image_analysis_result={"source": "seed", "score": 0.88},
                    duplicate_detection_result={"duplicate": False},
                    progress_estimation_percentage=max(0, min(progress, 100)),
                    confidence_score=float((sample_flag or {}).get("confidence", 0.72)),
                    model_version="mplads_isolation_forest",
                    analyzed_at=datetime.now(timezone.utc),
                )
            )

    db.commit()

    for pid in seeded_project_ids:
        has_risk = db.execute(select(RiskScore).where(RiskScore.project_id == pid)).scalars().first()
        has_rule = db.execute(select(RuleEngineLog).where(RuleEngineLog.project_id == pid)).scalars().first()
        if has_risk and has_rule:
            continue
        try:
            analyze_project(db=db, project_id=pid, actor_id=ADMIN_USER_ID)
        except Exception:
            db.rollback()

    if not db.execute(select(SCSTAllocationTracker).where(SCSTAllocationTracker.tracker_id == stable_uuid("scst:2026"))).scalar_one_or_none():
        db.add(
            SCSTAllocationTracker(
                tracker_id=stable_uuid("scst:2026"),
                mp_id=MP_USER_ID,
                financial_year="2026-27",
                total_recommended=25000000.0,
                sc_allocated=4000000.0,
                st_allocated=2200000.0,
                compliance_status="Compliant",
            )
        )

    notif_rows = [
        (MP_USER_ID, "Recommendation Accepted", "Your seeded recommendations are now active projects."),
        (DISTRICT_USER_ID, "Verification Queue Updated", "Field verification queue has been initialized with real sample data."),
        (FIELD_USER_ID, "Field Visit Assigned", "You have seeded verification assignments pending review."),
        (MINISTRY_USER_ID, "AI/ML Seed Complete", "Risk and AI analysis records were generated from integrated sample data."),
    ]
    for idx, (uid, title, message) in enumerate(notif_rows):
        notif_id = stable_uuid(f"notification:{idx}")
        if not db.execute(select(Notification).where(Notification.notification_id == notif_id)).scalar_one_or_none():
            db.add(
                Notification(
                    notification_id=notif_id,
                    user_id=uid,
                    channel="in-app",
                    title=title,
                    message=message,
                    related_entity_type="seed",
                    related_entity_id=seeded_project_ids[0] if seeded_project_ids else None,
                    is_read=False,
                )
            )

    if not db.execute(select(ModelVersion).where(ModelVersion.model_id == stable_uuid("model:iforest-v1"))).scalar_one_or_none():
        db.add(
            ModelVersion(
                model_id=stable_uuid("model:iforest-v1"),
                model_name="mplads_isolation_forest",
                version="v1.0-seeded",
                status="active",
                performance_metrics={"precision": 0.91, "recall": 0.87, "auc_roc": 0.93},
            )
        )

    if len(seeded_project_ids) >= 2 and not db.execute(select(FundTransfer).where(FundTransfer.transfer_id == stable_uuid("fund-transfer:seed"))).scalar_one_or_none():
        db.add(
            FundTransfer(
                transfer_id=stable_uuid("fund-transfer:seed"),
                source_project_id=seeded_project_ids[0],
                destination_project_id=seeded_project_ids[1],
                amount=150000.0,
                reason="Seeded inter-project balancing transfer for compliance tests",
                requested_by=DISTRICT_USER_ID,
                approved_by=STATE_USER_ID,
                status="Approved",
                decided_at=datetime.now(timezone.utc),
            )
        )

    db.commit()

    if not db.execute(select(AuditLog).limit(1)).scalar_one_or_none():
        record_audit_event(
            db=db,
            action="SEED_DATABASE_INITIALIZED",
            entity_type="system",
            entity_id=None,
            user_id=ADMIN_USER_ID,
            new_value={"message": "Initial integrated seed completed"},
        )

def seed_database():
    db: Session = SessionLocal()
    try:
        print("--- Seeding Roles (Verifying) ---")
        for r in DEMO_ROLES:
            existing = db.execute(select(Role).where(Role.role_name == r["name"])).scalar_one_or_none()
            if not existing:
                role = Role(role_id=r["id"], role_name=r["name"], permissions={"scope": r["name"].lower()})
                db.add(role)
        db.commit()

        print("--- Seeding Implementing Agency ---")
        existing_agency = db.execute(select(ImplementingAgency).where(ImplementingAgency.agency_id == AGENCY_ID)).scalar_one_or_none()
        if not existing_agency:
            agency = ImplementingAgency(
                agency_id=AGENCY_ID,
                agency_name="National Infrastructure & Works Corp (NIWC)",
                agency_type="GovtDept",
                registration_number="REG-GOV-2024-0918",
                bank_account_masked="SBI-XXXX-XXXX-4912",
                verified_by_admin=True
            )
            db.add(agency)
            db.commit()

        print("--- Seeding 8 Demo Users ---")
        users_config = [
            {
                "user_id": MP_USER_ID,
                "name": "Dr. Rajesh Sharma (MP)",
                "email": "mp@sapphire.gov.in",
                "phone": "+919811111111",
                "role_id": uuid.UUID("d26ac9bf-1c4c-472a-9bd6-0c762643ff31"),
                "state": "Uttar Pradesh",
                "district": "Varanasi",
                "constituency_id": None
            },
            {
                "user_id": DISTRICT_USER_ID,
                "name": "Shri Amit Verma (District Collector / DM)",
                "email": "district@sapphire.gov.in",
                "phone": "+919822222222",
                "role_id": uuid.UUID("be0d319f-bce2-44d1-880f-d097594add7f"),
                "state": "Uttar Pradesh",
                "district": "Varanasi",
                "constituency_id": None
            },
            {
                "user_id": STATE_USER_ID,
                "name": "Smt. Sunita Rao (State Nodal Officer)",
                "email": "statenodal@sapphire.gov.in",
                "phone": "+919833333333",
                "role_id": uuid.UUID("576a0831-dee9-486c-bd3f-b4e844e838a7"),
                "state": "Uttar Pradesh",
                "district": None,
                "constituency_id": None
            },
            {
                "user_id": MINISTRY_USER_ID,
                "name": "MoSPI Apex Auditor (Joint Secretary DIID)",
                "email": "ministry@sapphire.gov.in",
                "phone": "+919844444444",
                "role_id": uuid.UUID("28c37254-3b5d-47f4-9048-3bd8cfcc6769"),
                "state": None,
                "district": None,
                "constituency_id": None
            },
            {
                "user_id": FIELD_USER_ID,
                "name": "Vikram Singh (Field Inspection Officer)",
                "email": "fieldofficer@sapphire.gov.in",
                "phone": "+919855555555",
                "role_id": uuid.UUID("456d6eb1-8ef1-4c31-a724-ec237f902302"),
                "state": "Uttar Pradesh",
                "district": "Varanasi",
                "constituency_id": None
            },
            {
                "user_id": VENDOR_USER_ID,
                "name": "Pawan Gupta (Authorized Vendor Representative)",
                "email": "vendor@sapphire.gov.in",
                "phone": "+919866666666",
                "role_id": uuid.UUID("03f123e8-2497-4560-a430-52b05ab9f3ea"),
                "state": "Uttar Pradesh",
                "district": "Varanasi",
                "constituency_id": None
            },
            {
                "user_id": CITIZEN_USER_ID,
                "name": "Aarav Patel (Resident Citizen)",
                "email": "citizen@sapphire.gov.in",
                "phone": "+919877777777",
                "role_id": uuid.UUID("70962d01-4091-47d2-9ad2-bab83151efc9"),
                "state": "Uttar Pradesh",
                "district": "Varanasi",
                "constituency_id": None
            },
            {
                "user_id": ADMIN_USER_ID,
                "name": "System Administrator",
                "email": "admin@sapphire.gov.in",
                "phone": "+919888888888",
                "role_id": uuid.UUID("60bbc4d8-9582-4650-9ff2-4876793b6ef6"),
                "state": None,
                "district": None,
                "constituency_id": None
            }
        ]

        for u in users_config:
            existing_user = db.execute(select(User).where(User.email == u["email"])).scalar_one_or_none()
            if not existing_user:
                user = User(
                    user_id=u["user_id"],
                    name=u["name"],
                    email=u["email"],
                    phone=u["phone"],
                    password_hash=DEMO_PASSWORD_HASH,
                    role_id=u["role_id"],
                    status="active",
                    state=u["state"],
                    district=u["district"],
                    constituency_id=u["constituency_id"],
                    aadhaar_verified=True
                )
                db.add(user)
                print(f"Created user: {u['email']}")
        db.commit()

        # Link Vendor to Agency
        existing_agency_user = db.execute(select(AgencyUser).where(AgencyUser.user_id == VENDOR_USER_ID)).scalar_one_or_none()
        if not existing_agency_user:
            au = AgencyUser(
                agency_id=AGENCY_ID,
                user_id=VENDOR_USER_ID,
                is_primary_contact=True
            )
            db.add(au)
            db.commit()

        # Seed MP Constituency Mapping
        existing_map = db.execute(select(MPConstituencyMapping).where(MPConstituencyMapping.mapping_id == CONSTITUENCY_MAP_ID)).scalar_one_or_none()
        if not existing_map:
            mapping = MPConstituencyMapping(
                mapping_id=CONSTITUENCY_MAP_ID,
                mp_id=MP_USER_ID,
                constituency_name="Varanasi (Lok Sabha)",
                state="Uttar Pradesh",
                district="Varanasi",
                term_start=date(2024, 6, 1),
                term_end=date(2029, 5, 31),
                boundary_geojson={"type": "Point", "coordinates": [82.9739, 25.3176]}
            )
            db.add(mapping)
            db.commit()
            db.execute(text("UPDATE users SET constituency_id = :cid WHERE user_id = :uid"), {"cid": CONSTITUENCY_MAP_ID, "uid": MP_USER_ID})
            db.commit()

        # Seed State Nodal Mapping
        existing_nodal = db.execute(select(StateNodalMapping).where(StateNodalMapping.officer_id == STATE_USER_ID)).scalar_one_or_none()
        if not existing_nodal:
            snm = StateNodalMapping(
                officer_id=STATE_USER_ID,
                state="Uttar Pradesh",
                term_start=date(2024, 1, 1),
                term_end=date(2027, 12, 31)
            )
            db.add(snm)
            db.commit()

        # Seed Citizen Trust Score
        existing_trust = db.execute(select(CitizenTrustScore).where(CitizenTrustScore.citizen_id == CITIZEN_USER_ID)).scalar_one_or_none()
        if not existing_trust:
            cts = CitizenTrustScore(
                citizen_id=CITIZEN_USER_ID,
                trust_score=75.0,
                verified_submissions_count=3,
                rejected_false_reports_count=0,
                gps_timestamp_consistency_score=0.95,
                image_authenticity_score=0.98,
                independent_corroboration_score=0.90
            )
            db.add(cts)
            db.commit()

        print("--- Seeding Prohibited Categories (MPLADS Guidelines) ---")
        prohibited_list = [
            ("Religious Places & Places of Worship", "MPLADS Guidelines 2023 Clause 5.1(a)"),
            ("Office and Residential Buildings for Public Servants", "MPLADS Guidelines 2023 Clause 5.1(b)"),
            ("Commercial / Private Enterprises Assets", "MPLADS Guidelines 2023 Clause 5.1(c)"),
            ("Memorial Statues and Naming of Assets", "MPLADS Guidelines 2023 Clause 5.1(d)"),
            ("Grants / Loans to Political Parties or Individuals", "MPLADS Guidelines 2023 Clause 5.1(e)"),
            ("Acquisition of Land or Purchase of Private Property", "MPLADS Guidelines 2023 Clause 5.1(f)")
        ]
        for name, ref in prohibited_list:
            existing_cat = db.execute(select(ProhibitedCategory).where(ProhibitedCategory.category_name == name)).scalar_one_or_none()
            if not existing_cat:
                cat = ProhibitedCategory(
                    category_name=name,
                    guideline_reference=ref,
                    is_active=True
                )
                db.add(cat)
        db.commit()

        print("--- Seeding System Config ---")
        configs = [
            ("risk_priority_threshold", {"threshold": 65.0, "unit": "percentage", "description": "Projects with risk score >= 65 are flagged high priority"}),
            ("tender_cost_threshold", {"threshold": 5000000.0, "currency": "INR", "description": "Works above 50 Lakhs require mandatory tender reference"}),
            ("sc_allocation_mandate_percent", {"percent": 15.0, "description": "Mandatory 15% allocation for Scheduled Caste inhabited areas"}),
            ("st_allocation_mandate_percent", {"percent": 7.5, "description": "Mandatory 7.5% allocation for Scheduled Tribe inhabited areas"}),
            ("gem_price_deviation_threshold_percent", {"percent": 25.0, "description": "Procurement items priced >25% above GeM benchmark are flagged"}),
            ("completion_deadline_days", {"days": 365, "description": "Statutory completion deadline is 1 year from sanction date"})
        ]
        for key, val in configs:
            existing_cfg = db.execute(select(SystemConfig).where(SystemConfig.config_key == key)).scalar_one_or_none()
            if not existing_cfg:
                cfg = SystemConfig(
                    config_key=key,
                    config_value=val,
                    updated_by=ADMIN_USER_ID
                )
                db.add(cfg)
        db.commit()

        print("--- Seeding Operational + AI/ML Tables ---")
        seed_operational_and_ml_data(db)

        print("--- Seeding Completed Successfully! ---")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
