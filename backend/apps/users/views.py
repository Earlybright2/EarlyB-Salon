import json
import logging
import time
import urllib.parse
import urllib.request

import jwt
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import redirect
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shop.models import Stylist
from apps.users.serializers import UserSerializer
from apps.users.services import (
    REFRESH_COOKIE_NAME,
    admin_login_with_email,
    attach_session_cookie,
    clear_session_cookie,
    create_user,
    find_user_by_email,
    find_user_by_union_id,
    login_with_email,
    upsert_user,
    verify_session_token,
)

security_logger = logging.getLogger("earlyb.security")

GOOGLE_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo"
APPLE_ENDPOINT = "https://appleid.apple.com/auth/authorize"
APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token"


def _oauth_redirect_uri(request, provider: str) -> str:
    return f"http://{request.get_host()}/api/auth/{provider}/callback"


def _post_form(url: str, fields: dict) -> dict:
    data = urllib.parse.urlencode(fields).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _get_json(url: str, headers: dict) -> dict:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _rate_limited_response():
    security_logger.warning("Rate limit exceeded on auth endpoint")
    return Response(
        {"error": "Too many requests. Please try again later.", "retry_after": 60},
        status=status.HTTP_429_TOO_MANY_REQUESTS,
    )


@method_decorator(ratelimit(key="ip", rate="5/m", method="POST", block=True), name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        if not email or not password:
            return Response(
                {"error": "email and password required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = find_user_by_email(email.strip().lower())
        try:
            user = login_with_email(email, password)
        except serializers.ValidationError:
            if existing is None:
                security_logger.warning("Failed login: %s — user not found", email)
            else:
                security_logger.warning("Failed login: %s — invalid password", email)
            raise

        response = Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        attach_session_cookie(response, user, host=request.META.get("HTTP_HOST", ""))
        return response

    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        except Ratelimited:
            return _rate_limited_response()


@method_decorator(ratelimit(key="ip", rate="5/m", method="POST", block=True), name="dispatch")
class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        role = request.data.get("role")
        if not email or not password:
            return Response(
                {"error": "email and password required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = admin_login_with_email(email, password, role)
        except serializers.ValidationError:
            security_logger.warning("Failed admin login: %s", email)
            raise
        security_logger.warning("Successful admin login: %s role=%s", email, user.role)
        response = Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        attach_session_cookie(response, user, host=request.META.get("HTTP_HOST", ""))
        return response

    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        except Ratelimited:
            return _rate_limited_response()


@method_decorator(ratelimit(key="ip", rate="3/m", method="POST", block=True), name="dispatch")
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        role = request.data.get("role")
        if role not in {"barber", "stylist"}:
            return Response({"error": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST)

        first_name = request.data.get("firstName") or request.data.get("first_name")
        last_name = request.data.get("lastName") or request.data.get("last_name")
        email = request.data.get("email")
        password = request.data.get("password")
        gender = request.data.get("gender")

        if not email or not password or not first_name or not last_name:
            return Response(
                {"error": "Missing required fields."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(password, user=None)
        except DjangoValidationError as e:
            return Response(
                {"error": "Password too weak.", "details": e.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name = f"{first_name.strip()} {last_name.strip()}".strip()
        normalized = email.strip().lower()
        user = create_user(
            {
                "union_id": f"email:{normalized}",
                "email": normalized,
                "name": name,
                "password_hash": password,
                "gender": gender,
                "role": role,
                "auth_provider": "email",
            }
        )

        response = Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        attach_session_cookie(response, user, host=request.META.get("HTTP_HOST", ""))
        return response

    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        except Ratelimited:
            return _rate_limited_response()


class KycView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stylist = Stylist.objects.filter(user=request.user).first()
        if not stylist:
            return Response({"error": "Stylist profile not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            {
                "kycStatus": stylist.kyc_status,
                "kycSubmittedAt": stylist.kyc_submitted_at,
                "kycApprovedAt": stylist.kyc_approved_at,
            }
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({"ok": True})
        clear_session_cookie(response, host=request.META.get("HTTP_HOST", ""))
        return response


@method_decorator(ratelimit(key="ip", rate="30/m", method="POST", block=True), name="dispatch")
class RefreshTokenView(APIView):
    """Exchange refresh_id cookie for a new access token (rotation)."""

    permission_classes = [AllowAny]

    def post(self, request):
        token = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not token:
            return Response(
                {"error": "Missing refresh token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        payload = verify_session_token(token)
        if payload is None:
            security_logger.warning("Refresh failed — expired or invalid refresh token")
            return Response(
                {"error": "Session expired. Please log in again."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if payload.get("type") and payload.get("type") != "refresh":
            return Response(
                {"error": "Invalid refresh token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = find_user_by_union_id(payload["unionId"])
        if user is None:
            return Response(
                {"error": "User not found. Please re-login."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        response = Response({"ok": True})
        attach_session_cookie(response, user, host=request.META.get("HTTP_HOST", ""))
        return response

    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        except Ratelimited:
            return _rate_limited_response()


@method_decorator(ratelimit(key="ip", rate="10/m", method="GET", block=True), name="dispatch")
class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                "Google OAuth is not configured.",
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        role = request.query_params.get("role")
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": _oauth_redirect_uri(request, "google"),
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
        }
        if role in {"barber", "stylist"}:
            params["state"] = role
        return redirect(f"{GOOGLE_ENDPOINT}?{urllib.parse.urlencode(params)}")

    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        except Ratelimited:
            return _rate_limited_response()


@method_decorator(ratelimit(key="ip", rate="10/m", method="GET", block=True), name="dispatch")
class GoogleCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("code")
        role = request.query_params.get("state")
        if not code:
            security_logger.warning("OAuth callback failure: Google missing code")
            return Response("Missing code", status=status.HTTP_400_BAD_REQUEST)

        redirect_uri = _oauth_redirect_uri(request, "google")
        try:
            token_json = _post_form(
                GOOGLE_TOKEN_URL,
                {
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
        except Exception:
            security_logger.warning("OAuth callback failure: Google token exchange error")
            return Response("Failed to obtain Google access token", status=status.HTTP_400_BAD_REQUEST)

        access_token = token_json.get("access_token")
        if not access_token:
            security_logger.warning("OAuth callback failure: Google no access_token")
            return Response("Failed to obtain Google access token", status=status.HTTP_400_BAD_REQUEST)

        profile = _get_json(GOOGLE_USERINFO, {"Authorization": f"Bearer {access_token}"})
        sub = profile.get("sub")
        email = profile.get("email")
        if not sub or not email:
            security_logger.warning("OAuth callback failure: Google missing profile fields")
            return Response("Missing Google user data", status=status.HTTP_400_BAD_REQUEST)

        user = upsert_user(
            {
                "union_id": f"google:{sub}",
                "email": email,
                "name": profile.get("name") or email.split("@")[0],
                "avatar": profile.get("picture"),
                "role": role if role in {"barber", "stylist"} else "user",
                "auth_provider": "google",
            }
        )
        response = redirect("/")
        attach_session_cookie(response, user, host=request.META.get("HTTP_HOST", ""))
        return response

    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        except Ratelimited:
            return _rate_limited_response()


@method_decorator(ratelimit(key="ip", rate="10/m", method="GET", block=True), name="dispatch")
class AppleAuthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not settings.APPLE_CLIENT_ID:
            return Response(
                "Apple OAuth is not configured.",
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        role = request.query_params.get("role")
        params = {
            "client_id": settings.APPLE_CLIENT_ID,
            "redirect_uri": _oauth_redirect_uri(request, "apple"),
            "response_type": "code id_token",
            "response_mode": "form_post",
            "scope": "name email",
        }
        if role in {"barber", "stylist"}:
            params["state"] = role
        return redirect(f"{APPLE_ENDPOINT}?{urllib.parse.urlencode(params)}")

    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        except Ratelimited:
            return _rate_limited_response()


@method_decorator(ratelimit(key="ip", rate="10/m", method="POST", block=True), name="dispatch")
class AppleCallbackView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if (
            not settings.APPLE_CLIENT_ID
            or not settings.APPLE_TEAM_ID
            or not settings.APPLE_KEY_ID
            or not settings.APPLE_PRIVATE_KEY
        ):
            return Response(
                "Apple OAuth is not configured.",
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        code = request.data.get("code")
        role = request.data.get("state")
        if not code:
            security_logger.warning("OAuth callback failure: Apple missing code")
            return Response("Missing code", status=status.HTTP_400_BAD_REQUEST)

        now = int(time.time())
        client_secret = jwt.encode(
            {
                "iss": settings.APPLE_TEAM_ID,
                "iat": now,
                "exp": now + 60 * 5,
                "aud": "https://appleid.apple.com",
                "sub": settings.APPLE_CLIENT_ID,
            },
            settings.APPLE_PRIVATE_KEY,
            algorithm="ES256",
            headers={"kid": settings.APPLE_KEY_ID},
        )

        try:
            token_json = _post_form(
                APPLE_TOKEN_URL,
                {
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": settings.APPLE_CLIENT_ID,
                    "client_secret": client_secret,
                    "redirect_uri": _oauth_redirect_uri(request, "apple"),
                },
            )
        except Exception:
            security_logger.warning("OAuth callback failure: Apple token exchange error")
            return Response("Failed to get ID token", status=status.HTTP_400_BAD_REQUEST)

        id_token = token_json.get("id_token")
        if not id_token:
            security_logger.warning("OAuth callback failure: Apple no id_token")
            return Response("Failed to get ID token", status=status.HTTP_400_BAD_REQUEST)

        payload = jwt.decode(id_token, options={"verify_signature": False})
        email = payload.get("email")
        sub = payload.get("sub")
        if not email or not sub:
            security_logger.warning("OAuth callback failure: Apple missing profile fields")
            return Response("Missing Apple user data", status=status.HTTP_400_BAD_REQUEST)

        user = upsert_user(
            {
                "union_id": f"apple:{sub}",
                "email": email,
                "name": email.split("@")[0],
                "role": role if role in {"barber", "stylist"} else "user",
                "auth_provider": "apple",
            }
        )

        response = redirect("/")
        attach_session_cookie(response, user, host=request.META.get("HTTP_HOST", ""))
        return response

    def dispatch(self, request, *args, **kwargs):
        try:
            return super().dispatch(request, *args, **kwargs)
        except Ratelimited:
            return _rate_limited_response()
