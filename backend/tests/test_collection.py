"""Collection API tests."""
import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.core.database import SessionLocal, Base, engine
from src.models.user import User
from src.auth.service import AuthService
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


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def test_user(db):
    return AuthService.create_user(db, "test@example.com", "password123")


@pytest.fixture
def auth_headers(client, test_user):
    login = client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "password123"})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def card_variant_id(client):
    search = client.get("/api/v1/catalog/cards/search", params={"q": "Pikachu"}).json()
    assert search["cards"]
    return search["cards"][0]["variants"][0]["id"]


def test_add_item(client, auth_headers, card_variant_id):
    resp = client.post(
        "/api/v1/collection/items",
        json={"card_variant_id": card_variant_id, "quantity": 2},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["quantity"] == 2
    assert data["card_variant_id"] == card_variant_id
    assert "id" in data


def test_add_item_requires_auth(client, card_variant_id):
    resp = client.post(
        "/api/v1/collection/items",
        json={"card_variant_id": card_variant_id, "quantity": 1},
    )
    assert resp.status_code == 401


def test_list_collection(client, auth_headers, card_variant_id):
    client.post(
        "/api/v1/collection/items",
        json={"card_variant_id": card_variant_id, "quantity": 1},
        headers=auth_headers,
    )
    resp = client.get("/api/v1/collection", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1


def test_list_collection_requires_auth(client):
    resp = client.get("/api/v1/collection")
    assert resp.status_code == 401


def test_update_item(client, auth_headers, card_variant_id):
    add_resp = client.post(
        "/api/v1/collection/items",
        json={"card_variant_id": card_variant_id, "quantity": 1},
        headers=auth_headers,
    )
    item_id = add_resp.json()["id"]
    resp = client.patch(
        f"/api/v1/collection/items/{item_id}",
        json={"quantity": 5, "condition": "NM"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["quantity"] == 5
    assert resp.json()["condition"] == "NM"


def test_delete_item(client, auth_headers, card_variant_id):
    add_resp = client.post(
        "/api/v1/collection/items",
        json={"card_variant_id": card_variant_id, "quantity": 1},
        headers=auth_headers,
    )
    item_id = add_resp.json()["id"]
    resp = client.delete(f"/api/v1/collection/items/{item_id}", headers=auth_headers)
    assert resp.status_code == 200
    list_resp = client.get("/api/v1/collection", headers=auth_headers)
    ids = [i["id"] for i in list_resp.json()["items"]]
    assert item_id not in ids


def test_get_portfolio(client, auth_headers):
    resp = client.get("/api/v1/collection/portfolio", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_value" in data
    assert "currency" in data
    assert "daily_change" in data
    assert "weekly_change" in data
