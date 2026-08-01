# AI Try-On Module — Early Bright Salon

Production-ready AI hairstyle try-on module built with Python (FastAPI) and
MediaPipe Face Landmarker (468-point model).

## Features

- **MediaPipe Face Landmarker** — 468-point facial landmark detection with
  head-pose transformation matrix extraction
- **Face shape classification** — rules-based classifier using real landmark
  geometry (Oval, Round, Square, Heart, Diamond, Oblong)
- **Hairstyle overlay rendering** — landmark-anchored compositing with
  head-pose rotation tracking and soft-edge feathering
- **Photo upload + live camera** — both modes supported
- **Production hardening** — input validation, rate limiting, structured
  JSON logging, request ID tracking, typed exception hierarchy
- **Supabase integration** — hairstyle catalog + try-on result persistence
  with RLS policies
- **Unit + API tests** — 28 tests covering core logic and endpoints

## Quick Start

```bash
# Install dependencies
pip install -r ai_tryon/requirements.txt

# Run the server
python -m uvicorn ai_tryon.main:app --host 0.0.0.0 --port 8001

# Open the web UI
open http://localhost:8001
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/ai/hairstyles` | Hairstyle catalog (optional `?face_shape=oval`) |
| GET | `/ai/hairstyles/recommend` | Recommended styles (`?face_shape=oval`) |
| GET | `/ai/hairstyles/{id}` | Single hairstyle detail |
| POST | `/ai/try-on/analyze` | Detect face shape from photo |
| POST | `/ai/try-on/render` | Render hairstyle overlay on photo |
| POST | `/ai/try-on/save` | Save try-on result to database |
| GET | `/ai/try-on/history` | Retrieve saved looks |

## Configuration

All settings are loaded from the project `.env` file via Pydantic Settings:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `MAX_UPLOAD_BYTES` | Max upload size (default 8MB) |
| `RATE_LIMIT_ANALYZE` | Rate limit for analyze endpoint |
| `RATE_LIMIT_RENDER` | Rate limit for render endpoint |
| `LOG_LEVEL` | Logging level (default INFO) |

## Testing

```bash
python -m pytest ai_tryon/tests/ -v
```

## Architecture

```
ai_tryon/
├── __init__.py
├── config.py              # Pydantic Settings (env-driven)
├── exceptions.py          # Typed exception hierarchy
├── logging_config.py       # Structured JSON logging + request ID
├── landmark_detector.py   # MediaPipe FaceLandmarker wrapper
├── face_shape.py          # Rules-based classifier (real landmarks)
├── overlay.py             # Landmark-anchored hairstyle renderer
├── db.py                  # Supabase data layer (httpx + retries)
├── main.py                # FastAPI app (endpoints, validation, rate limit)
├── generate_sprites.py    # Hairstyle PNG sprite generator (utility)
├── requirements.txt
├── FRONTEND_INTEGRATION.md # Client-side MediaPipe + Three.js guide
├── static/
│   ├── index.html          # Web UI (photo upload + live camera)
│   ├── hairstyles/         # Hairstyle sprite PNGs
│   └── results/            # Rendered result images
└── tests/
    ├── test_face_shape.py  # Unit tests for classifier
    ├── test_overlay.py     # Unit tests for renderer
    └── test_api.py         # API tests with TestClient
```

## Client-Side Integration

For real-time live camera try-on, run MediaPipe FaceLandmarker client-side
in the browser. See `FRONTEND_INTEGRATION.md` for the full guide with
TypeScript examples for MediaPipe initialization, face shape classification,
and Three.js overlay rendering.
