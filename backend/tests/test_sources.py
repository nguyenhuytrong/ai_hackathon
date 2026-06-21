from fastapi.testclient import TestClient


def test_source_detail_route_returns_metadata_and_chunks(client: TestClient):
    ingest_response = client.post("/api/v1/rag/ingest?dryRun=false")
    assert ingest_response.status_code == 200

    response = client.get("/api/v1/sources/src_medicaid_nemt")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Source loaded successfully"
    detail = payload["data"]
    assert detail["sourceId"] == "src_medicaid_nemt"
    assert detail["title"]
    assert detail["authorityLevel"]
    assert detail["chunks"]
    assert detail["chunks"][0]["sourceId"] == "src_medicaid_nemt"
    assert detail["chunks"][0]["metadata"]["category"] == "transportation"


def test_missing_source_route_returns_standard_error(client: TestClient):
    response = client.get("/api/v1/sources/src_missing")

    assert response.status_code == 404
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Source not found"
    assert payload["status"] == 404
    assert payload["path"] == "/api/v1/sources/src_missing"
