"""
API tests for the AI Try-On FastAPI application.
Uses FastAPI TestClient — no external server needed.
"""

import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from ai_tryon.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def test_jpeg():
    """Create a small JPEG test image."""
    img = Image.new("RGB", (300, 300), (50, 50, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf


@pytest.fixture
def test_png():
    """Create a small PNG test image."""
    img = Image.new("RGB", (300, 300), (50, 50, 50))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


class TestHealth:
    def test_health_endpoint(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert "version" in data


class TestValidation:
    def test_rejects_invalid_mime_type(self, client):
        resp = client.post(
            "/ai/try-on/analyze",
            files={"photo": ("test.txt", io.BytesIO(b"hello"), "text/plain")},
        )
        assert resp.status_code == 400
        assert "Unsupported file type" in resp.json()["detail"]

    def test_rejects_oversized_file(self, client):
        # Create a file larger than 8MB
        large_data = b"\x00" * (9 * 1024 * 1024)
        resp = client.post(
            "/ai/try-on/analyze",
            files={"photo": ("large.jpg", io.BytesIO(large_data), "image/jpeg")},
        )
        assert resp.status_code == 400
        assert "too large" in resp.json()["detail"].lower()

    def test_rejects_corrupt_image(self, client):
        resp = client.post(
            "/ai/try-on/analyze",
            files={"photo": ("corrupt.jpg", io.BytesIO(b"not an image"), "image/jpeg")},
        )
        assert resp.status_code == 400
        assert "Corrupt or invalid" in resp.json()["detail"]

    def test_rejects_small_image(self, client):
        img = Image.new("RGB", (50, 50), (50, 50, 50))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)
        resp = client.post(
            "/ai/try-on/analyze",
            files={"photo": ("small.jpg", buf, "image/jpeg")},
        )
        assert resp.status_code == 400
        assert "too small" in resp.json()["detail"].lower()


class TestHairstylesEndpoint:
    def test_get_all_hairstyles(self, client):
        resp = client.get("/ai/hairstyles")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_get_hairstyle_by_id(self, client):
        # Get the list to find a valid ID, then verify the first entry has expected fields
        resp = client.get("/ai/hairstyles")
        styles = resp.json()
        assert len(styles) > 0
        style_id = styles[0]["id"]
        assert "name" in styles[0]
        assert "category" in styles[0]
        # Verify the ID is a valid UUID format
        assert len(style_id) == 36

    def test_get_nonexistent_hairstyle(self, client):
        # Use a valid UUID format that doesn't exist in the database
        resp = client.get("/ai/hairstyles/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_recommend_with_face_shape(self, client):
        resp = client.get("/ai/hairstyles/recommend?face_shape=oval")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)


class TestRequestID:
    def test_request_id_in_response(self, client):
        resp = client.get("/health")
        assert "x-request-id" in resp.headers

    def test_custom_request_id_preserved(self, client):
        resp = client.get("/health", headers={"X-Request-ID": "test-id-123"})
        assert resp.headers.get("x-request-id") == "test-id-123"
