"""
AI Try-On Module — Supabase client wrapper
Handles all database operations for hairstyles and try-on results.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

# Load .env from project root
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_ANON_KEY", "")

REST_URL = f"{SUPABASE_URL}/rest/v1"

_HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
}


async def fetch_hairstyles(active_only: bool = True) -> list[dict[str, Any]]:
    """Return the hairstyle catalog from Supabase."""
    url = f"{REST_URL}/hairstyles?order=trend_score.desc"
    if active_only:
        url += "&is_active=eq.true"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=_HEADERS, timeout=15)
        resp.raise_for_status()
        return resp.json()


async def fetch_hairstyle(hairstyle_id: str) -> dict[str, Any] | None:
    url = f"{REST_URL}/hairstyles?id=eq.{hairstyle_id}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=_HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        return data[0] if data else None


async def fetch_recommended_hairstyles(face_shape: str) -> list[dict[str, Any]]:
    """Return hairstyles whose face_shapes array contains *face_shape*."""
    url = (
        f"{REST_URL}/hairstyles"
        f"?is_active=eq.true"
        f"&face_shapes=cs.{{\"{face_shape.lower()}\"}}"
        f"&order=trend_score.desc"
    )
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=_HEADERS, timeout=15)
        resp.raise_for_status()
        return resp.json()


async def save_try_on_result(
    user_id: str | None,
    hairstyle_id: str,
    result_image_url: str,
    face_shape: str,
) -> dict[str, Any]:
    """Insert a try-on result row."""
    body = {
        "user_id": user_id,
        "hairstyle_id": hairstyle_id,
        "result_image_url": result_image_url,
        "face_shape": face_shape,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{REST_URL}/try_on_results",
            json=body,
            headers={**_HEADERS, "Prefer": "return=representation"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return data[0] if data else {}


async def fetch_try_on_history(user_id: str | None = None) -> list[dict[str, Any]]:
    url = (
        f"{REST_URL}/try_on_results"
        f"?select=*,hairstyles(name,category,asset_url)"
        f"&order=created_at.desc&limit=20"
    )
    if user_id:
        url += f"&user_id=eq.{user_id}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=_HEADERS, timeout=15)
        resp.raise_for_status()
        return resp.json()
