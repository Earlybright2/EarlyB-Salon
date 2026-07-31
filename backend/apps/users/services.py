import datetime
from typing import Any, Dict, Optional

import jwt
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework import serializers

from apps.users.models import User

SESSION_COOKIE_NAME = "session_id"


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
    user = User(
        union_id=data.get("union_id") or email,
        email=email or None,
        name=data.get("name"),
        avatar=data.get("avatar"),
        role=data.get("role", "user"),
        auth_provider=data.get("auth_provider", "email"),
    )
    password = data.get("password_hash")
    if password:
        user.password = make_password(password)
    else:
        user.set_unusable_password()
    user.save()
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
                "union_id": normalized_email,
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


def sign_session_token(payload: Dict[str, str], response=None) -> str:
    now = timezone.now()
    expires_at = now + datetime.timedelta(days=settings.JWT_EXPIRATION_DAYS)
    token = jwt.encode(
        {
            **payload,
            "exp": expires_at,
            "iat": now,
        },
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return token


def verify_session_token(token: str) -> Optional[Dict[str, str]]:
    if not token:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.PyJWTError:
        return None
    union_id = payload.get("unionId")
    client_id = payload.get("clientId")
    if not union_id or not client_id:
        return None
    return {"unionId": union_id, "clientId": client_id}


def _cookie_extra(options: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in options.items() if k != "key"}


def attach_session_cookie(response, user, host: str = "") -> None:
    token = sign_session_token(
        {"unionId": user.union_id, "clientId": settings.APP_ID or "local"}
    )
    options = get_session_cookie_options(host)
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        max_age=settings.JWT_EXPIRATION_DAYS * 24 * 60 * 60,
        **_cookie_extra(options),
    )


def clear_session_cookie(response, host: str = "") -> None:
    options = get_session_cookie_options(host)
    response.delete_cookie(
        SESSION_COOKIE_NAME,
        path=options["path"],
        samesite=options["samesite"],
        secure=options["secure"],
    )
