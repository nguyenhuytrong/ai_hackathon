from fastapi.testclient import TestClient


REPORT_REQUEST = {
    "cms": {
        "CMS": 2.1,
        "severity": "moderate impairment",
        "breakdown": {"arm": 1.2, "sit": 2.0, "balance": 0.6},
    },
    "raw": {
        "sit": {"reps": 3, "avgTimeSec": 3.1},
        "arm": {"peakLeft": 74, "peakRight": 101, "asymmetryDeg": 27, "weakSide": "left"},
        "balance": {"swayMagnitude": 0.024, "durationSec": 10},
    },
}


def test_rehab_snapshot_report_returns_safe_standard_wrapper(client: TestClient):
    response = client.post("/api/v1/rehab-snapshot/report", json=REPORT_REQUEST)

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "Rehab snapshot report generated successfully"

    report = payload["data"]
    assert "caregiverSummary" in report
    assert "observed" in report["caregiverSummary"].lower()
    assert len(report["clinicalFlags"]) >= 2
    assert len(report["nextSteps"]) >= 3

    rendered = str(report).lower()
    for forbidden in ["you qualify", "approved", "guaranteed", "diagnosed", "treatment required", "urgent"]:
        assert forbidden not in rendered


def test_rehab_snapshot_report_rejects_invalid_request_shape(client: TestClient):
    response = client.post(
        "/api/v1/rehab-snapshot/report",
        json={"cms": {"CMS": "not-a-score", "severity": "moderate impairment"}},
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Validation failed"
    assert payload["status"] == 422
    assert payload["path"] == "/api/v1/rehab-snapshot/report"
    assert "CMS" in payload["errors"]
