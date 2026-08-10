"""Secure image upload validation helpers."""

from __future__ import annotations

import hashlib

from django.core.exceptions import ValidationError

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_image_upload(file) -> None:
    if getattr(file, "size", 0) > MAX_FILE_SIZE:
        raise ValidationError("File exceeds 5 MB limit.")
    content_type = getattr(file, "content_type", None) or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise ValidationError("Only JPEG, PNG, WebP allowed.")
    file.seek(0)
    magic = file.read(12)
    file.seek(0)
    if not (
        magic.startswith(b"\xff\xd8\xff")
        or magic.startswith(b"\x89PNG")
        or magic.startswith(b"RIFF")
    ):
        raise ValidationError("File is not a valid image.")


def hashed_upload_name(file, original_name: str = "") -> str:
    file.seek(0)
    digest = hashlib.sha256(file.read()).hexdigest()
    file.seek(0)
    ext = (original_name or getattr(file, "name", "bin")).rsplit(".", 1)[-1].lower()
    if ext not in {"jpg", "jpeg", "png", "webp"}:
        ext = "bin"
    if ext == "jpeg":
        ext = "jpg"
    return f"{digest}.{ext}"
