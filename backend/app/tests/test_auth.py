import pytest

def test_register_and_login(client):
    # 1. Register new citizen
    reg_response = client.post("/api/auth/register", json={
        "name": "Jane Doe",
        "email": "jane@lifebridge.ai",
        "password": "password123",
        "phone": "+1 (555) 111-2222",
        "latitude": 40.7128,
        "longitude": -74.0060
    })
    assert reg_response.status_code == 200
    user_data = reg_response.json()
    assert user_data["email"] == "jane@lifebridge.ai"
    assert user_data["role"] == "citizen"

    # 2. Login JSON
    login_response = client.post("/api/auth/login/json", json={
        "email": "jane@lifebridge.ai",
        "password": "password123"
    })
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # 3. Retrieve Profile details
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_response = client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["name"] == "Jane Doe"

def test_rbac_citizen_access_denied_to_admin(client):
    # 1. Register and login as citizen
    client.post("/api/auth/register", json={
        "name": "Jane Doe",
        "email": "jane@lifebridge.ai",
        "password": "password123"
    })
    login_response = client.post("/api/auth/login/json", json={
        "email": "jane@lifebridge.ai",
        "password": "password123"
    })
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Try to access admin stats
    stats_response = client.get("/api/admin/stats", headers=headers)
    # Role-Based Access Control should reject standard citizens
    assert stats_response.status_code == 403
    assert stats_response.json()["detail"] == "The user does not have enough privileges"
