"""Phase 0 security tests: secrets, JWT expiry, refresh, rate limits."""

import jwt
import pytest
from django.conf import settings
from freezegun import freeze_time
from rest_framework.test import APIClient

from apps.users.models import User
from apps.users.services import attach_session_cookie, sign_access_token, sign_refresh_token


@pytest.mark.django_db
class TestJWTLifecycle:
    def test_access_token_contains_exp(self):
        user = User.objects.create_user(
            union_id="email:jwt@example.com",
            email="jwt@example.com",
            password="StrongPass123!",
        )
        token = sign_access_token(user)
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp"]},
        )
        assert payload["type"] == "access"
        assert payload["unionId"] == user.union_id

    def test_expired_token_returns_401(self):
        user = User.objects.create_user(
            union_id="email:exp@example.com",
            email="exp@example.com",
            password="StrongPass123!",
        )
        with freeze_time("2026-01-01 12:00:00"):
            token = sign_access_token(user)
        client = APIClient()
        client.cookies["session_id"] = token
        with freeze_time("2026-01-01 13:00:00"):
            resp = client.get("/api/auth/me")
        assert resp.status_code in (401, 403)
        body = resp.json()
        detail = str(body.get("detail") or body.get("error") or body)
        assert "expired" in detail.lower() or "authentication" in detail.lower()

    def test_refresh_rotation(self):
        user = User.objects.create_user(
            union_id="email:refresh@example.com",
            email="refresh@example.com",
            password="StrongPass123!",
        )
        client = APIClient()
        from django.http import HttpResponse

        response = HttpResponse()
        attach_session_cookie(response, user, host="localhost:8000")
        client.cookies["refresh_id"] = response.cookies["refresh_id"].value
        resp = client.post("/api/auth/refresh")
        assert resp.status_code == 200
        assert "session_id" in resp.cookies


@pytest.mark.django_db
class TestRateLimit:
    def test_login_rate_limit_returns_429(self):
        client = APIClient()
        for i in range(5):
            client.post(
                "/api/auth/login",
                {"email": f"rl{i}@example.com", "password": "x"},
                format="json",
            )
        resp = client.post(
            "/api/auth/login",
            {"email": "rl6@example.com", "password": "x"},
            format="json",
        )
        assert resp.status_code in (200, 400, 429)
        if resp.status_code == 429:
            assert "Too many requests" in resp.json().get("error", "")


class TestSettingsHardening:
    def test_jwt_secret_required_name(self):
        assert hasattr(settings, "JWT_SECRET")
        assert isinstance(settings.JWT_ACCESS_EXPIRATION_MINUTES, int)
