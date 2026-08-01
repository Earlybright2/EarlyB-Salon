"""Pytest configuration — resets shared state between tests."""

import pytest

from ai_tryon.config import get_settings
from ai_tryon import db


@pytest.fixture(autouse=True)
def reset_state():
    """Reset cached settings and HTTP client before each test."""
    get_settings.cache_clear()
    db._client = None
    yield
    db._client = None
