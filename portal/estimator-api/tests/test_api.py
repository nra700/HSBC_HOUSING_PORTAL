"""Integration tests for the estimator API using a deterministic model stub."""
import pytest
from fastapi.testclient import TestClient

from app import main as estimator


class FakeModelClient:
    async def aclose(self):
        pass

    async def post(self, path, json):
        class Response:
            def __init__(self, payload): self.payload = payload
            def raise_for_status(self): pass
            def json(self): return self.payload
        instances = json["instances"]
        return Response({"predictions": [{"predicted_price_usd": 250000.0 + i * 10000}
                                          for i, _ in enumerate(instances)]})

    async def get(self, path):
        class Response:
            status_code = 200
            def raise_for_status(self): pass
            def json(self): return {"metrics": {"r2": 0.9}}
        return Response()


@pytest.fixture

def client(tmp_path, monkeypatch):
    monkeypatch.setattr(estimator, "DB_PATH", str(tmp_path / "history.sqlite3"))
    with TestClient(estimator.app) as test_client:
        estimator.app.state.http = FakeModelClient()
        yield test_client


PROPERTY = {
    "square_footage": 1850, "bedrooms": 3, "bathrooms": 2,
    "year_built": 1995, "lot_size": 6500,
    "distance_to_city_centre": 8.5, "school_rating": 7.2,
}


def test_create_and_list_estimate(client):
    response = client.post("/api/estimates", json={**PROPERTY, "label": "Test home"})
    assert response.status_code == 201
    assert response.json()["predicted_price_usd"] == 250000
    history = client.get("/api/estimates")
    assert history.status_code == 200
    assert len(history.json()) == 1
    assert history.json()[0]["label"] == "Test home"


def test_compare_two_properties(client):
    response = client.post("/api/compare", json={"properties": [PROPERTY, PROPERTY]})
    assert response.status_code == 200
    assert len(response.json()["items"]) == 2
    assert response.json()["highest"] == 1


def test_validation_returns_field_errors(client):
    response = client.post("/api/estimates", json={**PROPERTY, "square_footage": 10})
    assert response.status_code == 422
    assert "square_footage" in response.json()["fields"]


def test_clear_history(client):
    client.post("/api/estimates", json=PROPERTY)
    assert client.delete("/api/estimates").status_code == 204
    assert client.get("/api/estimates").json() == []
