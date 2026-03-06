"""Scanner API tests."""
import io
import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.core.database import SessionLocal, Base, engine
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


def test_scan_requires_auth(client):
    """Scanner endpoint must require authentication to prevent API abuse."""
    # Minimal 1x1 JPEG
    image_data = (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00"
        b"\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f"
        b"\xff\xd9"
    )
    resp = client.post(
        "/api/v1/scan",
        files={"image": ("test.jpg", io.BytesIO(image_data), "image/jpeg")},
    )
    assert resp.status_code == 401


def test_scan_with_auth(client, auth_headers):
    """Scan with valid token returns 200 (may return empty candidates if Vision not configured)."""
    image_data = (
        b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00"
        b"\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f"
        b"\xff\xd9"
    )
    resp = client.post(
        "/api/v1/scan",
        files={"image": ("test.jpg", io.BytesIO(image_data), "image/jpeg")},
        headers=auth_headers,
    )
    # 200 with candidates (or empty if Vision fails)
    assert resp.status_code == 200
    data = resp.json()
    assert "candidates" in data
    assert "scan_id" in data


def test_scan_rejects_non_image(client, auth_headers):
    resp = client.post(
        "/api/v1/scan",
        files={"image": ("test.txt", io.BytesIO(b"not an image"), "text/plain")},
        headers=auth_headers,
    )
    assert resp.status_code == 400
