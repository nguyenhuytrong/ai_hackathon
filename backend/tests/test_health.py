from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_uses_standard_success_wrapper():
    client = TestClient(app)

    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "message": "CareBridge API is healthy",
        "data": {
            "service": "carebridge-api",
            "status": "ok",
            "version": "0.1.0",
        },
    }
