"""
AI Try-On Module — Full Facial Analysis Suite (v3)
PRD section 5: landmarks, face shape, skin tone, hair density, beard style, hairline condition.

See repo docs/AI_TRYON_V3_INTEGRATION.md for wiring into main.py.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Sequence

import cv2
import numpy as np

from .landmark_detector import LANDMARK_INDICES, detect_landmarks
from .face_shape import FaceShapeResult, classify_from_landmarks

HAIRLINE_INDICES = {
    "center": 10,
    "left_1": 109,
    "left_2": 67,
    "left_3": 103,
    "left_temple": 54,
    "right_1": 338,
    "right_2": 297,
    "right_3": 332,
    "right_temple": 284,
    "left_peak": 108,
    "right_peak": 337,
}

BEARD_INDICES = {
    "chin": 152,
    "jaw_left": 172,
    "jaw_right": 397,
    "mouth_left": 61,
    "mouth_right": 291,
    "upper_lip": 13,
    "lower_lip": 14,
    "cheek_left": 205,
    "cheek_right": 425,
}

SKIN_SAMPLE_INDICES = [10, 116, 345, 1, 168, 205, 425]


@dataclass
class SkinToneResult:
    label: str
    fitzpatrick: int
    hex_color: str
    confidence: float
    lab: dict[str, float] = field(default_factory=dict)


@dataclass
class HairDensityResult:
    level: str
    score: float
    confidence: float
    notes: str = ""


@dataclass
class BeardStyleResult:
    style: str
    presence_score: float
    confidence: float


@dataclass
class HairlineConditionResult:
    stage: str
    norwood_estimate: int
    confidence: float
    forehead_ratio: float
    asymmetry: float
    notes: str = ""


@dataclass
class FullFaceAnalysis:
    face_shape: FaceShapeResult
    skin_tone: SkinToneResult
    hair_density: HairDensityResult
    beard: BeardStyleResult
    hairline: HairlineConditionResult
    landmarks_count: int
    face_width_px: float
    face_height_px: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "face_shape": self.face_shape.face_shape,
            "face_shape_confidence": self.face_shape.confidence,
            "face_shape_ratios": self.face_shape.ratios,
            "skin_tone": {
                "label": self.skin_tone.label,
                "fitzpatrick": self.skin_tone.fitzpatrick,
                "hex": self.skin_tone.hex_color,
                "confidence": self.skin_tone.confidence,
                "lab": self.skin_tone.lab,
            },
            "hair_density": {
                "level": self.hair_density.level,
                "score": self.hair_density.score,
                "confidence": self.hair_density.confidence,
                "notes": self.hair_density.notes,
            },
            "beard": {
                "style": self.beard.style,
                "presence_score": self.beard.presence_score,
                "confidence": self.beard.confidence,
            },
            "hairline": {
                "stage": self.hairline.stage,
                "norwood_estimate": self.hairline.norwood_estimate,
                "confidence": self.hairline.confidence,
                "forehead_ratio": self.hairline.forehead_ratio,
                "asymmetry": self.hairline.asymmetry,
                "notes": self.hairline.notes,
            },
            "landmarks_count": self.landmarks_count,
            "face_width_px": round(self.face_width_px, 1),
            "face_height_px": round(self.face_height_px, 1),
        }


def _distance(p1: Sequence[float], p2: Sequence[float]) -> float:
    return math.hypot(float(p1[0]) - float(p2[0]), float(p1[1]) - float(p2[1]))


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def _bgr_to_hex(b: float, g: float, r: float) -> str:
    return "#{:02x}{:02x}{:02x}".format(
        int(_clamp(r, 0, 255)), int(_clamp(g, 0, 255)), int(_clamp(b, 0, 255))
    )


def analyze_skin_tone(image_bgr: np.ndarray, landmarks_px: np.ndarray) -> SkinToneResult:
    h, w = image_bgr.shape[:2]
    samples: list[np.ndarray] = []
    radius = max(4, int(min(h, w) * 0.02))
    for idx in SKIN_SAMPLE_INDICES:
        if idx >= len(landmarks_px):
            continue
        x, y = int(landmarks_px[idx][0]), int(landmarks_px[idx][1])
        x0, y0 = max(0, x - radius), max(0, y - radius)
        x1, y1 = min(w, x + radius), min(h, y + radius)
        patch = image_bgr[y0:y1, x0:x1]
        if patch.size == 0:
            continue
        samples.append(patch.reshape(-1, 3))
    if not samples:
        return SkinToneResult(label="Unknown", fitzpatrick=3, hex_color="#c4a484", confidence=0.2)
    pixels = np.vstack(samples).astype(np.float32)
    gray = pixels.mean(axis=1)
    mask = (gray > 25) & (gray < 245)
    if mask.sum() < 10:
        mask = np.ones(len(pixels), dtype=bool)
    pixels = pixels[mask]
    mean_bgr = pixels.mean(axis=0)
    lab = cv2.cvtColor(mean_bgr.reshape(1, 1, 3).astype(np.uint8), cv2.COLOR_BGR2LAB)[0, 0]
    L, a, b = float(lab[0]), float(lab[1]), float(lab[2])
    if L >= 200:
        fitz, label = 1, "Type I (Very Fair)"
    elif L >= 175:
        fitz, label = 2, "Type II (Fair)"
    elif L >= 150:
        fitz, label = 3, "Type III (Light Medium)"
    elif L >= 120:
        fitz, label = 4, "Type IV (Medium)"
    elif L >= 90:
        fitz, label = 5, "Type V (Tan / Deep)"
    else:
        fitz, label = 6, "Type VI (Deep)"
    confidence = _clamp(0.55 + (len(pixels) / 5000.0) * 0.3, 0.5, 0.92)
    return SkinToneResult(
        label=label, fitzpatrick=fitz, hex_color=_bgr_to_hex(mean_bgr[0], mean_bgr[1], mean_bgr[2]),
        confidence=round(confidence, 2), lab={"L": round(L, 1), "a": round(a, 1), "b": round(b, 1)},
    )


def analyze_hair_density(image_bgr: np.ndarray, landmarks_px: np.ndarray, face_height_px: float) -> HairDensityResult:
    h, w = image_bgr.shape[:2]
    idx = LANDMARK_INDICES
    forehead_top = landmarks_px[idx["forehead_top"]]
    left = landmarks_px[idx["forehead_left"]]
    right = landmarks_px[idx["forehead_right"]]
    band_h = max(8, int(face_height_px * 0.28))
    cx = int((left[0] + right[0]) / 2)
    half_w = int(abs(right[0] - left[0]) * 0.55)
    y1 = int(max(0, forehead_top[1] - band_h))
    y2 = int(max(0, min(h, forehead_top[1] + 4)))
    x1 = int(max(0, cx - half_w))
    x2 = int(min(w, cx + half_w))
    if x2 <= x1 or y2 <= y1:
        return HairDensityResult("medium", 0.5, 0.3, "Insufficient forehead region")
    region = image_bgr[y1:y2, x1:x2]
    gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
    mean_dark = 1.0 - (float(gray.mean()) / 255.0)
    edges = cv2.Canny(gray, 40, 120)
    edge_density = float(edges.mean()) / 255.0
    score = _clamp(0.55 * mean_dark + 0.45 * edge_density * 3.0, 0.0, 1.0)
    if score >= 0.65:
        level = "high"
    elif score >= 0.45:
        level = "medium"
    elif score >= 0.28:
        level = "low"
    else:
        level = "very_low"
    return HairDensityResult(
        level=level, score=round(score, 3), confidence=0.62,
        notes="Rules-based estimate from forehead band texture; improve with trained model later.",
    )


def analyze_beard(image_bgr: np.ndarray, landmarks_px: np.ndarray) -> BeardStyleResult:
    h, w = image_bgr.shape[:2]
    bi = BEARD_INDICES

    def pt(i: int) -> tuple[int, int]:
        return int(landmarks_px[i][0]), int(landmarks_px[i][1])

    chin = pt(bi["chin"])
    jl, jr = pt(bi["jaw_left"]), pt(bi["jaw_right"])
    ul, ll = pt(bi["upper_lip"]), pt(bi["lower_lip"])
    x1 = max(0, min(jl[0], jr[0]))
    x2 = min(w, max(jl[0], jr[0]))
    y1 = max(0, min(ll[1], ul[1]) - 2)
    y2 = min(h, chin[1] + 8)
    if x2 - x1 < 10 or y2 - y1 < 10:
        return BeardStyleResult("unknown", 0.0, 0.2)
    beard_roi = image_bgr[y1:y2, x1:x2]
    gray = cv2.cvtColor(beard_roi, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 30, 100)
    texture = float(edges.mean()) / 255.0
    darkness = 1.0 - (float(gray.mean()) / 255.0)
    cl, cr = pt(bi["cheek_left"]), pt(bi["cheek_right"])
    cheek_vals = []
    for cx, cy in (cl, cr):
        r = 6
        patch = image_bgr[max(0, cy - r):min(h, cy + r), max(0, cx - r):min(w, cx + r)]
        if patch.size:
            cheek_vals.append(float(cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY).mean()))
    cheek_dark = 1.0 - (np.mean(cheek_vals) / 255.0) if cheek_vals else 0.4
    contrast = darkness - cheek_dark
    presence = _clamp(0.5 * texture * 4.0 + 0.5 * max(0.0, contrast) * 2.5, 0.0, 1.0)
    ml, mr = pt(bi["mouth_left"]), pt(bi["mouth_right"])
    mouth_w = abs(mr[0] - ml[0]) + 1e-6
    jaw_w = abs(jr[0] - jl[0]) + 1e-6
    narrow_ratio = mouth_w / jaw_w
    if presence < 0.18:
        style = "clean_shaven"
    elif presence < 0.35:
        style = "stubble"
    elif presence < 0.55:
        style = "short_beard"
    elif narrow_ratio < 0.45 and presence > 0.4:
        style = "goatee_like"
    else:
        style = "full_beard"
    return BeardStyleResult(
        style=style, presence_score=round(presence, 3),
        confidence=round(_clamp(0.5 + presence * 0.35, 0.45, 0.88), 2),
    )


def analyze_hairline(landmarks_px: np.ndarray, face_height_px: float) -> HairlineConditionResult:
    idx = LANDMARK_INDICES
    hi = HAIRLINE_INDICES
    forehead_top = landmarks_px[idx["forehead_top"]]
    chin = landmarks_px[idx["jaw_chin"]]
    eye_y = (landmarks_px[idx["left_eye_outer"]][1] + landmarks_px[idx["right_eye_outer"]][1]) / 2
    face_h = max(face_height_px, _distance(forehead_top, chin), 1.0)
    forehead_h = abs(eye_y - forehead_top[1])
    forehead_ratio = forehead_h / face_h
    left_peak = landmarks_px[hi["left_peak"]] if hi["left_peak"] < len(landmarks_px) else forehead_top
    right_peak = landmarks_px[hi["right_peak"]] if hi["right_peak"] < len(landmarks_px) else forehead_top
    center_y = forehead_top[1]
    left_drop = abs(left_peak[1] - center_y) / face_h
    right_drop = abs(right_peak[1] - center_y) / face_h
    asymmetry = abs(left_drop - right_drop)
    mean_peak_drop = (left_drop + right_drop) / 2
    if forehead_ratio < 0.28 and mean_peak_drop < 0.04:
        stage, norwood, notes, conf = "normal", 1, "Balanced forehead-to-face ratio; minimal peak drop.", 0.7
    elif forehead_ratio < 0.34 and mean_peak_drop < 0.07:
        stage, norwood, notes, conf = "early_recession", 2, "Mild temple/forehead height increase — monitor / early care.", 0.65
    elif forehead_ratio < 0.40:
        stage, norwood, notes, conf = "moderate_recession", 3, "Noticeable forehead height; consider restoration consultation.", 0.6
    else:
        stage, norwood, notes, conf = "advanced_recession", 4, "Significant forehead ratio; recommend specialist assessment.", 0.55
    if asymmetry > 0.05:
        notes += " Asymmetric hairline peaks detected."
        conf = max(0.45, conf - 0.05)
    return HairlineConditionResult(
        stage=stage, norwood_estimate=norwood, confidence=round(conf, 2),
        forehead_ratio=round(forehead_ratio, 3), asymmetry=round(asymmetry, 3), notes=notes,
    )


def analyze_full_face(image_bytes: bytes) -> FullFaceAnalysis | None:
    result = detect_landmarks(image_bytes)
    if result is None:
        return None
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return None
    landmarks_px = result.landmarks_pixels
    return FullFaceAnalysis(
        face_shape=classify_from_landmarks(landmarks_px),
        skin_tone=analyze_skin_tone(img, landmarks_px),
        hair_density=analyze_hair_density(img, landmarks_px, result.face_height_px),
        beard=analyze_beard(img, landmarks_px),
        hairline=analyze_hairline(landmarks_px, result.face_height_px),
        landmarks_count=len(result.landmarks),
        face_width_px=result.face_width_px,
        face_height_px=result.face_height_px,
    )
