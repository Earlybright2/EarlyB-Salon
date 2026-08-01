"""
Unit tests for face_shape.py — tests the pure classify_from_landmarks function
with synthetic landmark data representing different face shapes.
"""

import numpy as np
import pytest

from ai_tryon.face_shape import classify_from_landmarks, FaceShapeResult, VALID_SHAPES


def _make_landmarks(
    forehead_w: float = 100,
    cheekbone_w: float = 110,
    jaw_w: float = 80,
    face_len: float = 130,
) -> np.ndarray:
    """Build a synthetic 468-point landmark array with controlled measurements.

    Only the key landmark indices used by the classifier are set to meaningful
    positions; the rest are zeroed. This lets us test the decision tree in
    isolation without needing real face images.
    """
    from ai_tryon.landmark_detector import LANDMARK_INDICES

    landmarks = np.zeros((468, 2), dtype=np.float32)
    cx, cy = 200, 200

    idx = LANDMARK_INDICES

    # Forehead (temple to temple)
    landmarks[idx["forehead_left"]] = [cx - forehead_w / 2, cy - 50]
    landmarks[idx["forehead_right"]] = [cx + forehead_w / 2, cy - 50]
    landmarks[idx["forehead_top"]] = [cx, cy - 60]

    # Cheekbones
    landmarks[idx["cheekbone_left"]] = [cx - cheekbone_w / 2, cy]
    landmarks[idx["cheekbone_right"]] = [cx + cheekbone_w / 2, cy]

    # Jaw
    landmarks[idx["jaw_left"]] = [cx - jaw_w / 2, cy + 60]
    landmarks[idx["jaw_right"]] = [cx + jaw_w / 2, cy + 60]
    landmarks[idx["jaw_chin"]] = [cx, cy + face_len - 60]

    return landmarks


class TestClassifyFromLandmarks:
    def test_oval_face(self):
        """Balanced proportions → OVAL."""
        landmarks = _make_landmarks(
            forehead_w=100, cheekbone_w=105, jaw_w=80, face_len=130
        )
        result = classify_from_landmarks(landmarks)
        assert result.face_shape == "OVAL"
        assert 0 <= result.confidence <= 1
        assert "face_length_width" in result.ratios
        assert "jaw_cheekbone" in result.ratios
        assert "forehead_jaw" in result.ratios

    def test_round_face(self):
        """Face length ≈ face width → ROUND."""
        landmarks = _make_landmarks(
            forehead_w=110, cheekbone_w=120, jaw_w=95, face_len=115
        )
        result = classify_from_landmarks(landmarks)
        assert result.face_shape == "ROUND"

    def test_oblong_face(self):
        """Face much taller than wide → OBLONG."""
        landmarks = _make_landmarks(
            forehead_w=80, cheekbone_w=85, jaw_w=65, face_len=160
        )
        result = classify_from_landmarks(landmarks)
        assert result.face_shape == "OBLONG"

    def test_square_face(self):
        """Jaw nearly as wide as cheekbones → SQUARE."""
        landmarks = _make_landmarks(
            forehead_w=100, cheekbone_w=105, jaw_w=98, face_len=130
        )
        result = classify_from_landmarks(landmarks)
        assert result.face_shape == "SQUARE"

    def test_heart_face(self):
        """Forehead much wider than jaw → HEART."""
        landmarks = _make_landmarks(
            forehead_w=120, cheekbone_w=110, jaw_w=75, face_len=130
        )
        result = classify_from_landmarks(landmarks)
        assert result.face_shape == "HEART"

    def test_diamond_face(self):
        """Jaw much narrower than cheekbones, forehead also narrow → DIAMOND."""
        landmarks = _make_landmarks(
            forehead_w=70, cheekbone_w=120, jaw_w=60, face_len=135
        )
        result = classify_from_landmarks(landmarks)
        assert result.face_shape == "DIAMOND"

    def test_confidence_range(self):
        """Confidence should always be between 0 and 1."""
        landmarks = _make_landmarks()
        result = classify_from_landmarks(landmarks)
        assert 0.0 <= result.confidence <= 1.0

    def test_returns_valid_shape(self):
        """Output shape must be one of the 6 valid shapes."""
        landmarks = _make_landmarks()
        result = classify_from_landmarks(landmarks)
        assert result.face_shape in VALID_SHAPES

    def test_ratios_are_floats(self):
        """Ratios should be rounded floats."""
        landmarks = _make_landmarks()
        result = classify_from_landmarks(landmarks)
        for key, val in result.ratios.items():
            assert isinstance(val, float)
            assert val > 0
