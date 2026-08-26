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

    print("\nTesting /api/v1/reports...")
    rep_resp = client.get("/api/v1/reports", headers=headers)
    assert rep_resp.status_code == 200
    reps = rep_resp.json()
    print(f"Retrieved {len(reps)} reports.")

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
