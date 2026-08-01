"""
AI Try-On Module — Main FastAPI Application (v2.0)
Production-ready endpoints with validation, rate limiting, structured logging,
request ID tracking, and proper error handling.

Endpoints:
  GET  /health                 → health check
  GET  /ai/hairstyles          → catalog (with optional face_shape filter)
  GET  /ai/hairstyles/recommend → filtered by face_shape
  GET  /ai/hairstyles/{id}     → single style detail
  POST /ai/try-on/analyze      → detect face shape from uploaded photo
  POST /ai/try-on/render       → render hairstyle overlay on photo
  POST /ai/try-on/save         → save result to database
  GET  /ai/try-on/history      → user's saved looks
  GET  /                        → serves the web UI
"""

from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import cv2
import numpy as np
from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from . import db
from .config import get_settings
from .exceptions import (
    AITryOnError,
    AssetLoadError,
    FaceDetectionError,
    HairstyleNotFoundError,
    InvalidImageError,
)
from .face_shape import classify_face_shape
from .landmark_detector import detect_landmarks
from .logging_config import logger, set_request_id
from .overlay import render_overlay_from_landmarks, RenderConfig

settings = get_settings()

# ─── Rate limiter ─────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)


# ─── App lifespan ─────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Try-On starting up", extra={"extra_data": {
        "log_level": settings.log_level,
        "max_upload_mb": settings.max_upload_bytes // (1024 * 1024),
    }})
    settings.resolved_upload_dir.mkdir(parents=True, exist_ok=True)
    yield
    await db.close_client()
    logger.info("AI Try-On shut down")


app = FastAPI(
    title="Early Bright — AI Try-On",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", settings.request_id_header],
)

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
UPLOAD_DIR = settings.resolved_upload_dir
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ─── Middleware: Request ID tracking ─────────────────────────────

@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    rid = request.headers.get(settings.request_id_header) or uuid.uuid4().hex[:12]
    set_request_id(rid)

    response = await call_next(request)
    response.headers[settings.request_id_header] = rid
    return response


# ─── Exception handlers ───────────────────────────────────────────

@app.exception_handler(AITryOnError)
async def ai_tryon_error_handler(request: Request, exc: AITryOnError):
    logger.error("AI Try-On error", extra={"extra_data": {
        "error_type": type(exc).__name__,
        "message": str(exc),
    }})
    status_map = {
        FaceDetectionError: 422,
        InvalidImageError: 400,
        HairstyleNotFoundError: 404,
        AssetLoadError: 500,
    }
    status = status_map.get(type(exc), 500)
    return JSONResponse(
        status_code=status,
        content={"detail": str(exc), "error_type": type(exc).__name__},
    )


# ─── Validation helpers ───────────────────────────────────────────

async def _validate_upload(photo: UploadFile) -> bytes:
    """Validate file size, MIME type, and image dimensions. Return bytes."""
    # Check MIME type
    if photo.content_type not in settings.allowed_mime_types:
        raise InvalidImageError(
            f"Unsupported file type: {photo.content_type}. "
            f"Allowed: {', '.join(sorted(settings.allowed_mime_types))}"
        )

    # Read bytes
    image_bytes = await photo.read()

    # Check file size
    if len(image_bytes) > settings.max_upload_bytes:
        raise InvalidImageError(
            f"File too large ({len(image_bytes)} bytes). "
            f"Max: {settings.max_upload_bytes // (1024 * 1024)} MB"
        )

    # Validate image can be decoded and check dimensions
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise InvalidImageError("Corrupt or invalid image file.")

    h, w = img.shape[:2]
    if w < settings.min_image_dimension or h < settings.min_image_dimension:
        raise InvalidImageError(
            f"Image too small ({w}x{h}). "
            f"Minimum: {settings.min_image_dimension}x{settings.min_image_dimension}"
        )
    if w > settings.max_image_dimension or h > settings.max_image_dimension:
        raise InvalidImageError(
            f"Image too large ({w}x{h}). "
            f"Maximum: {settings.max_image_dimension}x{settings.max_image_dimension}"
        )

    logger.info("Image validated", extra={"extra_data": {
        "width": w, "height": h, "bytes": len(image_bytes),
    }})
    return image_bytes


