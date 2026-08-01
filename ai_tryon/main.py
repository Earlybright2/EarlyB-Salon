"""
AI Try-On Module — Main FastAPI Application
Implements all endpoints from section 4, Step 4 of the build spec.

Endpoints:
  GET  /ai/hairstyles            → catalog (with optional face_shape filter)
  GET  /ai/hairstyles/{id}       → single style detail
  GET  /ai/hairstyles/recommend  → filtered by face_shape
  POST /ai/try-on/analyze        → detect face shape from uploaded photo
  POST /ai/try-on/render         → render hairstyle overlay on photo
  POST /ai/try-on/save           → save result to database
  GET  /ai/try-on/history        → user's saved looks
  GET  /                         → serves the web UI
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from . import db
from .face_shape import classify_face_shape
from .overlay import render_overlay, RenderConfig

app = FastAPI(title="Early Bright — AI Try-On", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
ASSETS_DIR = STATIC_DIR / "hairstyles"
UPLOAD_DIR = STATIC_DIR / "results"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ─── Hairstyle catalog ────────────────────────────────────────────

@app.get("/ai/hairstyles")
async def get_hairstyles(face_shape: str | None = None):
    """GET /ai/hairstyles → catalog.  Optional ?face_shape=oval for recommendations."""
    if face_shape:
        data = await db.fetch_recommended_hairstyles(face_shape)
    else:
        data = await db.fetch_hairstyles()
    return data


@app.get("/ai/hairstyles/recommend")
async def recommend_hairstyles(face_shape: str):
    """GET /ai/hairstyles/recommend?face_shape=oval → filtered catalog."""
    data = await db.fetch_recommended_hairstyles(face_shape)
    return data


@app.get("/ai/hairstyles/{hairstyle_id}")
async def get_hairstyle(hairstyle_id: str):
    data = await db.fetch_hairstyle(hairstyle_id)
    if not data:
        raise HTTPException(status_code=404, detail="Hairstyle not found")
    return data


# ─── Face analysis ────────────────────────────────────────────────

@app.post("/ai/try-on/analyze")
async def analyze_face(photo: UploadFile = File(...)):
    """POST /ai/try-on/analyze → detect face shape from uploaded photo."""
    image_bytes = await photo.read()
    result = classify_face_shape(image_bytes)
    if result is None:
        raise HTTPException(status_code=422, detail="No face detected in the image. Please use a clear front-facing photo.")
    return {
        "face_shape": result.face_shape,
        "confidence": result.confidence,
        "ratios": result.ratios,
    }


# ─── Overlay rendering ───────────────────────────────────────────

@app.post("/ai/try-on/render")
async def try_on_render(
    photo: UploadFile = File(...),
    hairstyle_id: str = Form(...),
):
    """POST /ai/try-on/render → render hairstyle overlay on the uploaded photo.

    Returns a URL to the rendered result image.
    """
    image_bytes = await photo.read()

    # Fetch hairstyle asset
    hairstyle = await db.fetch_hairstyle(hairstyle_id)
    if not hairstyle:
        raise HTTPException(status_code=404, detail="Hairstyle not found")

    asset_url = hairstyle.get("asset_url", "")
    hairstyle_bytes = _load_hairstyle_asset(asset_url)
    if hairstyle_bytes is None:
        raise HTTPException(status_code=500, detail="Hairstyle asset not found on server")

    result_bytes = render_overlay(image_bytes, hairstyle_bytes, RenderConfig())
    if result_bytes is None:
        raise HTTPException(status_code=422, detail="No face detected in the photo.")

    # Save result to disk
    result_id = uuid.uuid4().hex[:12]
    result_filename = f"result_{result_id}.jpg"
    result_path = UPLOAD_DIR / result_filename
    result_path.write_bytes(result_bytes)

    # Also detect face shape for the response
    face_result = classify_face_shape(image_bytes)
    face_shape = face_result.face_shape if face_result else "UNKNOWN"

    result_url = f"/static/results/{result_filename}"

    return {
        "result_url": result_url,
        "face_shape": face_shape,
        "hairstyle_id": hairstyle_id,
        "hairstyle_name": hairstyle.get("name"),
    }


# ─── Save result ─────────────────────────────────────────────────

@app.post("/ai/try-on/save")
async def save_try_on(
    request: Request,
    hairstyle_id: str = Form(...),
    result_image_url: str = Form(...),
    face_shape: str = Form(...),
    user_id: str | None = Form(None),
):
    """POST /ai/try-on/save → persist result to Supabase."""
    base_url = str(request.base_url).rstrip("/")
    full_url = f"{base_url}{result_image_url}" if not result_image_url.startswith("http") else result_image_url

    saved = await db.save_try_on_result(
        user_id=user_id,
        hairstyle_id=hairstyle_id,
        result_image_url=full_url,
        face_shape=face_shape,
    )
    return {"success": True, "result": saved}


# ─── History ─────────────────────────────────────────────────────

@app.get("/ai/try-on/history")
async def try_on_history(user_id: str | None = None):
    """GET /ai/try-on/history → user's saved looks."""
    data = await db.fetch_try_on_history(user_id)
    return data


# ─── Web UI ──────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def index():
    index_path = STATIC_DIR / "index.html"
    return FileResponse(index_path)


# ─── Helpers ─────────────────────────────────────────────────────

def _load_hairstyle_asset(asset_url: str) -> bytes | None:
    """Load a hairstyle sprite from disk (static/hairstyles/) or URL."""
    if not asset_url:
        return None

    # Strip leading slash for local files
    local_path = asset_url.lstrip("/")

    # Try local file first
    full_local = STATIC_DIR / local_path
    if full_local.exists():
        return full_local.read_bytes()

    # Try as URL (for assets hosted remotely)
    if asset_url.startswith("http"):
        import httpx
        try:
            resp = httpx.get(asset_url, timeout=15)
            if resp.status_code == 200:
                return resp.content
        except Exception:
            pass

    return None
