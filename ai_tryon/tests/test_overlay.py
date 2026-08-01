"""
Unit tests for overlay.py — tests the render_overlay_from_landmarks function
with synthetic images and landmark data.
"""

import io

import numpy as np
import pytest
from PIL import Image

from ai_tryon.overlay import (
    render_overlay_from_landmarks,
    render_overlay,
    RenderConfig,
    _compute_anchor,
    _apply_rotation,
)
from ai_tryon.landmark_detector import LANDMARK_INDICES, LandmarkResult


def _make_test_image(width: int = 400, height: int = 400) -> bytes:
    """Create a simple JPEG test image (solid background with a face-like oval)."""
    img = Image.new("RGB", (width, height), (50, 50, 50))
    # Draw a skin-tone oval
    draw = ImageDraw = __import__("PIL.ImageDraw", fromlist=["ImageDraw"]).ImageDraw(img)
    draw.ellipse([100, 80, 300, 360], fill=(180, 140, 120))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _make_hairstyle_sprite(width: int = 200, height: int = 150) -> bytes:
    """Create a transparent PNG hairstyle sprite for testing."""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = __import__("PIL.ImageDraw", fromlist=["ImageDraw"]).ImageDraw(img)
    draw.ellipse([10, 10, width - 10, height - 10], fill=(60, 40, 30, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _make_landmark_result(width: int = 400, height: int = 400) -> LandmarkResult:
    """Create a synthetic LandmarkResult for testing."""
    landmarks = np.zeros((468, 2), dtype=np.float32)
    cx, cy = width / 2, height / 2

    idx = LANDMARK_INDICES
    landmarks[idx["forehead_left"]] = [cx - 50, cy - 80]
    landmarks[idx["forehead_right"]] = [cx + 50, cy - 80]
    landmarks[idx["forehead_top"]] = [cx, cy - 90]
    landmarks[idx["cheekbone_left"]] = [cx - 55, cy]
    landmarks[idx["cheekbone_right"]] = [cx + 55, cy]
    landmarks[idx["jaw_left"]] = [cx - 40, cy + 70]
    landmarks[idx["jaw_right"]] = [cx + 40, cy + 70]
    landmarks[idx["jaw_chin"]] = [cx, cy + 90]

    landmarks_norm = np.zeros((468, 3), dtype=np.float32)
    landmarks_norm[:, 0] = landmarks[:, 0] / width
    landmarks_norm[:, 1] = landmarks[:, 1] / height

    return LandmarkResult(
        landmarks=landmarks_norm,
        landmarks_pixels=landmarks,
        transformation_matrix=None,
        face_width_px=100.0,
        face_height_px=180.0,
        image_width=width,
        image_height=height,
    )


class TestComputeAnchor:
    def test_returns_four_ints(self):
        landmarks = np.zeros((468, 2), dtype=np.float32)
        from ai_tryon.landmark_detector import LANDMARK_INDICES
        idx = LANDMARK_INDICES
        cx = 200
        landmarks[idx["forehead_left"]] = [cx - 50, 150]
        landmarks[idx["forehead_right"]] = [cx + 50, 150]
        landmarks[idx["forehead_top"]] = [cx, 140]

        center_x, anchor_y, target_w, target_h = _compute_anchor(
            landmarks, face_width=100, config=RenderConfig()
        )
        assert isinstance(center_x, int)
        assert isinstance(anchor_y, int)
        assert isinstance(target_w, int)
        assert target_w > 0


class TestApplyRotation:
    def test_no_matrix_returns_unchanged(self):
        img = Image.new("RGBA", (100, 100), (255, 0, 0, 255))
        result = _apply_rotation(img, None, RenderConfig(apply_head_pose=True))
        assert result.size == img.size

    def test_identity_matrix_returns_unchanged(self):
        img = Image.new("RGBA", (100, 100), (255, 0, 0, 255))
        identity = np.eye(4, dtype=np.float32)
        result = _apply_rotation(img, identity, RenderConfig(apply_head_pose=True))
        assert result.size == img.size

    def test_disabled_returns_unchanged(self):
        img = Image.new("RGBA", (100, 100), (255, 0, 0, 255))
        identity = np.eye(4, dtype=np.float32)
        result = _apply_rotation(img, identity, RenderConfig(apply_head_pose=False))
        assert result.size == img.size


class TestRenderOverlayFromLandmarks:
    def test_renders_valid_jpeg(self):
        user_bytes = _make_test_image()
        sprite_bytes = _make_hairstyle_sprite()
        landmark_result = _make_landmark_result()

        result = render_overlay_from_landmarks(
            user_bytes, sprite_bytes, landmark_result, RenderConfig()
        )

        assert result is not None
        assert len(result) > 0
        # Verify it's a valid JPEG
        img = Image.open(io.BytesIO(result))
        assert img.format == "JPEG"

    def test_invalid_user_image_returns_none(self):
        sprite_bytes = _make_hairstyle_sprite()
        landmark_result = _make_landmark_result()
        result = render_overlay_from_landmarks(
            b"not an image", sprite_bytes, landmark_result
        )
        assert result is None

    def test_invalid_sprite_returns_none(self):
        user_bytes = _make_test_image()
        landmark_result = _make_landmark_result()
        result = render_overlay_from_landmarks(
            user_bytes, b"not an image", landmark_result
        )
        assert result is None

    def test_custom_config(self):
        user_bytes = _make_test_image()
        sprite_bytes = _make_hairstyle_sprite()
        landmark_result = _make_landmark_result()

        config = RenderConfig(
            width_ratio=1.8,
            vertical_offset_ratio=-0.2,
            feather_radius=3.0,
        )
        result = render_overlay_from_landmarks(
            user_bytes, sprite_bytes, landmark_result, config
        )
        assert result is not None
