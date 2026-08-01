"""
AI Try-On Module — Hairstyle Overlay Renderer (v2.0)
Section 4, Step 3 of the build spec.

Renders a hairstyle sprite (PNG with alpha) on top of a user photo,
anchored to real MediaPipe landmark points (hairline / crown landmarks).
Scales and positions the overlay based on actual face geometry.
Applies head-pose rotation from the facial transformation matrix.

Supports:
  - 2D transparent PNG sprites (current, improved with landmark anchoring)
  - Future 3D GLB meshes (interface prepared via OverlayRenderer protocol)
"""

from __future__ import annotations

import io
import math
from dataclasses import dataclass
from typing import Protocol

import cv2
import numpy as np
from PIL import Image, ImageFilter

from .landmark_detector import LANDMARK_INDICES, LandmarkResult


class OverlayAsset(Protocol):
    """Interface for hairstyle overlay assets (2D sprite or future 3D mesh)."""
    def render_to_image(self, width: int, height: int) -> Image.Image: ...


@dataclass
class RenderConfig:
    """Configuration for 2D sprite overlay rendering."""
    # Width of the hairstyle relative to face width (temple-to-temple).
    width_ratio: float = 1.45
    # Vertical offset: how far above the forehead top the hairstyle extends.
    # Negative moves the overlay upward (above the head).
    vertical_offset_ratio: float = -0.15
    # Soft-edge feather radius (pixels) for natural blending at edges.
    feather_radius: float = 2.0
    # Whether to apply head-pose rotation from the transformation matrix.
    apply_head_pose: bool = True


def _compute_anchor(
    landmarks_px: np.ndarray,
    face_width: float,
    config: RenderConfig,
) -> tuple[int, int, int, int]:
    """Compute the anchor position and target size for the hairstyle overlay.

    Uses landmark 10 (forehead top / crown) as the vertical anchor and
    landmarks 54/284 (temples) for horizontal centering and width scaling.

    Returns (left, top, target_w, target_h).
    """
    idx = LANDMARK_INDICES

    forehead_top = landmarks_px[idx["forehead_top"]]
    temple_left = landmarks_px[idx["forehead_left"]]
    temple_right = landmarks_px[idx["forehead_right"]]

    face_center_x = (temple_left[0] + temple_right[0]) / 2
    forehead_top_y = forehead_top[1]

    target_w = int(face_width * config.width_ratio)

    # Vertical position: start above the forehead top
    anchor_y = int(forehead_top_y + face_width * config.vertical_offset_ratio)

    return int(face_center_x), anchor_y, target_w, 0  # target_h computed after resize


def _apply_rotation(
    image: Image.Image,
    transform_matrix: np.ndarray | None,
    config: RenderConfig,
) -> Image.Image:
    """Apply head-pose rotation to the hairstyle sprite.

    Extracts the yaw and roll from the 4x4 transformation matrix and
    rotates the sprite image accordingly. This makes the overlay track
    head rotation in real time.
    """
    if not config.apply_head_pose or transform_matrix is None:
        return image

    # Extract rotation from the 4x4 matrix (upper-left 3x3 block)
    rot = transform_matrix[:3, :3]

    # Decompose into Euler angles (simplified: extract roll from the matrix)
    # Roll = rotation around Z axis (in-plane rotation)
    roll = math.atan2(rot[1, 0], rot[0, 0])
    # Yaw = rotation around Y axis (left-right head turn)
    yaw = math.atan2(-rot[2, 0], math.sqrt(rot[2, 1] ** 2 + rot[2, 2] ** 2))

    # Only apply in-plane roll for 2D sprites (yaw/pitch would need 3D mesh)
    roll_deg = math.degrees(roll)

    if abs(roll_deg) < 0.5:
        return image

    # Rotate with transparent background, expanding canvas to fit
    rotated = image.rotate(
        -roll_deg,
        resample=Image.BICUBIC,
        expand=True,
        fillcolor=(0, 0, 0, 0),
    )
    return rotated


