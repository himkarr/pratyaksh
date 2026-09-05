import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_complete_backend_refinement():
    print("\n=======================================================")
    print("TESTING COMPLETE REFINED BACKEND FOR SIH2026 PS26102")
    print("=======================================================")

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    print("[PASS] 1. Health check OK")

    # 2. Authenticate Demo Users
    mp_res = client.post("/auth/login", json={"email": "mp@sapphire.gov.in", "password": "demo1234"})
    assert mp_res.status_code == 200
    mp_token = mp_res.json()["access_token"]
    mp_user_id = mp_res.json()["user"]["user_id"]

    da_res = client.post("/auth/login", json={"email": "district@sapphire.gov.in", "password": "demo1234"})
    assert da_res.status_code == 200
    da_token = da_res.json()["access_token"]

    admin_res = client.post("/auth/login", json={"email": "admin@sapphire.gov.in", "password": "demo1234"})
    assert admin_res.status_code == 200
    admin_token = admin_res.json()["access_token"]

    vendor_res = client.post("/auth/login", json={"email": "vendor@sapphire.gov.in", "password": "demo1234"})
    assert vendor_res.status_code == 200
    vendor_token = vendor_res.json()["access_token"]
    print("[PASS] 2. All 4 demo roles authenticated successfully")

    # 3. Test Prohibited Category Gate (Gap 3)
    prohibited_rec = client.post(
        "/recommendations",
        json={
            "project_name": "Commercial Complex & Shopping Arcade",
            "description": "Construction of private commercial shops",
            "category": "Commercial / Private Enterprises Assets",
            "recommended_amount": 5000000.0
        },
        headers={"Authorization": f"Bearer {mp_token}"}
    )
    assert prohibited_rec.status_code == 400
    assert "non-permissible" in prohibited_rec.json()["detail"].lower()
    print("[PASS] 3. Prohibited category successfully rejected with MPLADS Clause 5.1 reference")

    # 4. Valid Recommendation creation
    valid_rec = client.post(
        "/recommendations",
        json={
            "project_name": "Community Safe Drinking Water RO Plant",
            "description": "Installation of automated water purification plant at Dashashwamedh",
            "category": "Drinking Water Facility",
            "recommended_amount": 6000000.0,  # 60 Lakhs
            "district": "Varanasi",
            "state": "Uttar Pradesh",
            "sc_st_beneficiary_flag": True
        },
        headers={"Authorization": f"Bearer {mp_token}"}
    )
    assert valid_rec.status_code == 201
    rec_id = valid_rec.json()["recommendation_id"]
    print(f"[PASS] 4. Valid recommendation created: #{rec_id[:8]} (₹60.0 Lakhs)")

    # 5. DA Approves Recommendation -> Project Created & Auto-Analyzed (Gap 1)
    action_res = client.post(
        f"/recommendations/{rec_id}/action",
        json={
            "action": "Accepted",
            "remarks": "Approved after administrative verification.",
            "sanctioned_amount": 6000000.0
        },
        headers={"Authorization": f"Bearer {da_token}"}
    )
    assert action_res.status_code == 200
    proj_id = action_res.json()["project_id"]
    print(f"[PASS] 5. Project created and auto-analyzed: #{proj_id[:8]}")

    # 6. Test Explicit Analysis Endpoint & Flag Generation (Gap 1)
    analysis_res = client.post(f"/analysis/project/{proj_id}", headers={"Authorization": f"Bearer {da_token}"})
    assert analysis_res.status_code == 200
    analysis_data = analysis_res.json()
    assert analysis_data["all_rules_evaluated"] >= 5
    print(f"[PASS] 6. Project analysis executed. Risk Score: {analysis_data['risk_score']:.1f}/100, Priority: {analysis_data['priority_level']}")

    # Verify that flags are returned from the flags API
    flags_res = client.get("/flags", headers={"Authorization": f"Bearer {da_token}"})
    assert flags_res.status_code == 200
    print(f"[PASS] 6b. Active review flags queryable: {len(flags_res.json())} flags returned")

    # 7. Financials: Milestones, Installments, Payments & Fraud Check (Gap 2)
    # 7a. Create Milestone
    m_res = client.post(
        f"/financials/projects/{proj_id}/milestones",
        json={"milestone_name": "RO Foundation & Piping", "expected_percentage": 30},
        headers={"Authorization": f"Bearer {da_token}"}
    )
    assert m_res.status_code == 201
    m_id = m_res.json()["milestone_id"]
    print(f"[PASS] 7a. Milestone created: #{m_id[:8]} (30% progress)")

    # 7b. Disburse Payment BEFORE Milestone Verification -> Expect Anomaly Flag!
    fraud_pay = client.post(
        f"/financials/projects/{proj_id}/payments",
        json={
            "amount": 1000000.0,
            "payment_mode": "RTGS",
            "linked_milestone_id": m_id
        },
        headers={"Authorization": f"Bearer {da_token}"}
    )
    assert fraud_pay.status_code == 201
    assert fraud_pay.json()["anomaly_flag"] is True, "Payment for unverified milestone MUST trigger anomaly_flag"
    print("[PASS] 7b. Fraud Rule Verified: Payment disbursed for unverified milestone flagged as ANOMALY")

    # 7c. Verify Milestone
    verify_m = client.post(
        f"/financials/milestones/{m_id}/verify",
        json={"remarks": "Piping pressure tested and signed off."},
        headers={"Authorization": f"Bearer {da_token}"}
    )
    assert verify_m.status_code == 200
    assert verify_m.json()["verified"] is True
    print("[PASS] 7c. Milestone verified by District Authority")

    # 7d. Disburse Payment AFTER Verification -> Clean Payment
    clean_pay = client.post(
        f"/financials/projects/{proj_id}/payments",
        json={
            "amount": 500000.0,
            "payment_mode": "NEFT",
            "linked_milestone_id": m_id
        },
        headers={"Authorization": f"Bearer {da_token}"}
    )
    assert clean_pay.status_code == 201
    assert clean_pay.json()["anomaly_flag"] is False, "Payment for verified milestone must NOT be flagged"
    print("[PASS] 7d. Legitimate payment recorded without anomaly flag")

    # 7e. Record Installment
    inst_res = client.post(
        f"/financials/projects/{proj_id}/installments",
        json={"installment_no": 1, "amount_released": 3000000.0, "amount_utilized": 1500000.0},
        headers={"Authorization": f"Bearer {da_token}"}
    )
    assert inst_res.status_code == 201
    print(f"[PASS] 7e. Financial installment recorded. Balance: ₹{inst_res.json()['balance']:,.2f}")

    # 7f. Record GeM Procurement
    proc_res = client.post(
        f"/financials/projects/{proj_id}/procurement",
        json={
            "item_name": "Commercial Reverse Osmosis Membrane Filter",
            "quantity": 4.0,
            "unit": "Units",
            "unit_price": 75000.0,
            "item_description": "GeM Q3 Grade industrial filtration membrane"
        },
        headers={"Authorization": f"Bearer {vendor_token}"}
    )
    assert proc_res.status_code == 201
    print(f"[PASS] 7f. GeM procurement record logged: ₹{proc_res.json()['total_amount']:,.2f}")

    # 8. Statutory SC/ST Compliance API (Gap 3)
    comp_res = client.get(f"/compliance/sc-st/{mp_user_id}", headers={"Authorization": f"Bearer {mp_token}"})
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert "sc_allocation" in comp_data
    assert "st_allocation" in comp_data
    print(f"[PASS] 8. SC/ST allocation evaluated: SC {comp_data['sc_allocation']['allocated_percentage']}%, ST {comp_data['st_allocation']['allocated_percentage']}%, Status: {comp_data['compliance_status']}")

    # 9. In-App Notifications (Gap 4)
    notif_res = client.get("/notifications", headers={"Authorization": f"Bearer {mp_token}"})
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    assert len(notifs) >= 1
    unread_res = client.get("/notifications/unread-count", headers={"Authorization": f"Bearer {mp_token}"})
    assert unread_res.status_code == 200
    assert unread_res.json()["unread_count"] >= 1
    first_notif_id = notifs[0]["notification_id"]
    mark_read = client.put(f"/notifications/{first_notif_id}/read", headers={"Authorization": f"Bearer {mp_token}"})
    assert mark_read.status_code == 200
    print(f"[PASS] 9. In-App Notifications API verified: {len(notifs)} alerts, unread count badge OK")

    # 10. Executive Analytics Views (Gap 5)
    mp_summary = client.get("/views/mp/recommendation-summary", headers={"Authorization": f"Bearer {mp_token}"})
    assert mp_summary.status_code == 200
    assert mp_summary.json()["total_recommendations"] >= 1

    dist_summary = client.get("/views/state/district-summary", headers={"Authorization": f"Bearer {da_token}"})
    assert dist_summary.status_code == 200
    assert len(dist_summary.json()) >= 1
    print(f"[PASS] 10. Executive Analytics Views verified (MP summary + State-district rollup)")

    # 11. Admin & System Governance (Gap 6)
    config_res = client.get("/admin/config", headers={"Authorization": f"Bearer {admin_token}"})
    assert config_res.status_code == 200
    assert len(config_res.json()) >= 1

    update_cfg = client.put(
        "/admin/config/risk_priority_threshold",
        json={"config_value": {"threshold": 60.0, "unit": "percentage"}},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert update_cfg.status_code == 200
    print("[PASS] 11. Admin & System Governance verified: dynamic threshold update successful")

    # 12. Cryptographic SHA-256 Audit Trail Verification
    audit_verify = client.get("/audit/verify", headers={"Authorization": f"Bearer {admin_token}"})
    assert audit_verify.status_code == 200
    assert audit_verify.json()["verified"] is True
    print(f"[PASS] 12. Audit Trail cryptographically verified INTACT ({audit_verify.json()['total_records']} blocks linked)")

    print("\n=======================================================")
    print(">>> ALL REFINED BACKEND MODULES PASSED 100%! <<<")
    print("=======================================================\n")

if __name__ == "__main__":
    test_complete_backend_refinement()
