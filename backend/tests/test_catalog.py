"""Catalog API tests."""
import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.core.database import SessionLocal, Base, engine
from src.catalog.seed import seed_catalog


@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_catalog(db)
    finally:
        db.close()
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)


def test_list_tcgs(client):
    resp = client.get("/api/v1/catalog/tcgs")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    slugs = [t["slug"] for t in data]
    assert "magic" in slugs
    assert "pokemon" in slugs


def test_list_sets(client):
    resp = client.get("/api/v1/catalog/sets")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_list_sets_filtered_by_tcg(client):
    tcgs = client.get("/api/v1/catalog/tcgs").json()
    mtg_id = next(t["id"] for t in tcgs if t["slug"] == "magic")
    resp = client.get(f"/api/v1/catalog/sets?tcg_id={mtg_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


def test_search_cards(client):
    resp = client.get("/api/v1/catalog/cards/search", params={"q": "Pikachu"})
    assert resp.status_code == 200
    data = resp.json()
    assert "cards" in data
    assert "total" in data
    assert data["total"] >= 1
    assert any("Pikachu" in c["name"] for c in data["cards"])


def test_search_cards_empty(client):
    resp = client.get("/api/v1/catalog/cards/search", params={"q": "XyzNonexistent"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["cards"] == []


def test_get_card_by_id(client):
    search = client.get("/api/v1/catalog/cards/search", params={"q": "Charizard"}).json()
    assert search["cards"]
    card_id = search["cards"][0]["id"]
    resp = client.get(f"/api/v1/catalog/cards/{card_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Charizard"
    assert "variants" in data


def test_get_card_not_found(client):
    resp = client.get("/api/v1/catalog/cards/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404
