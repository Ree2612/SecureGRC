from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_api():
    print("Testing Root & Health...")
    r = client.get("/")
    assert r.status_code == 200, f"Root failed: {r.text}"
    print("Root status:", r.json())

    print("\nTesting Auth Login...")
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "ciso@cybercorp.com",
        "password": "SecurePass2026!"
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    data = login_resp.json()
    token = data["access_token"]
    user = data["user"]
    print("Logged in successfully as:", user["name"], f"({user['role']})")
    print("Token received:", token[:20] + "...")

    headers = {"Authorization": f"Bearer {token}"}

    print("\nTesting /api/v1/organizations/me...")
    org_resp = client.get("/api/v1/organizations/me", headers=headers)
    assert org_resp.status_code == 200
    print("Organization:", org_resp.json()["name"])

    print("\nTesting /api/v1/dashboard/kpis...")
    kpi_resp = client.get("/api/v1/dashboard/kpis", headers=headers)
    assert kpi_resp.status_code == 200
    print("KPIs:", kpi_resp.json())

    print("\nTesting /api/v1/dashboard/nist-coverage...")
    nist_resp = client.get("/api/v1/dashboard/nist-coverage", headers=headers)
    assert nist_resp.status_code == 200
    print("NIST Coverage categories:", len(nist_resp.json()))

    print("\nTesting /api/v1/risks...")
    risks_resp = client.get("/api/v1/risks", headers=headers)
    assert risks_resp.status_code == 200
    risks = risks_resp.json()
    print(f"Retrieved {len(risks)} risks.")

    print("\nTesting /api/v1/controls...")
    ctrl_resp = client.get("/api/v1/controls", headers=headers)
    assert ctrl_resp.status_code == 200
    controls = ctrl_resp.json()
    print(f"Retrieved {len(controls)} controls.")

    print("\nTesting /api/v1/gaps...")
    gaps_resp = client.get("/api/v1/gaps", headers=headers)
    assert gaps_resp.status_code == 200
    gaps = gaps_resp.json()
    print(f"Retrieved {len(gaps)} gaps.")

    print("\nTesting /api/v1/remediation...")
    rem_resp = client.get("/api/v1/remediation", headers=headers)
    assert rem_resp.status_code == 200
    rems = rem_resp.json()
    print(f"Retrieved {len(rems)} remediation tasks.")

    if rems:
        task_id = rems[0]["id"]
        print(f"\nTesting /api/v1/remediation/{task_id}/evidence/upload...")
        files = {"file": ("audit_log.txt", b"sample evidence content", "text/plain")}
        up_resp = client.post(f"/api/v1/remediation/{task_id}/evidence/upload", headers=headers, files=files)
        assert up_resp.status_code == 200, f"Upload evidence failed: {up_resp.text}"
        ev_data = up_resp.json()
        print("Uploaded evidence:", ev_data)

        print(f"\nTesting DELETE /api/v1/remediation/{task_id}/evidence/{ev_data['id']}...")
        del_resp = client.delete(f"/api/v1/remediation/{task_id}/evidence/{ev_data['id']}", headers=headers)
        assert del_resp.status_code == 204, f"Delete evidence failed: {del_resp.text}"
        print("Evidence deleted successfully!")

    print("\nTesting Explicit Gap <-> Remediation FK Relationship Isolation...")
    prac04_gaps = [g for g in gaps if g.get("control_code") == "PR.AC-04"]
    assert len(prac04_gaps) >= 2, f"Expected at least 2 PR.AC-04 gaps, found {len(prac04_gaps)}"
    
    target_gap_1 = prac04_gaps[0]
    target_gap_2 = prac04_gaps[1]
    
    assert target_gap_1["remediation_id"] is not None, "Target Gap 1 has no linked remediation_id"
    assert target_gap_2["remediation_id"] is not None, "Target Gap 2 has no linked remediation_id"
    assert target_gap_1["remediation_id"] != target_gap_2["remediation_id"], "PR.AC-04 gaps should have different linked remediations!"
    
    target_task_id = target_gap_1["remediation_id"]
    files = {"file": ("ac04_audit.pdf", b"PR.AC-04 user review evidence", "application/pdf")}
    client.post(f"/api/v1/remediation/{target_task_id}/evidence/upload", headers=headers, files=files)

    task_detail = client.get(f"/api/v1/remediation/{target_task_id}", headers=headers).json()
    if not task_detail.get("completion_criteria"):
        client.patch(f"/api/v1/remediation/{target_task_id}", headers=headers, json={"completion_criteria": "PR.AC-04 review complete."})

    verify_resp = client.post(f"/api/v1/remediation/{target_task_id}/verify", headers=headers, json={"notes": "PR.AC-04 verified."})
    assert verify_resp.status_code == 200, f"Verify failed: {verify_resp.text}"

    updated_gaps = client.get("/api/v1/gaps", headers=headers).json()
    updated_gap_1 = next(g for g in updated_gaps if g["id"] == target_gap_1["id"])
    updated_gap_2 = next(g for g in updated_gaps if g["id"] == target_gap_2["id"])

    assert updated_gap_1["status"] == "Resolved", f"Target Gap 1 should be Resolved, found {updated_gap_1['status']}"
    assert updated_gap_2["status"] != "Resolved", f"Target Gap 2 should NOT be Resolved, found {updated_gap_2['status']}"
    print(f"ISO TEST PASSED: Gap 1 ({updated_gap_1['title']}) is RESOLVED. Gap 2 ({updated_gap_2['title']}) remains {updated_gap_2['status']}.")

    print("\nTesting /api/v1/reports...")
    rep_resp = client.get("/api/v1/reports", headers=headers)
    assert rep_resp.status_code == 200
    reps = rep_resp.json()
    print(f"Retrieved {len(reps)} reports.")

    if reps:
        print("\nTesting /api/v1/reports/{id}/generate...")
        gen_resp = client.post(f"/api/v1/reports/{reps[0]['id']}/generate", headers=headers)
        assert gen_resp.status_code == 200
        print("Generated report:", gen_resp.json()["name"], "Status:", gen_resp.json()["status"])

    print("\nTesting /api/v1/activities...")
    act_resp = client.get("/api/v1/activities", headers=headers)
    assert act_resp.status_code == 200
    print(f"Retrieved {len(act_resp.json())} activities.")

    print("\nTesting /api/v1/notifications...")
    notif_resp = client.get("/api/v1/notifications", headers=headers)
    assert notif_resp.status_code == 200
    print(f"Retrieved {len(notif_resp.json())} notifications.")

    print("\nALL BACKEND TESTS PASSED!")

if __name__ == "__main__":
    test_full_api()
