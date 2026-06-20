from fastapi.testclient import TestClient


def test_create_session_returns_empty_profile(client: TestClient):
    response = client.post("/api/v1/sessions", json={"demoMode": False})

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Session created successfully"
    assert payload["data"]["sessionId"].startswith("sess_")
    assert payload["data"]["profile"] == {}
    assert payload["data"]["createdAt"]
    assert payload["data"]["updatedAt"]


def test_demo_session_returns_prefilled_persona(client: TestClient):
    response = client.post("/api/v1/sessions/demo")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Demo session created successfully"
    assert payload["data"]["sessionId"].startswith("demo_")
    assert payload["data"]["profile"] == {
        "caregiverName": "John",
        "careRecipient": "Mother",
        "dischargeTime": "less_than_7_days",
        "mobility": "needs_some_assistance",
        "transportation": "no_vehicle",
        "insurance": "medicaid",
        "caregiverWorking": True,
        "caregiverBurden": "elevated",
        "state": "OH",
        "county": "Montgomery",
        "biggestChallenge": "getting_to_appointments",
    }


def test_get_session_returns_persisted_profile(client: TestClient):
    create_response = client.post("/api/v1/sessions/demo")
    session_id = create_response.json()["data"]["sessionId"]

    response = client.get(f"/api/v1/sessions/{session_id}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Session loaded successfully"
    assert payload["data"]["sessionId"] == session_id
    assert payload["data"]["profile"]["caregiverName"] == "John"
    assert payload["data"]["profile"]["county"] == "Montgomery"


def test_patch_intake_merges_valid_profile_fields(client: TestClient):
    create_response = client.post("/api/v1/sessions", json={"demoMode": False})
    session_id = create_response.json()["data"]["sessionId"]

    response = client.patch(
        f"/api/v1/sessions/{session_id}/intake",
        json={
            "dischargeTime": "less_than_7_days",
            "mobility": "needs_some_assistance",
            "transportation": "no_vehicle",
            "insurance": "medicaid",
            "caregiverWorking": True,
            "caregiverBurden": "elevated",
            "state": "OH",
            "county": "Montgomery",
            "biggestChallenge": "getting_to_appointments",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Intake profile updated successfully"
    assert payload["data"]["sessionId"] == session_id
    assert payload["data"]["profile"]["transportation"] == "no_vehicle"
    assert payload["data"]["profile"]["county"] == "Montgomery"

    second_response = client.patch(
        f"/api/v1/sessions/{session_id}/intake",
        json={"caregiverBurden": "moderate"},
    )

    assert second_response.status_code == 200
    profile = second_response.json()["data"]["profile"]
    assert profile["transportation"] == "no_vehicle"
    assert profile["caregiverBurden"] == "moderate"


def test_missing_session_uses_standard_error_wrapper(client: TestClient):
    response = client.get("/api/v1/sessions/sess_missing")

    assert response.status_code == 404
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Session not found"
    assert payload["status"] == 404
    assert payload["path"] == "/api/v1/sessions/sess_missing"
    assert payload["timestamp"]
    assert payload["errors"] == {}


def test_invalid_intake_enum_uses_standard_validation_error(client: TestClient):
    create_response = client.post("/api/v1/sessions", json={"demoMode": False})
    session_id = create_response.json()["data"]["sessionId"]

    response = client.patch(
        f"/api/v1/sessions/{session_id}/intake",
        json={"transportation": "teleport"},
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Validation failed"
    assert payload["status"] == 422
    assert payload["path"] == f"/api/v1/sessions/{session_id}/intake"
    assert "transportation" in payload["errors"]


def test_unknown_intake_field_is_rejected(client: TestClient):
    create_response = client.post("/api/v1/sessions", json={"demoMode": False})
    session_id = create_response.json()["data"]["sessionId"]

    response = client.patch(
        f"/api/v1/sessions/{session_id}/intake",
        json={"favoriteColor": "cyan"},
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Validation failed"
    assert "favoriteColor" in payload["errors"]
