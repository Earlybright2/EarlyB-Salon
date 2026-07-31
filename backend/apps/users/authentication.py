from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

import jwt

User = get_user_model()


class SessionJWTAuthentication(BaseAuthentication):
    """
    Authenticates requests using a JWT stored in the `session_id` httpOnly
    cookie (replaces the previous Node session flow).
    """

    keyword = "Bearer"
    cookie_name = "session_id"

    def authenticate(self, request):
        token = request.COOKIES.get(self.cookie_name)
        if not token:
            return None

        payload = self._verify_token(token)
        if payload is None:
            raise AuthenticationFailed("Invalid authentication token.")

        union_id = payload.get("unionId")
        if not union_id:
            raise AuthenticationFailed("Invalid authentication token.")

        try:
            user = User.objects.get(union_id=union_id)
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found. Please re-login.")

        if not user.is_active or user.is_suspended:
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
            )
        except jwt.PyJWTError:
            return None
        if not payload.get("unionId") or not payload.get("clientId"):
            return None
        return payload
