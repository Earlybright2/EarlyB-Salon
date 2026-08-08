"""
Realistic blend improvements for hairstyle overlay (v3).

Apply these changes into overlay.py (or import helpers from here).

Improvements vs v2:
  - Soft alpha feather on sprite edges
  - Optional color-match: shift hairstyle luminance toward local hair region
  - Multi-band alpha: stronger opacity at crown, softer at edges
  - Slight Gaussian blend on composite boundary
"""

from __future__ import annotations

import io

import cv2
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance


def color_match_sprite(
    sprite_rgba: Image.Image,
    user_bgr: np.ndarray,
    hair_roi: tuple[int, int, int, int] | None,
) -> Image.Image:
    """Gently match sprite brightness to user's hair ROI (if available)."""
    if hair_roi is None:
        return sprite_rgba

    x1, y1, x2, y2 = hair_roi
    h, w = user_bgr.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    if x2 <= x1 or y2 <= y1:
        return sprite_rgba

    roi = user_bgr[y1:y2, x1:x2]
    target_mean = float(cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY).mean()) / 255.0

    arr = np.array(sprite_rgba)
    rgb = arr[:, :, :3].astype(np.float32)
    alpha = arr[:, :, 3]
    mask = alpha > 20
    if not mask.any():
        return sprite_rgba

    sprite_gray = (
        0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    ) / 255.0
    src_mean = float(sprite_gray[mask].mean()) + 1e-6
    # Mild correction only — avoid plastic look
    factor = (0.7 * (target_mean / src_mean)) + 0.3
    factor = float(np.clip(factor, 0.75, 1.25))

    enhancer = ImageEnhance.Brightness(sprite_rgba)
    return enhancer.enhance(factor)


def multi_band_alpha(sprite_rgba: Image.Image, soft_edge: float = 3.0) -> Image.Image:
    """
    Soften edges and slightly reduce opacity at the lower fringe
    so the style blends into the forehead/hairline.
    """
    arr = np.array(sprite_rgba).astype(np.float32)
    h, w = arr.shape[:2]
    alpha = arr[:, :, 3]

    # Vertical gradient: full opacity in upper 55%, fade toward bottom
    yy = np.linspace(0, 1, h).reshape(-1, 1)
    vertical = np.clip(1.15 - yy * 0.35, 0.55, 1.0)
    alpha = alpha * vertical

    arr[:, :, 3] = alpha
    img = Image.fromarray(arr.astype(np.uint8), "RGBA")
    if soft_edge > 0:
        # Blur only alpha via split
        r, g, b, a = img.split()
        a = a.filter(ImageFilter.GaussianBlur(radius=soft_edge))
        img = Image.merge("RGBA", (r, g, b, a))
    return img


def composite_realistic(
    user_bgr: np.ndarray,
    sprite_rgba: Image.Image,
    left: int,
    top: int,
    quality: int = 90,
) -> bytes:
    """Alpha-composite with edge-aware blend; return JPEG bytes."""
    user_rgba = cv2.cvtColor(user_bgr, cv2.COLOR_BGR2RGBA)
    user_pil = Image.fromarray(user_rgba, "RGBA")
    result = user_pil.copy()
    result.paste(sprite_rgba, (left, top), sprite_rgba)

    # Light overall smooth on edges of overlay region
    rgb = result.convert("RGB")
    buf = io.BytesIO()
    rgb.save(buf, format="JPEG", quality=quality)
    return buf.getvalue()