def _load_hairstyle_asset(asset_url: str) -> bytes | None:
    """Load a hairstyle sprite from disk (static/hairstyles/) or URL."""
    if not asset_url:
        return None

    local_path = asset_url.lstrip("/")
    full_local = STATIC_DIR / local_path
    if full_local.exists():
        return full_local.read_bytes()

    if asset_url.startswith("http"):
        import httpx
        try:
            resp = httpx.get(asset_url, timeout=15)
            if resp.status_code == 200:
                return resp.content
        except Exception:
            pass

    return None


# ─── Health ───────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "mediapipe": True,
    }


# ─── Hairstyle catalog ────────────────────────────────────────────

@app.get("/ai/hairstyles")
@limiter.limit(settings.rate_limit_default)
async def get_hairstyles(request: Request, face_shape: str | None = None):
    """GET /ai/hairstyles → catalog. Optional ?face_shape=oval for recommendations."""
    try:
        if face_shape:
            data = await db.fetch_recommended_hairstyles(face_shape)
        else:
            data = await db.fetch_hairstyles()
        return data
    except Exception as exc:
        if isinstance(exc, AITryOnError):
            raise
        logger.error("Hairstyles endpoint failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch hairstyles") from exc


@app.get("/ai/hairstyles/recommend")
@limiter.limit(settings.rate_limit_default)
async def recommend_hairstyles(request: Request, face_shape: str):
    """GET /ai/hairstyles/recommend?face_shape=oval → filtered catalog."""
    try:
        data = await db.fetch_recommended_hairstyles(face_shape)
        return data
    except Exception as exc:
        if isinstance(exc, AITryOnError):
            raise
        logger.error("Recommend endpoint failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch recommendations") from exc


@app.get("/ai/hairstyles/{hairstyle_id}")
@limiter.limit(settings.rate_limit_default)
async def get_hairstyle(request: Request, hairstyle_id: str):
    """GET /ai/hairstyles/{id} → single style detail."""
    try:
        data = await db.fetch_hairstyle(hairstyle_id)
        if not data:
            raise HairstyleNotFoundError(f"Hairstyle '{hairstyle_id}' not found")
        return data
    except AITryOnError:
        raise
    except Exception as exc:
        logger.error("Get hairstyle failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch hairstyle") from exc


# ─── Face analysis ────────────────────────────────────────────────

@app.post("/ai/try-on/analyze")
@limiter.limit(settings.rate_limit_analyze)
async def analyze_face(request: Request, photo: UploadFile = File(...)):
    """POST /ai/try-on/analyze → detect face shape from uploaded photo.

    Uses MediaPipe Face Landmarker (468-point model) for detection.
    Returns face shape, confidence, and raw geometric ratios.
    """
    image_bytes = await _validate_upload(photo)

    try:
        result = classify_face_shape(image_bytes)
    except FaceDetectionError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if result is None:
        raise HTTPException(
            status_code=422,
            detail="No face detected in the image. Please use a clear front-facing photo.",
        )

    logger.info("Face analyzed", extra={"extra_data": {
        "face_shape": result.face_shape,
        "confidence": result.confidence,
    }})

    return {
        "face_shape": result.face_shape,
        "confidence": result.confidence,
        "ratios": result.ratios,
    }


# ─── Overlay rendering ───────────────────────────────────────────

