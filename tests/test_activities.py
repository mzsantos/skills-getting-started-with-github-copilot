from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Expect the activities dict to contain known keys
    assert "Soccer Team" in data
    assert isinstance(data["Soccer Team"]["participants"], list)


def test_signup_success():
    activity = "Soccer Team"
    email = "test_student@mergington.edu"
    # Ensure not already present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Signed up {email} for {activity}"
    # Verify in-memory state updated
    assert email in activities[activity]["participants"]


def test_signup_duplicate():
    activity = "Soccer Team"
    email = "duplicate_student@mergington.edu"
    # Ensure present
    if email not in activities[activity]["participants"]:
        activities[activity]["participants"].append(email)

    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Student already signed up for this activity"


def test_signup_nonexistent_activity():
    activity = "Nonexistent Club"
    email = "nobody@mergington.edu"
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Activity not found"
