"""Session JWT authentication with required exp claim."""

from __future__ import annotations

import logging

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()
security_logger = logging.getLogger("earlyb.security")


class SessionJWTAuthentication(BaseAuthentication):
    """Authenticates via session_id cookie; rejects expired tokens."""

    keyword = "Bearer"
    cookie_name = "session_id"

    def authenticate(self, request):
        token = request.COOKIES.get(self.cookie_name)
        if not token:
            return None

        payload = self._verify_token(token)
        if payload is None:
            raise AuthenticationFailed("Session expired. Please log in again.")

        if payload.get("type") and payload.get("type") != "access":
            raise AuthenticationFailed("Invalid authentication token.")

        union_id = payload.get("unionId")
        if not union_id:
            raise AuthenticationFailed("Invalid authentication token.")

        try:
            user = User.objects.get(union_id=union_id)
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found. Please re-login.")

        if not user.is_active or getattr(user, "is_suspended", False):
            raise AuthenticationFailed("User is not active.")

        return (user, token)

    def authenticate_header(self, request):
        return self.keyword

    def _verify_token(self, token):
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
                options={"require": ["exp"]},
            )
        except jwt.ExpiredSignatureError:
            security_logger.warning(
                "JWT token expiration — access attempt with expired token"
            )
            return None
        except jwt.PyJWTError:
            return None
        if not payload.get("unionId") or not payload.get("clientId"):
            return None
        return payload
