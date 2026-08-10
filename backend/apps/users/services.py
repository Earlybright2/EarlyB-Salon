"""User domain services — auth helpers, JWT access/refresh cookies."""

from __future__ import annotations

from datetime import timedelta
from typing import Any, Dict, Optional

import jwt
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework import serializers

from apps.users.models import User
from apps.users.permissions import ADMIN_ROLES

SESSION_COOKIE_NAME = getattr(settings, "SESSION_COOKIE_NAME", "session_id")
REFRESH_COOKIE_NAME = getattr(settings, "REFRESH_COOKIE_NAME", "refresh_id")


def find_user_by_union_id(union_id: str) -> Optional[User]:
    try:
        return User.objects.get(union_id=union_id)
    except User.DoesNotExist:
        return None


def find_user_by_email(email: str) -> Optional[User]:
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None


def create_user(data: Dict[str, Any]) -> User:
    email = (data.get("email") or "").strip().lower()
    union_id = data.get("union_id") or (f"email:{email}" if email else None)
    user = User(
        union_id=union_id,
        email=email or None,
        name=data.get("name"),
        avatar=data.get("avatar"),
        role=data.get("role", "user"),
        gender=data.get("gender"),
        auth_provider=data.get("auth_provider", "email"),
    )
    password = data.get("password_hash")
    if password:
        user.password = make_password(password)
    else:
        user.set_unusable_password()
    user.save()

    if user.role in {"barber", "stylist"}:
        from apps.shop.models import Stylist

        Stylist.objects.create(user=user, display_name=user.name)

    return user


def upsert_user(data: Dict[str, Any]) -> User:
    values = dict(data)
    if values.get("role") is None and values.get("union_id") == settings.OWNER_UNION_ID:
        values["role"] = "admin"

    existing = (
        find_user_by_union_id(values.get("union_id"))
        if values.get("union_id")
        else None
    )
    if existing:
        if values.get("name"):
            existing.name = values["name"]
        if values.get("email"):
            existing.email = values["email"].strip().lower()
        if values.get("avatar"):
            existing.avatar = values["avatar"]
        if values.get("role"):
            existing.role = values["role"]
        existing.save()
        return existing
    return create_user(values)


def login_with_email(email: str, password: str) -> User:
    normalized_email = email.strip().lower()
    user = find_user_by_email(normalized_email)

    if user is None:
        return create_user(
            {
                "email": normalized_email,
                "union_id": f"email:{normalized_email}",
                "name": normalized_email.split("@")[0],
                "password_hash": password,
                "role": "user",
                "auth_provider": "email",
            }
        )

    if not user.has_usable_password() or not check_password(password, user.password):
        raise serializers.ValidationError(
            {"detail": {"message": "Invalid email or password."}}
        )
    return user


SPECIALIZED_ADMIN_ROLES = {
    "verification_admin",
    "finance_admin",
    "support_admin",
    "content_admin",
}

ASSIGNABLE_ROLE_OPTIONS = {
    "verification_admin": "verification_admin",
    "finance_admin": "finance_admin",
    "support_admin": "support_admin",
    "content_admin": "content_admin",
    "super_admin": "super_admin",
}


def admin_login_with_email(
    email: str, password: str, role: Optional[str] = None
) -> User:
    normalized_email = email.strip().lower()
    user = find_user_by_email(normalized_email)
    if user is None or not user.has_usable_password():
        raise serializers.ValidationError(
            {"detail": {"message": "Invalid email or password."}}
        )
    if not check_password(password, user.password):
        raise serializers.ValidationError(
            {"detail": {"message": "Invalid email or password."}}
        )
    if not user.is_staff:
        raise serializers.ValidationError(
            {
                "detail": {
                    "message": "You do not have permission to access the admin portal."
                }
            }
        )

    selected = (role or "").strip() or (
        ("super_admin" if user.is_superuser else user.role)
    )
    if selected in ASSIGNABLE_ROLE_OPTIONS:
        if user.role in ADMIN_ROLES and user.role != selected:
            raise serializers.ValidationError(
                {
                    "detail": {
                        "message": (
                            f"Role already assigned to this account "
                            f"({user.role}) and cannot be changed."
                        )
                    }
                }
            )
        if user.role not in ADMIN_ROLES:
            user.role = selected
            user.save(update_fields=["role"])
    return user


def is_localhost(host: str) -> bool:
    return host.startswith("localhost:") or host.startswith("127.0.0.1:")


def get_session_cookie_options(host: str) -> Dict[str, Any]:
    localhost = is_localhost(host or "")
    return {
        "key": SESSION_COOKIE_NAME,
        "httponly": True,
        "path": "/",
        "samesite": "Lax" if localhost else "None",
        "secure": not localhost,
    }


def _cookie_extra(options: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in options.items() if k != "key"}


def _encode_token(payload: Dict[str, Any]) -> str:
    return jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def sign_access_token(user: User) -> str:
    now = timezone.now()
    exp = now + timedelta(minutes=settings.JWT_ACCESS_EXPIRATION_MINUTES)
    return _encode_token(
        {
            "unionId": user.union_id,
            "clientId": settings.APP_ID or "earlyb-web",
            "iat": int(now.timestamp()),
            "exp": int(exp.timestamp()),
            "type": "access",
        }
    )


def sign_refresh_token(user: User) -> str:
    now = timezone.now()
    exp = now + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS)
    return _encode_token(
        {
            "unionId": user.union_id,
            "clientId": settings.APP_ID or "earlyb-web",
            "iat": int(now.timestamp()),
            "exp": int(exp.timestamp()),
            "type": "refresh",
        }
    )


def sign_session_token(payload: Dict[str, str], response=None) -> str:
    now = timezone.now()
    exp = now + timedelta(minutes=settings.JWT_ACCESS_EXPIRATION_MINUTES)
    return _encode_token(
        {
            **payload,
            "iat": int(now.timestamp()),
            "exp": int(exp.timestamp()),
            "type": "access",
        }
    )


def verify_session_token(token: str) -> Optional[Dict[str, str]]:
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp"]},
        )
    except jwt.ExpiredSignatureError:
        return None
    except jwt.PyJWTError:
        return None
    union_id = payload.get("unionId")
    client_id = payload.get("clientId")
    if not union_id or not client_id:
        return None
    return {
        "unionId": union_id,
        "clientId": client_id,
        "type": payload.get("type", "access"),
    }


def attach_session_cookie(response, user, host: str = "") -> None:
    access = sign_access_token(user)
    refresh = sign_refresh_token(user)
    options = get_session_cookie_options(host)
    extra = _cookie_extra(options)

    response.set_cookie(
        SESSION_COOKIE_NAME,
        access,
        max_age=settings.JWT_ACCESS_EXPIRATION_MINUTES * 60,
        **extra,
    )
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh,
        max_age=settings.JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60,
        **extra,
    )


def clear_session_cookie(response, host: str = "") -> None:
    options = get_session_cookie_options(host)
    response.delete_cookie(
        SESSION_COOKIE_NAME,
        path=options["path"],
        samesite=options["samesite"],
    )
    response.delete_cookie(
        REFRESH_COOKIE_NAME,
        path=options["path"],
        samesite=options["samesite"],
    )
