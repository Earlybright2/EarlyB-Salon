import json
import time
import urllib.parse
import urllib.request

import jwt
from django.conf import settings
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shop.models import Stylist
from apps.users.serializers import UserSerializer
from apps.users.services import (
    admin_login_with_email,
    attach_session_cookie,
    clear_session_cookie,
    create_user,
    login_with_email,
    upsert_user,
)

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


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        if not email or not password:
            return Response(
                {"error": "email and password required"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = login_with_email(email, password)
        response = Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        attach_session_cookie(response, user, host=request.META.get("HTTP_HOST", ""))
        return response


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        role = request.data.get("role")
        if not email or not password:
            return Response(
                {"error": "email and password required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = admin_login_with_email(email, password, role=role)
        except serializers.ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_403_FORBIDDEN)

        response = Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        attach_session_cookie(response, user, host=request.META.get("HTTP_HOST", ""))
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response({"success": True})
        clear_session_cookie(response, host=request.META.get("HTTP_HOST", ""))
        return response


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
            return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        name = f"{first_name.strip()} {last_name.strip()}".strip()
        user = create_user(
            {
                "union_id": email.strip().lower(),
                "email": email.strip().lower(),
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


class KycView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stylist = Stylist.objects.filter(user=request.user).first()
        if not stylist:
            return Response({"error": "KYC record not found."}, status=status.HTTP_404_NOT_FOUND)

        kyc_status = "not_submitted" if not stylist.kyc_submitted_at else stylist.kyc_status
        return Response(
            {
                "kycStatus": kyc_status,
                "kycSubmittedAt": stylist.kyc_submitted_at,
                "kycApprovedAt": stylist.kyc_approved_at,
            }
        )

    def post(self, request):
        stylist = Stylist.objects.filter(user=request.user).first()
        if not stylist:
            return Response({"error": "KYC record not found."}, status=status.HTTP_404_NOT_FOUND)

        if not request.FILES.get("government_id"):
            return Response({"error": "Government ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not request.FILES.get("business_certificate"):
            return Response({"error": "Business certificate is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not request.FILES.get("utility_bill"):
            return Response({"error": "Utility bill is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not request.FILES.get("salon_photo"):
            return Response({"error": "Salon photo is required."}, status=status.HTTP_400_BAD_REQUEST)

        stylist.government_id = request.FILES["government_id"]
        stylist.business_certificate = request.FILES["business_certificate"]
        stylist.utility_bill = request.FILES["utility_bill"]
        stylist.salon_photo = request.FILES["salon_photo"]
        stylist.kyc_status = "pending"
        stylist.kyc_submitted_at = timezone.now()
        stylist.save()

        return Response({"success": True})


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            return Response("Google OAuth is not configured.", status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        role = request.query_params.get("role")
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": _oauth_redirect_uri(request, "google"),
            "response_type": "code",
            "scope": "openid email profile",
            "prompt": "select_account",
            "access_type": "offline",
        }
        if role in {"barber", "stylist"}:
            params["state"] = role
        return redirect(f"{GOOGLE_ENDPOINT}?{urllib.parse.urlencode(params)}")


class GoogleCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get("code")
        role = request.query_params.get("state")
        if not code:
            return Response("Missing code", status=status.HTTP_400_BAD_REQUEST)

        redirect_uri = _oauth_redirect_uri(request, "google")
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
        access_token = token_json.get("access_token")
        if not access_token:
            return Response("Failed to obtain Google access token", status=status.HTTP_400_BAD_REQUEST)

        profile = _get_json(GOOGLE_USERINFO, {"Authorization": f"Bearer {access_token}"})
        email = profile.get("email")
        if not email:
            return Response("Google profile missing email", status=status.HTTP_400_BAD_REQUEST)

        user = upsert_user(
            {
                "union_id": f"google:{profile.get('sub')}",
                "email": email,
                "name": profile.get("name") or email,
                "avatar": profile.get("picture"),
                "role": role if role in {"barber", "stylist"} else role if role in {"barber", "stylist"} else "user",
                "auth_provider": "google",
            }
        )

        response = redirect("/")
        attach_session_cookie(response, user, host=request.META.get("HTTP_HOST", ""))
        return response


class AppleAuthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not settings.APPLE_CLIENT_ID or not settings.APPLE_TEAM_ID or not settings.APPLE_KEY_ID or not settings.APPLE_PRIVATE_KEY:
            return Response("Apple OAuth is not configured.", status=status.HTTP_500_INTERNAL_SERVER_ERROR)
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


class AppleCallbackView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not settings.APPLE_CLIENT_ID or not settings.APPLE_TEAM_ID or not settings.APPLE_KEY_ID or not settings.APPLE_PRIVATE_KEY:
            return Response("Apple OAuth is not configured.", status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        code = request.data.get("code")
        role = request.data.get("state")
        if not code:
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
        id_token = token_json.get("id_token")
        if not id_token:
            return Response("Failed to get ID token", status=status.HTTP_400_BAD_REQUEST)

        payload = jwt.decode(id_token, options={"verify_signature": False})
        email = payload.get("email")
        sub = payload.get("sub")
        if not email or not sub:
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
