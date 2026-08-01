"""
AI Try-On Module — MediaPipe Face Landmarker Detector
Wraps the MediaPipe FaceLandmarker (468-point model) for server-side use.
Downloads and caches the model file on first use.
"""

from __future__ import annotations

import os
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from .config import get_settings
from .exceptions import FaceDetectionError
from .logging_config import logger

# MediaPipe FaceLandmarker key landmark indices (468-point model).
# These indices are from the canonical MediaPipe Face Mesh topology.
LANDMARK_INDICES = {
    # Hairline / forehead boundary
    "forehead_left": 54,        # left temple
    "forehead_right": 284,      # right temple
    "forehead_top": 10,          # center top of forehead
    "forehead_center": 9,        # center forehead

    # Cheekbones (widest part of face)
    "cheekbone_left": 116,       # left cheekbone
    "cheekbone_right": 345,      # right cheekbone

    # Jaw
    "jaw_left": 172,             # left jaw angle
    "jaw_right": 397,            # right jaw angle
    "jaw_chin": 152,             # chin tip
    "jaw_left_mid": 136,         # left jaw mid
    "jaw_right_mid": 365,        # right jaw mid

    # Face center / nose
    "nose_tip": 1,
    "nose_bridge": 168,

    # Eyes (for orientation reference)
    "left_eye_outer": 33,
    "right_eye_outer": 263,

    # Crown / top of head (approximate — extrapolated above forehead)
    "crown": 10,
}


@dataclass
class LandmarkResult:
    """Result of MediaPipe face landmark detection."""
    landmarks: np.ndarray          # shape (468, 3) — normalized (x, y, z)
    landmarks_pixels: np.ndarray   # shape (468, 2) — pixel (x, y)
    transformation_matrix: np.ndarray | None  # 4x4 head pose matrix
    face_width_px: float           # face width in pixels (temple to temple)
    face_height_px: float          # face height in pixels (forehead to chin)
    image_width: int
    image_height: int


# ─── Model cache ──────────────────────────────────────────────────

_model_cache: Any | None = None
_model_path_cached: str | None = None


def _ensure_model_downloaded(model_url: str, local_path: str) -> str:
    """Download the model file if not already cached locally."""
    if os.path.exists(local_path):
        logger.info("MediaPipe model found in cache", extra={"extra_data": {"path": local_path}})
        return local_path

    logger.info("Downloading MediaPipe Face Landmarker model", extra={"extra_data": {"url": model_url}})
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    try:
        urllib.request.urlretrieve(model_url, local_path)
        logger.info("Model downloaded successfully", extra={"extra_data": {
            "path": local_path,
            "size_bytes": os.path.getsize(local_path),
        }})
        return local_path
    except Exception as exc:
        raise FaceDetectionError(f"Failed to download MediaPipe model: {exc}") from exc


def _get_landmarker() -> Any:
    """Lazily initialize and cache the MediaPipe FaceLandmarker."""
    global _model_cache, _model_path_cached

    settings = get_settings()
    model_path = _ensure_model_downloaded(
        settings.mediapipe_model_path,
        settings.mediapipe_local_cache,
    )

    if _model_cache is not None and _model_path_cached == model_path:
        return _model_cache

    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision

    base_options = mp_python.BaseOptions(
        model_asset_path=model_path,
    )
    options = mp_vision.FaceLandmarkerOptions(
        base_options=base_options,
        running_mode=mp_vision.RunningMode.IMAGE,
        num_faces=settings.mediapipe_num_faces,
        min_face_detection_confidence=settings.mediapipe_min_detection_confidence,
        min_tracking_confidence=settings.mediapipe_min_tracking_confidence,
        output_facial_transformation_matrixes=True,
    )

    _model_cache = mp_vision.FaceLandmarker.create_from_options(options)
    _model_path_cached = model_path
    logger.info("MediaPipe FaceLandmarker initialized")
    return _model_cache


def detect_landmarks(image_bytes: bytes) -> LandmarkResult | None:
    """Run MediaPipe FaceLandmarker on *image_bytes*.

    Returns ``LandmarkResult`` if a face is found, ``None`` otherwise.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return None

    h, w = img.shape[:2]

    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision

    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=img,
    )

    try:
        landmarker = _get_landmarker()
        result = landmarker.detect(mp_image)
    except Exception as exc:
        logger.error("MediaPipe detection failed", exc_info=True)
        raise FaceDetectionError(f"Face detection failed: {exc}") from exc

    if not result.face_landmarks:
        return None

    # Take the first (largest) face
    landmarks = result.face_landmarks[0]  # list of 468 NormalizedLandmark

    # Convert to numpy arrays
    landmarks_norm = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    landmarks_pixels = np.array([[lm.x * w, lm.y * h] for lm in landmarks], dtype=np.float32)

    # Transformation matrix
    transform_matrix = None
    if result.facial_transformation_matrixes:
        matrix_data = result.facial_transformation_matrixes[0]
        transform_matrix = np.array(matrix_data, dtype=np.float32).reshape(4, 4)

    # Face measurements in pixels
    forehead_left = landmarks_pixels[LANDMARK_INDICES["forehead_left"]]
    forehead_right = landmarks_pixels[LANDMARK_INDICES["forehead_right"]]
    chin = landmarks_pixels[LANDMARK_INDICES["jaw_chin"]]
    forehead_top = landmarks_pixels[LANDMARK_INDICES["forehead_top"]]

    face_width = float(np.linalg.norm(forehead_right - forehead_left))
    face_height = float(np.linalg.norm(chin - forehead_top))

    return LandmarkResult(
        landmarks=landmarks_norm,
        landmarks_pixels=landmarks_pixels,
        transformation_matrix=transform_matrix,
        face_width_px=face_width,
        face_height_px=face_height,
        image_width=w,
        image_height=h,
    )