def _feather_alpha(sprite: Image.Image, radius: float) -> Image.Image:
    """Apply a soft-edge feather to the alpha channel for natural blending."""
    if radius <= 0:
        return sprite
    return sprite.filter(ImageFilter.GaussianBlur(radius))


def render_overlay_from_landmarks(
    user_image_bytes: bytes,
    hairstyle_image_bytes: bytes,
    landmark_result: LandmarkResult,
    config: RenderConfig | None = None,
) -> bytes | None:
    """Composite a hairstyle sprite onto a user photo using real landmarks.

    Args:
        user_image_bytes: JPEG/PNG bytes of the user's photo.
        hairstyle_image_bytes: PNG bytes of the hairstyle sprite (with alpha).
        landmark_result: MediaPipe landmark detection result.
        config: Rendering configuration.

    Returns:
        JPEG bytes of the composited result, or ``None`` on failure.
    """
    if config is None:
        config = RenderConfig()

    # Decode user image
    nparr = np.frombuffer(user_image_bytes, np.uint8)
    user_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if user_img is None:
        return None

    h_img, w_img = user_img.shape[:2]

    # Decode hairstyle sprite (RGBA)
    try:
        hairstyle_pil = Image.open(io.BytesIO(hairstyle_image_bytes)).convert("RGBA")
    except Exception:
        return None

    # Compute anchor from landmarks
    center_x, anchor_y, target_w, _ = _compute_anchor(
        landmark_result.landmarks_pixels,
        landmark_result.face_width_px,
        config,
    )

    # Resize hairstyle to target width, maintain aspect ratio
    if hairstyle_pil.width == 0:
        return None
    target_h = int(target_w * (hairstyle_pil.height / hairstyle_pil.width))
    if target_w <= 0 or target_h <= 0:
        return None

    hairstyle_resized = hairstyle_pil.resize((target_w, target_h), Image.LANCZOS)

    # Apply head-pose rotation
    hairstyle_resized = _apply_rotation(
        hairstyle_resized,
        landmark_result.transformation_matrix,
        config,
    )

    # Recalculate dimensions after rotation (may have expanded)
    rotated_w, rotated_h = hairstyle_resized.size

    # Position: center horizontally on face, anchor vertically at forehead
    left = int(center_x - rotated_w / 2)
    top = int(anchor_y - rotated_h * 0.3)  # sprite extends above and below anchor

    # Clamp to image bounds (allow partial overflow for natural look)
    left = max(-rotated_w // 4, min(left, w_img - rotated_w * 3 // 4))
    top = max(-rotated_h // 4, min(top, h_img - rotated_h * 3 // 4))

    # Convert user image to RGBA
    user_rgba = cv2.cvtColor(user_img, cv2.COLOR_BGR2RGBA)
    user_pil = Image.fromarray(user_rgba, "RGBA")

    # Feather edges for soft blending
    hairstyle_feathered = _feather_alpha(hairstyle_resized, config.feather_radius)

    # Composite
    result_pil = user_pil.copy()
    result_pil.paste(hairstyle_feathered, (left, top), hairstyle_feathered)

    # Convert to JPEG
    result_rgb = result_pil.convert("RGB")
    buf = io.BytesIO()
    result_rgb.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def render_overlay(
    user_image_bytes: bytes,
    hairstyle_image_bytes: bytes,
    config: RenderConfig | None = None,
) -> bytes | None:
    """Server-side fallback: detect landmarks via MediaPipe, then render.

    This is the backward-compatible entry point. It runs MediaPipe detection
    internally and delegates to ``render_overlay_from_landmarks``.

    Returns JPEG bytes of the result, or ``None`` if no face is found.
    """
    from .landmark_detector import detect_landmarks

    landmark_result = detect_landmarks(user_image_bytes)
    if landmark_result is None:
        return None

    return render_overlay_from_landmarks(
        user_image_bytes,
        hairstyle_image_bytes,
        landmark_result,
        config,
    )
