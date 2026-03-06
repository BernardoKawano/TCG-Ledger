"""Auth API tests."""
import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.core.database import SessionLocal, Base, engine
from src.models.user import User
from src.auth.service import AuthService


@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
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
    user = AuthService.create_user(db, "test@example.com", "password123")
    return user


def test_register(client):
    resp = client.post("/api/v1/auth/register", json={"email": "new@example.com", "password": "secret123"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "new@example.com"
    assert "id" in data


def test_register_duplicate_email(client, test_user):
    resp = client.post("/api/v1/auth/register", json={"email": "test@example.com", "password": "other"})
    assert resp.status_code == 400


def test_login(client, test_user):
    resp = client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "password123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, test_user):
    resp = client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "wrong"})
    assert resp.status_code == 401


def test_me_requires_auth(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_with_token(client, test_user):
    login = client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "password123"})
    token = login.json()["access_token"]
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"
