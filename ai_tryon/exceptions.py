"""
AI Try-On Module — Exception Hierarchy
Clear, typed exceptions for consistent error handling across the module.
"""

from __future__ import annotations


class AITryOnError(Exception):
    """Base exception for all AI Try-On errors."""


class FaceDetectionError(AITryOnError):
    """No face detected or detection failed."""


class InvalidImageError(AITryOnError):
    """Image is corrupt, wrong format, or exceeds limits."""


class HairstyleNotFoundError(AITryOnError):
    """Requested hairstyle ID does not exist."""


class AssetLoadError(AITryOnError):
    """Hairstyle asset could not be loaded from disk or URL."""


class DatabaseError(AITryOnError):
    """Database operation failed."""


class RateLimitExceededError(AITryOnError):
    """Rate limit exceeded for this client."""
