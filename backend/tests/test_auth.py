def test_register(client):
    resp = client.post("/api/auth/register", json={
        "email": "newuser@test.com",
        "password": "pass1234",
        "full_name": "New User"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@test.com"


def test_register_duplicate_email(client):
    client.post("/api/auth/register", json={
        "email": "dup@test.com",
        "password": "pass1234",
        "full_name": "User One"
    })
    resp = client.post("/api/auth/register", json={
        "email": "dup@test.com",
        "password": "pass1234",
        "full_name": "User Two"
    })
    assert resp.status_code == 400


def test_login(client):
    client.post("/api/auth/register", json={
        "email": "login@test.com",
        "password": "pass1234",
        "full_name": "Login User"
    })
    resp = client.post("/api/auth/login", json={
        "email": "login@test.com",
        "password": "pass1234"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "email": "wrong@test.com",
        "password": "correctp",
        "full_name": "User"
    })
    resp = client.post("/api/auth/login", json={
        "email": "wrong@test.com",
        "password": "wrongpas"
    })
    assert resp.status_code == 401


def test_get_me(client, auth_headers):
    resp = client.get("/api/users/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@test.com"


def test_unauthorized_access(client):
    resp = client.get("/api/users/me")
    assert resp.status_code == 403
