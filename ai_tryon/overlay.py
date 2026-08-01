"""
AI Try-On Module — Hairstyle Overlay Renderer
Section 4, Step 3 of the build spec.

Renders a hairstyle sprite (PNG with alpha) on top of a user photo,
anchored to the detected face bounding box.  Scales and positions
the overlay to match the face.
"""

from __future__ import annotations

import io
import math
from dataclasses import dataclass

import cv2
import numpy as np
from PIL import Image


@dataclass
class RenderConfig:
    # Vertical offset of the hairstyle relative to the top of the face bbox.
    # Negative moves the overlay up (above the forehead).
    vertical_offset_ratio: float = -0.35
    # Width of the hairstyle relative to face width
    width_ratio: float = 1.35
    # Horizontal center offset (0 = centered on face)
    horizontal_offset_ratio: float = 0.0


def render_overlay(
    user_image_bytes: bytes,
    hairstyle_image_bytes: bytes,
    config: RenderConfig | None = None,
) -> bytes | None:
    """Composite *hairstyle_image_bytes* onto *user_image_bytes*.

    Returns JPEG bytes of the result, or ``None`` if no face is found.
    """
    if config is None:
        config = RenderConfig()

    # Decode user image
    nparr = np.frombuffer(user_image_bytes, np.uint8)
    user_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if user_img is None:
        return None

    gray = cv2.cvtColor(user_img, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
    )
    if len(faces) == 0:
        return None

    face = max(faces, key=lambda f: f[2] * f[3])
    fx, fy, fw, fh = face

    # Decode hairstyle sprite (RGBA)
    try:
        hairstyle_pil = Image.open(io.BytesIO(hairstyle_image_bytes)).convert("RGBA")
    except Exception:
        return None

    # Target size
    target_w = int(fw * config.width_ratio)
    target_h = int(target_w * (hairstyle_pil.height / hairstyle_pil.width)) if hairstyle_pil.width else 0
    if target_w <= 0 or target_h <= 0:
        return None

    hairstyle_resized = hairstyle_pil.resize((target_w, target_h), Image.LANCZOS)

    # Position: center the hairstyle on the face, shifted up
    cx = fx + fw / 2 + fw * config.horizontal_offset_ratio
    top = int(fy + fh * config.vertical_offset_ratio)
    left = int(cx - target_w / 2)

    # Clamp to image bounds
    h_img, w_img = user_img.shape[:2]
    left = max(0, min(left, w_img - target_w))
    top = max(0, min(top, h_img - target_h))

    # Convert user image to RGBA
    user_rgba = cv2.cvtColor(user_img, cv2.COLOR_BGR2RGBA)
    user_pil = Image.fromarray(user_rgba, "RGBA")

    # Composite
    result_pil = user_pil.copy()
    # Create a mask for the region
    paste_box = (left, top)
    result_pil.paste(hairstyle_resized, paste_box, hairstyle_resized)

    # Convert back to JPEG bytes
    result_rgb = result_pil.convert("RGB")
    buf = io.BytesIO()
    result_rgb.save(buf, format="JPEG", quality=90)
    return buf.getvalue()
