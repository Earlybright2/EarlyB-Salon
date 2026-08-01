# Early Bright Shop — AI Try-On Module
## Standalone Engineering Build Spec (extracted from Blueprint §2.3, §8.2, §12.2)
**For: Dev handoff — build in isolation, then integrate into monorepo**

---

## 1. What "AI Try-On" Actually Means Here

Don't build one big black box. It's four separate pieces wired together:

| # | Piece | What it does | Buildable without custom training? |
|---|-------|---------------|--------------------------------------|
| 1 | **Face detection & landmarking** | Finds the face, tracks 468 points on it in real time | ✅ Yes — use Google's pretrained MediaPipe FaceMesh |
| 2 | **Face shape classifier** | Oval / Round / Square / Heart / Diamond / Oblong | ✅ Yes (rules-based on landmark geometry) → ⬆️ later upgrade to trained model |
| 3 | **Hairstyle overlay renderer** | Draws the chosen hairstyle on the live video/photo, matching head rotation | ✅ Yes — Three.js + a 2D/3D asset per style |
| 4 | **Hairline stage (Norwood) analyzer** | Classifies recession pattern for the restoration module | ❌ No — this genuinely needs a trained CNN + labeled dataset |

**Recommendation for your dev:** build #1–#3 first as the MVP Try-On. That's the "Book This Look" screen (§8.2) and it needs **zero custom model training** — it's pretrained MediaPipe + geometry math + Three.js rendering. #4 (Norwood hairline analysis) is a separate, harder ML project — treat it as its own milestone, not part of "try-on."

---

## 2. Architecture (MVP scope)

```
┌─────────────────────────────────────────────────────────────┐
│  BROWSER (Next.js 14 app, route: app/(customer)/try-on/)    │
│                                                               │
│  Camera/Photo Input                                          │
│        │                                                     │
│        ▼                                                     │
│  MediaPipe FaceMesh (runs client-side, WASM)                 │
│   → outputs 468 (x,y,z) landmark points every frame          │
│        │                                                     │
│        ▼                                                     │
│  Face Shape Classifier (JS, geometry rules — see §4)         │
│        │                                                     │
│        ▼                                                     │
│  Three.js WebGL Overlay                                      │
│   → positions hairstyle mesh/sprite using landmark anchors   │
│   → rotates/scales overlay to match head pose in real time   │
│        │                                                     │
│        ▼                                                     │
│  Result shown to user → "Save" or "Book This Look"           │
│        │                                                     │
│        ▼                                                     │
│  POST /ai/try-on/save  →  Node/Express API  →  PostgreSQL    │
└─────────────────────────────────────────────────────────────┘
```

Key point: **all the "AI" in the MVP runs in the browser.** No GPU server, no Python inference service needed yet. The backend's only job is to store the result and serve the hairstyle catalog. This matches Blueprint §12.2's note that MediaPipe FaceMesh is "JavaScript client-side for real-time."

---

## 3. Tech Stack (exact, per Blueprint Appendix A)

```
Frontend:      Next.js 14 (App Router), TypeScript 5
Face tracking: @mediapipe/tasks-vision (FaceLandmarker, 468-point model)
3D/overlay:    Three.js
State:         Zustand
Backend:       Node 20, Express 5, Prisma 5, PostgreSQL 16
Storage:       AWS S3 (or local disk for dev) — hairstyle assets + saved try-on photos
```

Install for the dev:
```bash
npm install @mediapipe/tasks-vision three @react-three/fiber @react-three/drei
```

---

## 4. Step-by-Step Implementation

### Step 1 — Face landmark detection (no training required)
Use Google's **FaceLandmarker** task from `@mediapipe/tasks-vision`. It's a pretrained model Google ships as a `.task` file — you download it, you don't train it.

```ts
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
);
const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  },
  runningMode: "VIDEO",
  numFaces: 1,
});
```
Feed it each video frame → get back 468 normalized (x, y, z) landmarks + a `facialTransformationMatrix` (head rotation/position). That transformation matrix is exactly what you use to rotate the hairstyle overlay so it tracks head movement.

### Step 2 — Face shape classification (rules-based, no training)
Compute simple ratios from specific landmark indices (forehead width, cheekbone width, jaw width, face length). This is standard geometry, not ML:

- `face_length / face_width` → tall vs. round
- `jaw_width / cheekbone_width` → tapered vs. square jaw
- `forehead_width / jaw_width` → heart vs. oblong

Feed these 3 ratios into a small decision-tree (a few `if/else` thresholds is genuinely enough for v1 — this is what most consumer hairstyle apps actually do under the hood). Output: `{face_shape: "OVAL", confidence: 0.82}`.

> This satisfies Blueprint §2.3 point 2 ("Classifies face shape") without any dataset or training pipeline. It won't be perfect, but it's shippable in week one and improvable later.

