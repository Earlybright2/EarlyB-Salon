"""
Django settings for EarlyB Salon (Phase 0 hardened).
"""

import os
import secrets
from pathlib import Path

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Required secrets ────────────────────────────────────────────────────────
# No hardcoded insecure defaults. SECRET_KEY must be set via environment.
# In DEBUG (local) we auto-generate a temporary key if missing so the app can
# still start; in production (DEBUG=False) missing SECRET_KEY is a hard error.
_secret = config("SECRET_KEY", default=None)
DEBUG = config("DEBUG", default=False, cast=bool)

if not _secret:
    if not DEBUG:
        raise ValueError(
            "SECRET_KEY environment variable is required for production deployment. "
            "Generate one with: python -c \"from django.core.management.utils "
            "import get_random_secret_key; print(get_random_secret_key())\""
        )
    SECRET_KEY = secrets.token_urlsafe(50)
    print(
        "⚠️  WARNING: Using auto-generated SECRET_KEY for development. "
        "Set SECRET_KEY in .env for production."
    )
else:
    SECRET_KEY = _secret

JWT_SECRET = config("JWT_SECRET")

ALLOWED_HOSTS = config("ALLOWED_HOSTS", cast=Csv())

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "apps.users",
    "apps.shop",
    "apps.dashboard",
    "apps.search",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
AUTH_USER_MODEL = "users.User"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="earlyb_salon"),
        "USER": config("DB_USER", default="postgres"),
        "PASSWORD": config("DB_PASSWORD", default=""),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
    }
}

SESSION_COOKIE_NAME = "session_id"
SESSION_COOKIE_HTTPONLY = True
REFRESH_COOKIE_NAME = "refresh_id"
CSRF_COOKIE_HTTPONLY = True

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7
JWT_ACCESS_EXPIRATION_MINUTES = config("JWT_ACCESS_EXPIRATION_MINUTES", default=15, cast=int)
JWT_REFRESH_EXPIRATION_DAYS = config("JWT_REFRESH_EXPIRATION_DAYS", default=7, cast=int)

APP_ID = config("APP_ID", default="earlyb-web")
OWNER_UNION_ID = config("OWNER_UNION_ID", default="")

GOOGLE_CLIENT_ID = config("GOOGLE_CLIENT_ID", default="")
GOOGLE_CLIENT_SECRET = config("GOOGLE_CLIENT_SECRET", default="")
APPLE_CLIENT_ID = config("APPLE_CLIENT_ID", default="")
APPLE_TEAM_ID = config("APPLE_TEAM_ID", default="")
APPLE_KEY_ID = config("APPLE_KEY_ID", default="")
APPLE_PRIVATE_KEY = config("APPLE_PRIVATE_KEY", default="").replace("\\n", "\n")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.users.authentication.SessionJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "EXCEPTION_HANDLER": "config.exceptions.api_exception_handler",
}

CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", cast=Csv())
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = config("CSRF_TRUSTED_ORIGINS", cast=Csv())

# Baseline security headers (always on)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 10},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

EMAIL_BACKEND = config(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = config("EMAIL_HOST", default="localhost")
EMAIL_PORT = config("EMAIL_PORT", default=1025, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=False, cast=bool)
DEFAULT_FROM_EMAIL = config(
    "DEFAULT_FROM_EMAIL",
    default="Early Bright <noreply@earlybright.com>",
)

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "earlyb-ratelimit",
    }
}

(BASE_DIR / "logs").mkdir(parents=True, exist_ok=True)

# ============================================================================
# ── PRODUCTION SECURITY SETTINGS ──────────────────────────────────────────
# ============================================================================
if not DEBUG:
    SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", default=31536000, cast=int)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = config(
        "SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True, cast=bool
    )
    SECURE_HSTS_PRELOAD = config("SECURE_HSTS_PRELOAD", default=True, cast=bool)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
else:
    SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=False, cast=bool)
    SECURE_HSTS_SECONDS = 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

# ============================================================================
# ── LOGGING ───────────────────────────────────────────────────────────────
# ============================================================================
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {asctime} {message}",
            "style": "{",
        },
        "security": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        },
    },
    "filters": {
        "require_debug_false": {
            "()": "django.utils.log.RequireDebugFalse",
        },
        "require_debug_true": {
            "()": "django.utils.log.RequireDebugTrue",
        },
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
        "security_file": {
            "level": "WARNING",
            "class": "logging.FileHandler",
            "filename": str(BASE_DIR / "logs" / "security.log"),
            "formatter": "security",
        },
        "file": {
            "level": "INFO",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": str(BASE_DIR / "logs" / "django.log"),
            "maxBytes": 1024 * 1024 * 10,
            "backupCount": 10,
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": os.getenv("DJANGO_LOG_LEVEL", "INFO"),
            "propagate": False,
        },
        "earlyb.security": {
            "handlers": ["security_file", "console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}

# ── Typesense search ────────────────────────────────────────────────────────
TYPESENSE_HOST = config("TYPESENSE_HOST", default="localhost")
TYPESENSE_PORT = config("TYPESENSE_PORT", default=8108, cast=int)
TYPESENSE_PROTOCOL = config("TYPESENSE_PROTOCOL", default="http")
TYPESENSE_API_KEY = config("TYPESENSE_API_KEY", default="xyz")
