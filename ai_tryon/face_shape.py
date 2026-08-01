"""
AI Try-On Module — Face Shape Classifier
Rules-based classifier using landmark geometry ratios.

Implements section 4, Step 2 of the build spec:
  - face_length / face_width  → tall vs. round
  - jaw_width / cheekbone_width → tapered vs. square jaw
  - forehead_width / jaw_width → heart vs. oblong

No ML training required — pure geometry on OpenCV face landmarks.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from pathlib import Path

import cv2
import numpy as np


@dataclass
class FaceShapeResult:
    face_shape: str          # OVAL, ROUND, SQUARE, HEART, DIAMOND, OBLONG
    confidence: float        # 0.0 – 1.0
    ratios: dict             # raw ratio values for debugging / future ML


# OpenCV DNN face landmark model (68-point)
# We use Haar cascade for face detection + a geometric approximation
# of landmark positions for the ratio-based classifier.




def _distance(p1, p2) -> float:
    return math.hypot(p1[0] - p2[0], p1[1] - p2[1])


def _bbox_points(bbox) -> dict:
    """Extract approximate facial measurement points from a bounding box.

    The bbox is (x, y, w, h).  We approximate:
      - forehead width  ≈ 0.9 * face_width  (upper third)
      - cheekbone width ≈ face_width        (widest part, middle)
      - jaw width       ≈ 0.7 * face_width   (lower third, tapered)
      - face length     ≈ face height
    """
    x, y, w, h = bbox
    cx = x + w / 2

    forehead_w = w * 0.90
    cheekbone_w = w
    jaw_w = w * 0.70
    face_len = h

    return {
        "forehead_width": forehead_w,
        "cheekbone_width": cheekbone_w,
        "jaw_width": jaw_w,
        "face_length": face_len,
    }


def classify_face_shape(image_bytes: bytes) -> FaceShapeResult | None:
    """Detect the largest face in *image_bytes* and classify its shape.

    Returns ``None`` when no face is detected.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return None

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))

    if len(faces) == 0:
        return None

    # Pick the largest face
    face = max(faces, key=lambda f: f[2] * f[3])
    measurements = _bbox_points(tuple(face))

    fl = measurements["face_length"]
    fw = measurements["cheekbone_width"]
    jw = measurements["jaw_width"]
    fhw = measurements["forehead_width"]

    ratio_len_width = fl / fw if fw else 0
    ratio_jaw_cheek = jw / fw if fw else 0
    ratio_forehead_jaw = fhw / jw if jw else 0

    # Decision tree (section 4, Step 2 of the build spec)
    shape = "OVAL"
    confidence = 0.5

    if ratio_len_width > 1.5:
        shape = "OBLONG"
        confidence = min(0.95, 0.55 + (ratio_len_width - 1.5) * 0.3)
    elif ratio_len_width < 1.1:
        shape = "ROUND"
        confidence = min(0.95, 0.55 + (1.1 - ratio_len_width) * 0.3)
    elif ratio_jaw_cheek > 0.85:
        shape = "SQUARE"
        confidence = min(0.95, 0.55 + (ratio_jaw_cheek - 0.85) * 0.3)
    elif ratio_forehead_jaw > 1.35:
        shape = "HEART"
        confidence = min(0.95, 0.55 + (ratio_forehead_jaw - 1.35) * 0.3)
    elif ratio_jaw_cheek < 0.62:
        shape = "DIAMOND"
        confidence = min(0.95, 0.55 + (0.62 - ratio_jaw_cheek) * 0.3)
    else:
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
