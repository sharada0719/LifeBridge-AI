import pytest

def test_emergency_request_crud_and_audit_logging(client):
    # 1. Register and login admin
    client.post("/api/auth/register", json={
        "name": "Operations Admin",
        "email": "admin@lifebridge.ai",
        "password": "adminpassword",
        "role": "admin"
    })
    login_response = client.post("/api/auth/login/json", json={
        "email": "admin@lifebridge.ai",
        "password": "adminpassword"
    })
    admin_token = login_response.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Register citizen & login to post SOS
    client.post("/api/auth/register", json={
        "name": "Jane Citizen",
        "email": "jane@lifebridge.ai",
        "password": "password123"
    })
    cit_login = client.post("/api/auth/login/json", json={
        "email": "jane@lifebridge.ai",
        "password": "password123"
    })
    cit_token = cit_login.json()["access_token"]
    cit_headers = {"Authorization": f"Bearer {cit_token}"}

    # 3. Create Emergency Request (SOS)
    sos_response = client.post("/api/requests/", json={
        "emergency_type": "flood",
        "severity": "critical",
        "description": "Rising waters are blocking my exit route. Need rescue support.",
        "latitude": 40.7128,
        "longitude": -74.0060
    }, headers=cit_headers)
    assert sos_response.status_code == 200
    sos_id = sos_response.json()["id"]

    # 4. Admin updates request (RBAC validation)
    update_response = client.patch(f"/api/requests/{sos_id}", json={
        "status": "dispatched"
      }, headers=admin_headers)
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "dispatched"

    # 5. Admin retrieves stats
    stats_response = client.get("/api/admin/stats", headers=admin_headers)
    assert stats_response.status_code == 200
    stats_data = stats_response.json()
    assert stats_data["total_requests"] == 1
    assert stats_data["requests_by_status"]["dispatched"] == 1

    # 6. Admin fetches Audit Logs (Verifies automated logging works!)
    audit_response = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert audit_response.status_code == 200
    logs = audit_response.json()
    
    # Check if correct audit logs exist
    actions = [log["action"] for log in logs]
    assert "USER_REGISTER" in actions
    assert "SOS_DISPATCH" in actions
    assert "REQUEST_UPDATE" in actions
