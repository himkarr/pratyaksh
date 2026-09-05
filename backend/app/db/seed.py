import uuid
from datetime import datetime, date, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, text
from ..db.session import SessionLocal, engine
from ..core.security import hash_password
from ..models import (
    Role, User, MPConstituencyMapping, StateNodalMapping, ImplementingAgency,
    AgencyUser, ProhibitedCategory, SystemConfig, CitizenTrustScore
)

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

        print("--- Seeding Completed Successfully! ---")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
