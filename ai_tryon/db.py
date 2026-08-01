"""
AI Try-On Module — Supabase Database Layer (v2.0)
Connection reuse via shared httpx.AsyncClient, retry logic, and typed errors.
"""

from __future__ import annotations

from typing import Any

import httpx

from .config import get_settings
from .exceptions import DatabaseError
from .logging_config import logger

# ─── Shared HTTP client (connection reuse) ───────────────────────

_client: httpx.AsyncClient | None = None

# Retryable HTTP status codes
_RETRYABLE_STATUS = frozenset({502, 503, 504, 429})
_MAX_RETRIES = 2
_RETRY_DELAY_S = 0.5


async def _get_client() -> httpx.AsyncClient:
    global _client
    # Recreate client if the previous event loop is closed (happens in tests)
    try:
        if _client is not None and not _client.is_closed:
            return _client
    except Exception:
        pass
    _client = httpx.AsyncClient(
        timeout=httpx.Timeout(15.0, connect=5.0),
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
    )
    return _client


async def _request_with_retry(
    method: str,
    url: str,
    headers: dict[str, str],
    json_body: dict | None = None,
) -> httpx.Response:
    """Execute an HTTP request with retry on transient failures."""
    import asyncio

    client = await _get_client()
    last_exc: Exception | None = None

    for attempt in range(_MAX_RETRIES + 1):
        try:
            if method == "GET":
                resp = await client.get(url, headers=headers)
            else:
                resp = await client.post(url, headers=headers, json=json_body)
            if resp.status_code not in _RETRYABLE_STATUS:
                return resp
            logger.warning(
                "Supabase retryable status",
                extra={"extra_data": {
                    "status": resp.status_code,
                    "attempt": attempt + 1,
                    "url": url,
                }},
            )
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.WriteTimeout) as exc:
            last_exc = exc
            logger.warning(
                "Supabase network error, retrying",
                extra={"extra_data": {"attempt": attempt + 1, "error": str(exc)}},
            )

        if attempt < _MAX_RETRIES:
            await asyncio.sleep(_RETRY_DELAY_S * (attempt + 1))

    if last_exc:
        raise DatabaseError(f"Database request failed after retries: {last_exc}") from last_exc
    raise DatabaseError(f"Database request failed after retries (status {resp.status_code})")


def _headers() -> dict[str, str]:
    settings = get_settings()
    return {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {settings.supabase_anon_key}",
        "Content-Type": "application/json",
    }


async def fetch_hairstyles(active_only: bool = True) -> list[dict[str, Any]]:
    """Return the hairstyle catalog from Supabase, ordered by trend score."""
    settings = get_settings()
    url = f"{settings.supabase_rest_url}/hairstyles?order=trend_score.desc"
    if active_only:
        url += "&is_active=eq.true"
    try:
        resp = await _request_with_retry("GET", url, _headers())
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as exc:
        logger.error("fetch_hairstyles failed", exc_info=True)
        raise DatabaseError(f"Failed to fetch hairstyles: {exc}") from exc


async def fetch_hairstyle(hairstyle_id: str) -> dict[str, Any] | None:
    """Return a single hairstyle by ID, or None if not found."""
    settings = get_settings()
    url = f"{settings.supabase_rest_url}/hairstyles?id=eq.{hairstyle_id}"
    try:
        resp = await _request_with_retry("GET", url, _headers())
        resp.raise_for_status()
        data = resp.json()
        return data[0] if data else None
    except httpx.HTTPStatusError as exc:
        logger.error("fetch_hairstyle failed", exc_info=True)
        raise DatabaseError(f"Failed to fetch hairstyle: {exc}") from exc


async def fetch_recommended_hairstyles(face_shape: str) -> list[dict[str, Any]]:
    """Return hairstyles whose face_shapes array contains *face_shape*."""
    settings = get_settings()
    url = (
        f"{settings.supabase_rest_url}/hairstyles"
        f"?is_active=eq.true"
        f"&face_shapes=cs.{{\"{face_shape.lower()}\"}}"
        f"&order=trend_score.desc"
    )
    try:
        resp = await _request_with_retry("GET", url, _headers())
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as exc:
        logger.error("fetch_recommended_hairstyles failed", exc_info=True)
        raise DatabaseError(f"Failed to fetch recommended hairstyles: {exc}") from exc


async def save_try_on_result(
    user_id: str | None,
    hairstyle_id: str,
    result_image_url: str,
    face_shape: str,
) -> dict[str, Any]:
    """Insert a try-on result row and return the created record."""
    settings = get_settings()
    body = {
        "user_id": user_id,
        "hairstyle_id": hairstyle_id,
        "result_image_url": result_image_url,
        "face_shape": face_shape,
    }
    headers = {**_headers(), "Prefer": "return=representation"}
    try:
        resp = await _request_with_retry(
            "POST",
            f"{settings.supabase_rest_url}/try_on_results",
            headers,
            json_body=body,
        )
        resp.raise_for_status()
        data = resp.json()
        return data[0] if data else {}
    except httpx.HTTPStatusError as exc:
        logger.error("save_try_on_result failed", exc_info=True)
        raise DatabaseError(f"Failed to save try-on result: {exc}") from exc


async def fetch_try_on_history(
    user_id: str | None = None,
    limit: int = 20,
    include_deleted: bool = False,
) -> list[dict[str, Any]]:
    """Return try-on history, optionally filtered by user_id.

    Args:
        user_id: Filter by user (None = all).
        limit: Max results (default 20).
        include_deleted: If True, include soft-deleted records.
    """
    settings = get_settings()
    url = (
        f"{settings.supabase_rest_url}/try_on_results"
        f"?select=*,hairstyles(name,category,asset_url)"
        f"&order=created_at.desc&limit={limit}"
    )
    if user_id:
        url += f"&user_id=eq.{user_id}"
    try:
        resp = await _request_with_retry("GET", url, _headers())
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as exc:
        logger.error("fetch_try_on_history failed", exc_info=True)
        raise DatabaseError(f"Failed to fetch history: {exc}") from exc


async def close_client() -> None:
    """Clean up the shared HTTP client (call on app shutdown)."""
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
    _client = None