### Step 3 — Hairstyle overlay rendering (Three.js)
For each hairstyle in the catalog, you need an **asset** — either:
- **2D sprite** (PNG with transparency, quicker to build a catalog of, good enough for MVP), or
- **3D mesh** (GLB/GLTF model, better realism, more production cost per style)

Recommend starting with 2D sprites for speed of catalog-building, since Early Bright needs dozens of styles fast, and 3D asset creation per hairstyle is expensive.

Anchor the sprite to landmark points around the hairline/crown (MediaPipe gives you those specific indices), then each frame:
```ts
overlayMesh.position.copy(anchorFromLandmarks(landmarks));
overlayMesh.quaternion.setFromRotationMatrix(facialTransformationMatrix);
overlayMesh.scale.setScalar(faceWidthInPixels / referenceFaceWidth);
```

### Step 4 — Wire to the API (per Blueprint §"AI System" endpoints)
```
POST /ai/try-on/save          → { userId, hairstyleId, resultImageUrl, faceShape }
GET  /ai/try-on/history        → user's saved looks
GET  /ai/hairstyles            → catalog (with filters: face_shapes[], category)
GET  /ai/hairstyles/:id        → single style detail + asset URL
GET  /ai/hairstyles/recommend  → filtered by the face_shape computed in Step 2
```
Rate limit per Blueprint §"1688": `POST /ai/hairstyles/try-on → 100 requests/hour`.

### Step 5 — Database (Prisma models the dev needs)
Minimum tables to support this module (aligns with Blueprint's schema, §~1009–1040):
```prisma
model Hairstyle {
  id           String   @id @default(uuid())
  name         String
  category     String
  assetUrl     String   // sprite/GLB in S3
  faceShapes   String[] // compatible face shapes
  arOverlayParams Json?  // anchor points, scale reference
}

model TryOnResult {
  id           String   @id @default(uuid())
  userId       String
  hairstyleId  String
  resultImageUrl String
  faceShape    String?
  createdAt    DateTime @default(now())
}
```

---

## 5. Where Real Training Comes In (Phase 2, separate milestone)

Your dev should NOT scope this into the try-on MVP. But since you asked directly: yes, it's possible, here's what it actually takes, if/when you want it:

**A. Better face shape classifier (upgrade from rules → ML)**
- Collect a labeled dataset: a few thousand face images tagged with shape (oval/round/etc). You likely have to label these yourselves or license a dataset — no good open dataset exists specifically for this.
- Train a lightweight classifier (transfer learning on MobileNetV2 or similar, in TensorFlow) on top of cropped face + landmarks.
- Export to TensorFlow.js or TFLite so it can still run client-side or on a small inference service.
- This is weeks, not days — budget for it separately.

**B. Norwood/Hamilton hairline stage classifier (genuinely needs training)**
- This is the one piece in the blueprint that legitimately requires a trained model — there's no rules-based shortcut for recession pattern classification.
- Needs: a labeled dataset of hairline photos across Norwood stages 1–7. This is sensitive data (real people's hairlines) — you'll need consent-based data collection, likely starting with a small internal dataset (hundreds of labeled images minimum, ideally low thousands) plus heavy data augmentation.
- Architecture: CNN (ResNet or EfficientNet backbone) fine-tuned as a 7-class classifier.
- Runtime: Python 3.11 + FastAPI + TensorFlow, deployed on GPU instance (Blueprint specifies `g4dn.xlarge`), NOT in-browser.
- This should be its own sprint (Blueprint puts it at Sprint 11–12, after the AR try-on is already live) — don't let it block the try-on launch.

**Bottom line for your dev:** Try-On (face shape + overlay) ships without training anything. Hairline analysis is the one genuine ML-training project, and it's a later, separate deliverable requiring a real dataset.

---

## 6. Definition of Done for MVP Try-On

- [ ] Live camera try-on works at ≥ 24fps on a mid-range Android phone
- [ ] Photo-upload try-on mode works as fallback (Blueprint §8.2 shows both options)
- [ ] Face shape detected and shown to user ("Face shape: OVAL ✓")
- [ ] At least 15–20 hairstyle sprites in the catalog, tagged by compatible face shape
- [ ] Overlay tracks head rotation smoothly, not just position
- [ ] "Save" persists to `TryOnResult`, retrievable via `/ai/try-on/history`
- [ ] "Book This Look" hands off hairstyle_id into the booking flow
- [ ] AI face scan latency < 3s (Blueprint SLO §17.1)

---

## 7. What to hand this document to your dev as

Say: *"Build the AI Try-On screen exactly as scoped in section 8.2 of the blueprint. Use this doc for the technical how — MediaPipe for tracking, geometry rules for face shape, Three.js for the overlay. No model training needed for this milestone. Norwood hairline analysis is a separate future sprint, not part of this one."*
