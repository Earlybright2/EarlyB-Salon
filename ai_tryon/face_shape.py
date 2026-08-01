"""
AI Try-On Module — Face Shape Classifier (v2.0)
Rules-based classifier using real MediaPipe 468-point landmark geometry.

Implements section 4, Step 2 of the build spec:
  - face_length / face_width   → tall vs. round
  - jaw_width / cheekbone_width → tapered vs. square jaw
  - forehead_width / jaw_width  → heart vs. oblong

Uses actual landmark indices (forehead, cheekbones, jaw, chin) instead of
bounding-box approximations. Pure function — no I/O, easily testable.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Sequence

import numpy as np

from .landmark_detector import LANDMARK_INDICES, LandmarkResult


@dataclass
class FaceShapeResult:
    face_shape: str          # OVAL, ROUND, SQUARE, HEART, DIAMOND, OBLONG
    confidence: float        # 0.0 – 1.0
    ratios: dict             # raw ratio values for debugging / future ML


VALID_SHAPES = frozenset({"OVAL", "ROUND", "SQUARE", "HEART", "DIAMOND", "OBLONG"})


def _distance(p1: Sequence[float], p2: Sequence[float]) -> float:
    """Euclidean distance between two 2D points."""
    return math.hypot(p1[0] - p2[0], p1[1] - p2[1])


def _extract_measurements(landmarks_px: np.ndarray) -> dict[str, float]:
    """Extract facial measurement widths from real landmark pixel coordinates.

    Measurements:
      - forehead_width:  temple-to-temple (landmarks 54 ↔ 284)
      - cheekbone_width:  cheekbone-to-cheekbone (landmarks 116 ↔ 345)
      - jaw_width:        jaw-angle-to-jaw-angle (landmarks 172 ↔ 397)
      - face_length:      forehead-top to chin (landmarks 10 ↔ 152)
    """
    idx = LANDMARK_INDICES

    forehead_width = _distance(
        landmarks_px[idx["forehead_left"]],
        landmarks_px[idx["forehead_right"]],
    )
    cheekbone_width = _distance(
        landmarks_px[idx["cheekbone_left"]],
        landmarks_px[idx["cheekbone_right"]],
    )
    jaw_width = _distance(
        landmarks_px[idx["jaw_left"]],
        landmarks_px[idx["jaw_right"]],
    )
    face_length = _distance(
        landmarks_px[idx["forehead_top"]],
        landmarks_px[idx["jaw_chin"]],
    )

    return {
        "forehead_width": forehead_width,
        "cheekbone_width": cheekbone_width,
        "jaw_width": jaw_width,
        "face_length": face_length,
    }


def classify_from_landmarks(landmarks_px: np.ndarray) -> FaceShapeResult:
    """Classify face shape from MediaPipe landmark pixel coordinates.

    This is the pure, testable function — no I/O, no image decoding.
    Pass in the landmarks_pixels array from ``LandmarkResult``.

    Args:
        landmarks_px: numpy array of shape (468, 2) with pixel (x, y) coords.

    Returns:
        FaceShapeResult with shape, confidence, and raw ratios.
    """
    measurements = _extract_measurements(landmarks_px)

    fw = measurements["forehead_width"]
    cw = measurements["cheekbone_width"]
    jw = measurements["jaw_width"]
    fl = measurements["face_length"]

    # Guard against division by zero
    eps = 1e-6

    ratio_len_width = fl / max(cw, eps)           # face_length / cheekbone_width
    ratio_jaw_cheek = jw / max(cw, eps)             # jaw_width / cheekbone_width
    ratio_forehead_jaw = fw / max(jw, eps)          # forehead_width / jaw_width

    # ─── Decision tree (section 4, Step 2 of the build spec) ───────
    #
    # The thresholds are based on standard facial proportion literature.
    # Confidence is derived from how far the ratio is from the boundary.

    shape = "OVAL"
    confidence = 0.70

    if ratio_len_width > 1.5:
        # Face is notably taller than wide → oblong
        shape = "OBLONG"
        confidence = min(0.95, 0.60 + (ratio_len_width - 1.5) * 0.35)

    elif ratio_len_width < 1.1:
        # Face is nearly as wide as it is tall → round
        shape = "ROUND"
        confidence = min(0.95, 0.60 + (1.1 - ratio_len_width) * 0.35)

    elif ratio_jaw_cheek > 0.85:
        # Jaw is nearly as wide as cheekbones → square
        shape = "SQUARE"
        confidence = min(0.95, 0.60 + (ratio_jaw_cheek - 0.85) * 0.35)

    elif ratio_forehead_jaw > 1.35:
        # Forehead significantly wider than jaw → heart
        shape = "HEART"
        confidence = min(0.95, 0.60 + (ratio_forehead_jaw - 1.35) * 0.35)

    elif ratio_jaw_cheek < 0.62:
        # Jaw significantly narrower than cheekbones → diamond
        shape = "DIAMOND"
        confidence = min(0.95, 0.60 + (0.62 - ratio_jaw_cheek) * 0.35)

    else:
        # Balanced proportions → oval
        shape = "OVAL"
        confidence = 0.75

    return FaceShapeResult(
        face_shape=shape,
        confidence=round(confidence, 2),
        ratios={
            "face_length_width": round(ratio_len_width, 3),
            "jaw_cheekbone": round(ratio_jaw_cheek, 3),
            "forehead_jaw": round(ratio_forehead_jaw, 3),
        },
    )


def classify_face_shape(image_bytes: bytes) -> FaceShapeResult | None:
    """Detect the face in *image_bytes* via MediaPipe and classify its shape.

    Returns ``None`` when no face is detected.
    This is the server-side fallback path — the frontend can also run
    MediaPipe client-side and call ``classify_from_landmarks`` directly.
    """
    from .landmark_detector import detect_landmarks

    result = detect_landmarks(image_bytes)
    if result is None:
        return None

    return classify_from_landmarks(result.landmarks_pixels)