@app.post("/ai/try-on/render")
@limiter.limit(settings.rate_limit_render)
async def try_on_render(
    request: Request,
    photo: UploadFile = File(...),
    hairstyle_id: str = Form(...),
):
    """POST /ai/try-on/render → render hairstyle overlay on the uploaded photo.

    Uses MediaPipe landmarks for precise positioning and head-pose tracking.
    Returns a URL to the rendered result image.
    """
    image_bytes = await _validate_upload(photo)

    # Fetch hairstyle
    try:
        hairstyle = await db.fetch_hairstyle(hairstyle_id)
    except Exception as exc:
        if isinstance(exc, AITryOnError):
            raise
        raise HTTPException(status_code=500, detail="Failed to fetch hairstyle") from exc

    if not hairstyle:
        raise HairstyleNotFoundError(f"Hairstyle '{hairstyle_id}' not found")

    asset_url = hairstyle.get("asset_url", "")
    hairstyle_bytes = _load_hairstyle_asset(asset_url)
    if hairstyle_bytes is None:
        raise AssetLoadError(f"Hairstyle asset not found: {asset_url}")

    # Detect landmarks
    try:
        landmark_result = detect_landmarks(image_bytes)
    except FaceDetectionError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if landmark_result is None:
        raise HTTPException(
            status_code=422,
            detail="No face detected in the photo. Please use a clear front-facing photo.",
        )

    # Render overlay
    result_bytes = render_overlay_from_landmarks(
        image_bytes,
        hairstyle_bytes,
        landmark_result,
        RenderConfig(),
    )
    if result_bytes is None:
        raise HTTPException(status_code=500, detail="Failed to render overlay.")

    # Save result to disk
    result_id = uuid.uuid4().hex[:12]
    result_filename = f"result_{result_id}.jpg"
    result_path = UPLOAD_DIR / result_filename
    result_path.write_bytes(result_bytes)

    # Classify face shape for the response
    from .face_shape import classify_from_landmarks
    face_result = classify_from_landmarks(landmark_result.landmarks_pixels)

    result_url = f"/static/results/{result_filename}"

    logger.info("Overlay rendered", extra={"extra_data": {
        "hairstyle_id": hairstyle_id,
        "result_url": result_url,
        "face_shape": face_result.face_shape,
    }})

    return {
        "result_url": result_url,
        "face_shape": face_result.face_shape,
        "hairstyle_id": hairstyle_id,
        "hairstyle_name": hairstyle.get("name"),
        "landmarks_count": len(landmark_result.landmarks),
        "face_width_px": round(landmark_result.face_width_px, 1),
        "face_height_px": round(landmark_result.face_height_px, 1),
    }


# ─── Save result ─────────────────────────────────────────────────

@app.post("/ai/try-on/save")
@limiter.limit(settings.rate_limit_default)
async def save_try_on(
    request: Request,
    hairstyle_id: str = Form(...),
    result_image_url: str = Form(...),
    face_shape: str = Form(...),
    user_id: str | None = Form(None),
):
    """POST /ai/try-on/save → persist result to Supabase."""
    base_url = str(request.base_url).rstrip("/")
    full_url = (
        f"{base_url}{result_image_url}"
        if not result_image_url.startswith("http")
        else result_image_url
    )

    try:
        saved = await db.save_try_on_result(
            user_id=user_id,
            hairstyle_id=hairstyle_id,
            result_image_url=full_url,
            face_shape=face_shape,
        )
    except Exception as exc:
        if isinstance(exc, AITryOnError):
            raise
        logger.error("Save failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save result") from exc

    logger.info("Result saved", extra={"extra_data": {
        "hairstyle_id": hairstyle_id,
        "face_shape": face_shape,
    }})

    return {"success": True, "result": saved}


# ─── History ─────────────────────────────────────────────────────

@app.get("/ai/try-on/history")
@limiter.limit(settings.rate_limit_default)
async def try_on_history(request: Request, user_id: str | None = None):
    """GET /ai/try-on/history → user's saved looks."""
    try:
        data = await db.fetch_try_on_history(user_id)
        return data
    except Exception as exc:
        if isinstance(exc, AITryOnError):
            raise
        logger.error("History failed", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch history") from exc


# ─── Web UI ──────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def index():
    """Serve the web UI."""
    index_path = STATIC_DIR / "index.html"
    return FileResponse(index_path)
