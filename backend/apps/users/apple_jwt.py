"""Apple ID token verification using Apple's JWKS (RS256)."""
from __future__ import annotations

import json
import logging
from functools import lru_cache

import jwt
import requests
from jwt.algorithms import RSAAlgorithm
from rest_framework import serializers

security_logger = logging.getLogger("earlyb.security")

APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"


@lru_cache(maxsize=1)
def get_apple_public_keys():
    """Fetch and cache Apple's JWKS for ID-token signature verification."""
    try:
        response = requests.get(APPLE_JWKS_URL, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        security_logger.error("Failed to fetch Apple public keys: %s", exc)
        raise serializers.ValidationError(
            {"detail": "Failed to fetch Apple public keys. Please try again."}
        ) from exc


def get_apple_key_from_jwks(token: str, jwks: dict):
    """Select the JWKS key matching the token's kid header."""
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    for key_data in jwks.get("keys", []):
        if key_data.get("kid") == kid:
            return key_data
    security_logger.warning("Apple JWKS key not found for kid=%s", kid)
    raise serializers.ValidationError({"detail": "Apple signing key not found."})


def verify_apple_id_token(id_token: str, audience: str) -> dict:
    """
    Verify Apple ID token signature (RS256) and audience claim.
    Returns the decoded payload on success.
    Raises jwt.InvalidTokenError or serializers.ValidationError on failure.
    """
    jwks = get_apple_public_keys()
    key_data = get_apple_key_from_jwks(id_token, jwks)
    public_key = RSAAlgorithm.from_jwk(json.dumps(key_data))
    return jwt.decode(
        id_token,
        public_key,
        algorithms=["RS256"],
        audience=audience,
        options={"verify_aud": True},
    )
