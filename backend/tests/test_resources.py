from fastapi.testclient import TestClient


def test_seeded_resources_are_available_and_idempotent(client: TestClient):
    first = client.get("/api/v1/resources")
    second = client.get("/api/v1/resources")

    assert first.status_code == 200
    assert second.status_code == 200
    resources = first.json()["data"]
    assert len(resources) == 4
    assert len(second.json()["data"]) == 4
    assert {resource["id"] for resource in resources} == {
        "rehab_services",
        "home_health_discussion",
        "transportation_assistance",
        "caregiver_support_programs",
    }


def test_resources_support_category_and_location_filters(client: TestClient):
    response = client.get("/api/v1/resources?category=transportation&state=OH&county=Montgomery")

    assert response.status_code == 200
    resources = response.json()["data"]
    assert [resource["id"] for resource in resources] == ["transportation_assistance"]
    assert resources[0]["location"] == "Montgomery County, OH"


def test_resource_detail_returns_safe_support_pathway_copy(client: TestClient):
    response = client.get("/api/v1/resources/transportation_assistance")

    assert response.status_code == 200
    payload = response.json()
    detail = payload["data"]
    assert payload["message"] == "Resource loaded successfully"
    assert detail["id"] == "transportation_assistance"
    assert detail["category"] == "transportation"
    assert "Transportation difficulty" in detail["eligibilityFactors"]
    assert "Insurance card" in detail["documentsToPrepare"]
    assert "Ask the insurance provider or social worker" in detail["steps"][0]

    text = str(detail).lower()
    assert "you qualify" not in text
    assert "approved" not in text
    assert "guaranteed" not in text


def test_missing_resource_returns_standard_error(client: TestClient):
    response = client.get("/api/v1/resources/unknown_resource")

    assert response.status_code == 404
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Resource not found"
    assert payload["status"] == 404
    assert payload["path"] == "/api/v1/resources/unknown_resource"
