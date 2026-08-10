# AI Try-On v3 — Full PRD Gap Implementation

## What this delivers (vs PRD section 5)

| Feature | Status | Where |
|---------|--------|--------|
| Facial landmarks | Enhanced | Server + **frontend MediaPipe** |
| Face shape | Yes | `faceAnalysis.ts` / `face_shape.py` |
| Skin tone | NEW | Fitzpatrick-ish from cheek/forehead samples |
| Hair density | NEW | Forehead-band texture heuristics |
| Beard style | NEW | Chin/jaw ROI texture |
| Hairline condition | NEW | Forehead ratio + peak asymmetry (Norwood-ish v1) |
| Realistic blend | Improved | Soft alpha, vertical fade, color match helpers |
| Real-time camera | NEW | Client MediaPipe VIDEO mode + canvas overlay |
| Celebrity / trend recommend | NEW | Multi-signal scorer (`recommend.py` + TS) |
| MediaPipe on frontend | PRIMARY | Browser WASM; server is fallback |

> **Honest limit:** True Norwood CNN + photorealistic neural try-on still need trained models / generative pipelines. v1 is **shippable heuristics + real MediaPipe** aligned with your build spec.

---

## Files added on this branch

### Backend (`ai_tryon/`)
- `facial_analysis.py` — full analysis suite
- `recommend.py` — ranking
- `overlay_v3_patch.py` — blend helpers (merge into `overlay.py`)
- `main_analyze_patch.py` — endpoint snippets for `main.py`

### Frontend
- `frontend/src/lib/ai/landmarks.ts`
- `frontend/src/lib/ai/faceLandmarker.ts`
- `frontend/src/lib/ai/faceAnalysis.ts`
- `frontend/src/lib/ai/overlayDraw.ts`
- `frontend/src/pages/TryOn.tsx` (v3 real MediaPipe flow)

### Dependency
```bash
cd frontend
npm install @mediapipe/tasks-vision
```

---

## Wire backend `main.py`

```python
from .facial_analysis import analyze_full_face
from .recommend import rank_hairstyles
```

Replace `analyze_face` body to call `analyze_full_face(image_bytes)` and return `full.to_dict()`.

Enhance `/ai/hairstyles/recommend` to accept `face_shape`, `hairline_stage`, `density`, `beard`, `celebrity` and call `rank_hairstyles(...)`.

See `ai_tryon/main_analyze_patch.py` for full endpoint bodies.

---

## Frontend architecture

```
User camera / photo
    → MediaPipe FaceLandmarker in BROWSER (VIDEO or IMAGE)
    → faceAnalysis.runFullAnalysis(...)
    → overlayDraw (canvas, landmark-anchored, pose roll)
    → ranked hairstyles (scoreHairstyle)
    → optional POST /ai/try-on/save
    → server POST /ai/try-on/analyze ONLY as fallback
```

---

## Definition of done

- [ ] `npm install @mediapipe/tasks-vision`
- [ ] Live camera shows landmarks-driven overlay
- [ ] Analysis panel shows face shape, skin tone, density, beard, hairline
- [ ] Recommendations reorder when analysis completes
- [ ] Upload path uses IMAGE mode MediaPipe (not random mock)
- [ ] Server `/ai/try-on/analyze` returns full JSON for fallback
