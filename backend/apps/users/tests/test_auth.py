"""Auth registration, password strength, union_id prefixes."""

import pytest
from rest_framework.test import APIClient

from apps.users.models import User


@pytest.mark.django_db
class TestPasswordValidation:
    def test_rejects_short_password(self):
        client = APIClient()
        resp = client.post(
            "/api/auth/register",
            {
                "role": "stylist",
                "firstName": "Ada",
                "lastName": "Lovelace",
                "email": "ada@example.com",
                "password": "short",
            },
            format="json",
        )
        assert resp.status_code == 400
        assert "Password too weak" in resp.json().get("error", "")

    def test_rejects_common_password(self):
        client = APIClient()
        resp = client.post(
            "/api/auth/register",
            {
                "role": "barber",
                "firstName": "Bob",
                "lastName": "Barber",
                "email": "bob@example.com",
                "password": "password",
            },
            format="json",
        )
        assert resp.status_code == 400


@pytest.mark.django_db
class TestUnionIdPrefix:
    def test_register_prefixes_email(self):
        client = APIClient()
        resp = client.post(
            "/api/auth/register",
            {
                "role": "stylist",
                "firstName": "Chi",
                "lastName": "Oma",
                "email": "chi@example.com",
                "password": "StrongPass123!",
            },
            format="json",
        )
        assert resp.status_code == 201
        user = User.objects.get(email="chi@example.com")
        assert user.union_id == "email:chi@example.com"
