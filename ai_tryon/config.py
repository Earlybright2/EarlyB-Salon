"""
AI Try-On Module — Configuration
Centralized settings using Pydantic Settings, loaded from environment / .env.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ─── Supabase ──────────────────────────────────────────────
    supabase_url: str = Field("", alias="VITE_SUPABASE_URL")
    supabase_anon_key: str = Field("", alias="VITE_SUPABASE_ANON_KEY")

    # ─── MediaPipe ─────────────────────────────────────────────
    mediapipe_model_path: str = (
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/"
        "face_landmarker/float16/1/face_landmarker.task"
    )
    mediapipe_local_cache: str = "/tmp/mediapipe_face_landmarker.task"
    mediapipe_num_faces: int = 1
    mediapipe_min_detection_confidence: float = 0.5
    mediapipe_min_tracking_confidence: float = 0.5

    # ─── Upload limits ─────────────────────────────────────────
    max_upload_bytes: int = 8 * 1024 * 1024  # 8 MB
    allowed_mime_types: frozenset[str] = frozenset({
        "image/jpeg",
        "image/png",
        "image/webp",
    })
    min_image_dimension: int = 100
    max_image_dimension: int = 4096

    # ─── Rate limiting ─────────────────────────────────────────
    rate_limit_analyze: str = "30/minute"
    rate_limit_render: str = "20/minute"
    rate_limit_default: str = "100/minute"

    # ─── Storage ───────────────────────────────────────────────
    upload_dir: str = ""
    result_quality: int = 90

    # ─── Observability ─────────────────────────────────────────
    log_level: str = "INFO"
    request_id_header: str = "X-Request-ID"

    @property
    def supabase_rest_url(self) -> str:
        return f"{self.supabase_url}/rest/v1"

    @property
    def resolved_upload_dir(self) -> Path:
        if self.upload_dir:
            return Path(self.upload_dir)
        return Path(__file__).resolve().parent / "static" / "results"


@lru_cache
def get_settings() -> Settings:
    return Settings()
