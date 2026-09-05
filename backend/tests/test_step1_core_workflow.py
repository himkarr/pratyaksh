import os
import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_core_workflow():
    print("\n==========================================")
    print("TESTING STEP 1: BACKEND CORE WORKFLOW")
    print("==========================================")

    # 1. Health Check
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✓ 1. Health check OK")

    # 2. Login as MP
    mp_login = client.post("/auth/login", json={"email": "mp@sapphire.gov.in", "password": "demo1234"})
    assert mp_login.status_code == 200, f"MP login failed: {mp_login.text}"
    mp_data = mp_login.json()
    mp_token = mp_data["access_token"]
    assert mp_data["user"]["role"] == "MPUser"
    print(f"✓ 2. MP Login successful. Role: {mp_data['user']['role']}")

    # 3. GET /auth/me for MP
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {mp_token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "mp@sapphire.gov.in"
    print("✓ 3. GET /auth/me verified for MP")

    # 4. MP creates Recommendation
    rec_payload = {
        "project_name": "Solar High-Mast Street Lighting System at Rajghat",
        "description": "Installation of 20 high-efficiency solar LED lights along the ghat perimeter",
        "category": "Rural Electrification",
        "recommended_amount": 2500000.0,
        "district": "Varanasi",
        "state": "Uttar Pradesh",
        "is_outside_constituency": False,
        "sc_st_beneficiary_flag": True
    }
    rec_res = client.post("/recommendations", json=rec_payload, headers={"Authorization": f"Bearer {mp_token}"})
    assert rec_res.status_code == 201, f"Recommendation creation failed: {rec_res.text}"
    rec_id = rec_res.json()["recommendation_id"]
    print(f"✓ 4. MP created recommendation #{rec_id[:8]} (₹{rec_payload['recommended_amount']:,.2f})")

    # 5. Login as District Authority
    da_login = client.post("/auth/login", json={"email": "district@sapphire.gov.in", "password": "demo1234"})
    assert da_login.status_code == 200
    da_token = da_login.json()["access_token"]
    print("✓ 5. District Authority logged in successfully")

    # 6. District Authority reviews recommendations
    recs_list = client.get("/recommendations", headers={"Authorization": f"Bearer {da_token}"})
    assert recs_list.status_code == 200
    matching_rec = next((r for r in recs_list.json() if r["recommendation_id"] == rec_id), None)
    assert matching_rec is not None
    assert matching_rec["status"] == "Pending"
    print(f"✓ 6. District Authority found pending recommendation #{rec_id[:8]}")

    # 7. District Authority accepts recommendation (creating project!)
    action_res = client.post(
        f"/recommendations/{rec_id}/action",
        json={
            "action": "Accepted",
            "remarks": "Technical feasibility verified by PWD. Formal sanction granted.",
            "sanctioned_amount": 2500000.0,
            "tender_reference_no": "TND-VARANASI-2026-SOLAR-01"
        },
        headers={"Authorization": f"Bearer {da_token}"}
    )
    assert action_res.status_code == 200, f"Recommendation action failed: {action_res.text}"
    proj_id = action_res.json()["project_id"]
    print(f"✓ 7. Recommendation Accepted -> Project #{proj_id[:8]} successfully created!")

    # 8. Verify Project exists in role-scoped Project List
    proj_res = client.get(f"/projects/{proj_id}", headers={"Authorization": f"Bearer {da_token}"})
    assert proj_res.status_code == 200
    proj_detail = proj_res.json()
    assert proj_detail["status"] == "Sanctioned"
    assert proj_detail["sanctioned_amount"] == 2500000.0
    assert len(proj_detail["status_history"]) >= 1
    print(f"✓ 8. Project detail verified. Status: {proj_detail['status']}, History entries: {len(proj_detail['status_history'])}")

    # 9. Vendor logs in and uploads Evidence
    vendor_login = client.post("/auth/login", json={"email": "vendor@sapphire.gov.in", "password": "demo1234"})
    assert vendor_login.status_code == 200
    vendor_token = vendor_login.json()["access_token"]
    print("✓ 9. Vendor logged in")

    dummy_image = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
    upload_res = client.post(
        "/evidence/upload",
        data={
            "project_id": proj_id,
            "latitude": 25.3176,
            "longitude": 82.9739,
            "evidence_type": "photo",
            "evidence_category": "WorkProgress",
            "remarks": "Foundation excavation completed. Geotag verified on site."
        },
        files={"file": ("foundation_work.jpg", dummy_image, "image/jpeg")},
        headers={"Authorization": f"Bearer {vendor_token}"}
    )
    assert upload_res.status_code == 201, f"Evidence upload failed: {upload_res.text}"
    evidence_id = upload_res.json()["evidence_id"]
    print(f"✓ 10. Geotagged evidence uploaded to Supabase Storage: #{evidence_id[:8]}")

    # 10. District Authority verifies evidence
    verify_res = client.post(
        f"/evidence/{evidence_id}/verify",
        json={"decision": "Verified", "remarks": "Excavation depth matches engineering drawings."},
        headers={"Authorization": f"Bearer {da_token}"}
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "Verified"
    print("✓ 11. Evidence verified by District Authority")

    # 11. District Authority creates Field Verification Visit
    field_login = client.post("/auth/login", json={"email": "fieldofficer@sapphire.gov.in", "password": "demo1234"})
    assert field_login.status_code == 200
    field_user_id = field_login.json()["user"]["user_id"]
    field_token = field_login.json()["access_token"]

    ver_req = client.post(
        "/verifications",
        json={
            "project_id": proj_id,
            "assigned_officer_id": field_user_id,
            "priority_level": "High",
            "instructions": "Inspect solar pole foundation and verify physical presence of signage board."
        },
        headers={"Authorization": f"Bearer {da_token}"}
    )
    assert ver_req.status_code == 201
    ver_id = ver_req.json()["verification_id"]
    print(f"✓ 12. Verification request #{ver_id[:8]} assigned to Field Officer")

    # 12. Field Officer starts and completes inspection
    start_res = client.post(f"/verifications/{ver_id}/start", headers={"Authorization": f"Bearer {field_token}"})
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "InProgress"

    complete_res = client.post(
        f"/verifications/{ver_id}/complete",
        json={
            "verification_report": "Field visit conducted. Site accessible. 20 foundation pits inspected. Signboard with MPLADS logo installed.",
            "gps_lat": 25.3176,
            "gps_long": 82.9739,
            "evidence_ids": [evidence_id]
        },
        headers={"Authorization": f"Bearer {field_token}"}
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "Completed"
    print("✓ 13. Field Officer completed inspection with GPS coordinates and report")

    # 13. Public citizen endpoint check (safe fields only)
    pub_res = client.get("/projects/public")
    assert pub_res.status_code == 200
    pub_projects = pub_res.json()
    assert len(pub_projects) >= 1
    first_pub = pub_projects[0]
    assert "sanctioned_amount" not in first_pub, "Citizen endpoint must NOT leak financial amounts"
    assert "latest_risk_score" not in first_pub, "Citizen endpoint must NOT leak internal risk scores"
    assert "project_name" in first_pub
    assert "district" in first_pub
    print("✓ 14. Public citizen endpoint verified safe (no financial or risk leak)")

    # 14. Verify cryptographic audit hash chain
    audit_res = client.get("/audit/verify", headers={"Authorization": f"Bearer {da_token}"})
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    assert audit_data["verified"] is True, f"Audit verification failed: {audit_data}"
    print(f"✓ 15. Cryptographic SHA-256 Audit Trail verified INTACT ({audit_data['total_records']} blocks linked)")

    print("\n==========================================")
    print(">>> ALL STEP 1 TESTS PASSED PERFECTLY! <<<")
    print("==========================================\n")

if __name__ == "__main__":
    test_full_core_workflow()
