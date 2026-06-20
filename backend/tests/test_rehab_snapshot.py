from fastapi.testclient import TestClient


def create_session(client: TestClient) -> str:
    response = client.post("/api/v1/sessions/demo")
    return response.json()["data"]["sessionId"]


def test_save_rehab_snapshot_returns_success_wrapper(client: TestClient):
    session_id = create_session(client)

    response = client.post(
        f"/api/v1/sessions/{session_id}/rehab-snapshot",
        json={
            "mobilityConcern": "moderate",
            "observations": ["Difficulty standing", "Reduced arm movement"],
            "confidence": "medium",
            "capturedAt": "2026-06-19T10:00:00Z",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Rehab snapshot saved successfully"
    assert payload["data"] == {
        "sessionId": session_id,
        "rehabSnapshot": {
            "mobilityConcern": "moderate",
            "observations": ["Difficulty standing", "Reduced arm movement"],
            "confidence": "medium",
            "capturedAt": "2026-06-19T10:00:00Z",
        },
        "suggestedRecompute": True,
    }


def test_save_rehab_snapshot_does_not_persist_raw_video_or_landmarks(client: TestClient):
    session_id = create_session(client)

    response = client.post(
        f"/api/v1/sessions/{session_id}/rehab-snapshot",
        json={
            "mobilityConcern": "high",
            "observations": ["Standing balance looked unsteady"],
            "confidence": "medium",
            "rawVideo": "base64-video",
            "landmarks": [{"x": 0.1, "y": 0.2}],
        },
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["success"] is False
    assert "rawVideo" in payload["errors"]
    assert "landmarks" in payload["errors"]


def test_missing_session_rehab_snapshot_returns_standard_404(client: TestClient):
    response = client.post(
        "/api/v1/sessions/sess_missing/rehab-snapshot",
        json={"mobilityConcern": "moderate", "observations": ["Difficulty standing"]},
    )

    assert response.status_code == 404
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Session not found"
    assert payload["path"] == "/api/v1/sessions/sess_missing/rehab-snapshot"


def test_invalid_rehab_mobility_concern_returns_standard_422(client: TestClient):
    session_id = create_session(client)

    response = client.post(
        f"/api/v1/sessions/{session_id}/rehab-snapshot",
        json={"mobilityConcern": "severe", "observations": ["Difficulty standing"]},
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Validation failed"
    assert "mobilityConcern" in payload["errors"]
