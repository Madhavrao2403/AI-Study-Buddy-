def test_create_course(client, auth_headers):
    resp = client.post("/api/courses", json={
        "name": "Test Course",
        "description": "A test course",
        "subject": "Testing"
    }, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Test Course"
    assert data["status"] == "created"


def test_list_courses(client, auth_headers):
    client.post("/api/courses", json={"name": "Course 1"}, headers=auth_headers)
    client.post("/api/courses", json={"name": "Course 2"}, headers=auth_headers)
    resp = client.get("/api/courses", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_course(client, auth_headers):
    create_resp = client.post("/api/courses", json={"name": "My Course"}, headers=auth_headers)
    course_id = create_resp.json()["id"]
    resp = client.get(f"/api/courses/{course_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == course_id


def test_get_course_unauthorized(client, auth_headers):
    create_resp = client.post("/api/courses", json={"name": "My Course"}, headers=auth_headers)
    course_id = create_resp.json()["id"]

    # Register another user
    client.post("/api/auth/register", json={
        "email": "other@test.com",
        "password": "otherps1",
        "full_name": "Other"
    })
    other_resp = client.post("/api/auth/login", json={
        "email": "other@test.com",
        "password": "otherps1"
    })
    other_token = other_resp.json()["access_token"]

    resp = client.get(f"/api/courses/{course_id}", headers={"Authorization": f"Bearer {other_token}"})
    assert resp.status_code == 404


def test_update_course(client, auth_headers):
    create_resp = client.post("/api/courses", json={"name": "Old Name"}, headers=auth_headers)
    course_id = create_resp.json()["id"]
    resp = client.put(f"/api/courses/{course_id}", json={"name": "New Name"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


def test_delete_course(client, auth_headers):
    create_resp = client.post("/api/courses", json={"name": "To Delete"}, headers=auth_headers)
    course_id = create_resp.json()["id"]
    resp = client.delete(f"/api/courses/{course_id}", headers=auth_headers)
    assert resp.status_code == 200
    # Verify deleted
    get_resp = client.get(f"/api/courses/{course_id}", headers=auth_headers)
    assert get_resp.status_code == 404
