from fastapi.testclient import TestClient


def create_session_with_profile(client: TestClient, profile: dict) -> str:
    response = client.post("/api/v1/sessions", json={"demoMode": False})
    session_id = response.json()["data"]["sessionId"]
    client.patch(f"/api/v1/sessions/{session_id}/intake", json=profile)
    return session_id


DEMO_PROFILE = {
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


def test_demo_profile_generates_and_stores_recommendation_run(client: TestClient):
    session_response = client.post("/api/v1/sessions/demo")
    session_id = session_response.json()["data"]["sessionId"]

    response = client.post(
        f"/api/v1/sessions/{session_id}/recommendations",
        json={"includeRagEvidence": False, "regenerate": True},
    )

    assert response.status_code == 200
    payload = response.json()
    data = payload["data"]
    assert payload["message"] == "Recommendations generated successfully"
    assert data["runId"].startswith("rec_")
    assert {recommendation["id"] for recommendation in data["recommendations"]} == {
        "rehab_services",
        "transportation_assistance",
        "caregiver_support_programs",
    }
    assert data["disclaimer"] == (
        "CareBridge does not determine final eligibility, provide medical advice, "
        "or replace healthcare professionals."
    )

    latest = client.get(f"/api/v1/sessions/{session_id}/recommendations/latest")
    assert latest.status_code == 200
    assert latest.json()["data"]["runId"] == data["runId"]


def test_transportation_barrier_creates_transportation_match(client: TestClient):
    session_id = create_session_with_profile(
        client,
        {
            **DEMO_PROFILE,
            "mobility": "independent",
            "transportation": "cannot_drive",
            "caregiverBurden": "low",
            "caregiverWorking": False,
        },
    )

    response = client.post(f"/api/v1/sessions/{session_id}/recommendations", json={})

    recommendations = response.json()["data"]["recommendations"]
    assert [recommendation["id"] for recommendation in recommendations] == ["transportation_assistance"]
    assert recommendations[0]["matchStatus"] == "possible_match"
    assert "Transportation is a barrier to follow-up care." in recommendations[0]["matchedFactors"]


def test_substantial_mobility_creates_rehab_and_home_health_matches(client: TestClient):
    session_id = create_session_with_profile(
        client,
        {
            **DEMO_PROFILE,
            "mobility": "needs_substantial_assistance",
            "transportation": "available",
            "caregiverBurden": "low",
            "caregiverWorking": False,
        },
    )

    response = client.post(f"/api/v1/sessions/{session_id}/recommendations", json={})

    recommendations = response.json()["data"]["recommendations"]
    assert [recommendation["id"] for recommendation in recommendations] == [
        "rehab_services",
        "home_health_discussion",
    ]
    assert recommendations[0]["matchStatus"] == "likely_match"
    assert recommendations[1]["matchStatus"] == "possible_match"


def test_elevated_caregiver_burden_creates_caregiver_support_match(client: TestClient):
    session_id = create_session_with_profile(
        client,
        {
            **DEMO_PROFILE,
            "mobility": "independent",
            "transportation": "available",
            "caregiverBurden": "high",
            "caregiverWorking": False,
        },
    )

    response = client.post(f"/api/v1/sessions/{session_id}/recommendations", json={})

    recommendations = response.json()["data"]["recommendations"]
    assert [recommendation["id"] for recommendation in recommendations] == ["caregiver_support_programs"]
    assert recommendations[0]["matchStatus"] == "possible_match"


def test_missing_information_returns_more_info_needed(client: TestClient):
    session_id = create_session_with_profile(client, {"state": "OH", "county": "Montgomery"})

    response = client.post(f"/api/v1/sessions/{session_id}/recommendations", json={})

    recommendations = response.json()["data"]["recommendations"]
    assert [recommendation["id"] for recommendation in recommendations] == [
        "rehab_services",
        "transportation_assistance",
        "caregiver_support_programs",
    ]
    assert {recommendation["matchStatus"] for recommendation in recommendations} == {"more_info_needed"}
    assert any(
        "Tell CareBridge whether transportation is a barrier." in recommendation["missingInformation"]
        for recommendation in recommendations
    )


def test_missing_session_recommendations_return_standard_error(client: TestClient):
    response = client.post("/api/v1/sessions/sess_missing/recommendations", json={})

    assert response.status_code == 404
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Session not found"
    assert payload["path"] == "/api/v1/sessions/sess_missing/recommendations"
