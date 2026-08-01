# Frontend Integration Guide — AI Try-On with MediaPipe + Three.js

This guide shows how to integrate the AI Try-On module into the React frontend
using **MediaPipe FaceLandmarker** (client-side, 468-point model) and **Three.js**
for real-time 3D hairstyle overlay rendering.

## Architecture

```
Browser (React)
  ├── MediaPipe FaceLandmarker (WASM, runs on every video frame)
  │     → 468 (x,y,z) normalized landmarks
  │     → facialTransformationMatrix (4x4 head pose)
  │
  ├── Face Shape Classifier (JS, geometry rules)
  │     → { face_shape, confidence, ratios }
  │
  ├── Three.js WebGL Overlay
  │     → positions hairstyle sprite/mesh using landmark anchors
  │     → rotates/scales overlay to match head pose
  │
  └── Backend API (FastAPI)
        → POST /ai/try-on/save   (persist result)
        → GET  /ai/hairstyles    (catalog)
        → GET  /ai/try-on/history (saved looks)
```

## 1. Install Dependencies

```bash
npm install @mediapipe/tasks-vision three @react-three/fiber @react-three/drei
```

## 2. Initialize MediaPipe FaceLandmarker

```typescript
// lib/faceLandmarker.ts
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let faceLandmarker: FaceLandmarker | null = null;

export async function initFaceLandmarker(): Promise<FaceLandmarker> {
  if (faceLandmarker) return faceLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFacialTransformationMatrixes: true,
  });

  return faceLandmarker;
}
```

## 3. Face Shape Classification (Client-Side)

These are the **same landmark indices** used by the Python backend, so results
are consistent between client-side and server-side analysis.

```typescript
// lib/faceShape.ts

// MediaPipe 468-point landmark indices
const LANDMARK_INDICES = {
  foreheadLeft: 54,
  foreheadRight: 284,
  foreheadTop: 10,
  cheekboneLeft: 116,
  cheekboneRight: 345,
  jawLeft: 172,
  jawRight: 397,
  jawChin: 152,
};

export interface FaceShapeResult {
  faceShape: "OVAL" | "ROUND" | "SQUARE" | "HEART" | "DIAMOND" | "OBLONG";
  confidence: number;
  ratios: {
    faceLengthWidth: number;
    jawCheekbone: number;
    foreheadJaw: number;
  };
}

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export function classifyFaceShape(
  landmarks: { x: number; y: number; z: number }[],
  imageWidth: number,
  imageHeight: number
): FaceShapeResult {
  // Convert normalized landmarks to pixel coordinates
  const px = (lm: { x: number; y: number }) => ({
    x: lm.x * imageWidth,
    y: lm.y * imageHeight,
  });

  const foreheadWidth = distance(
    px(landmarks[LANDMARK_INDICES.foreheadLeft]),
    px(landmarks[LANDMARK_INDICES.foreheadRight])
  );
  const cheekboneWidth = distance(
    px(landmarks[LANDMARK_INDICES.cheekboneLeft]),
    px(landmarks[LANDMARK_INDICES.cheekboneRight])
  );
  const jawWidth = distance(
    px(landmarks[LANDMARK_INDICES.jawLeft]),
    px(landmarks[LANDMARK_INDICES.jawRight])
  );
  const faceLength = distance(
    px(landmarks[LANDMARK_INDICES.foreheadTop]),
    px(landmarks[LANDMARK_INDICES.jawChin])
  );

  const ratioLenWidth = faceLength / cheekboneWidth;
  const ratioJawCheek = jawWidth / cheekboneWidth;
  const ratioForeheadJaw = foreheadWidth / jawWidth;

  let shape = "OVAL";
  let confidence = 0.7;

  if (ratioLenWidth > 1.5) {
    shape = "OBLONG";
    confidence = Math.min(0.95, 0.6 + (ratioLenWidth - 1.5) * 0.35);
  } else if (ratioLenWidth < 1.1) {
    shape = "ROUND";
    confidence = Math.min(0.95, 0.6 + (1.1 - ratioLenWidth) * 0.35);
  } else if (ratioJawCheek > 0.85) {
    shape = "SQUARE";
    confidence = Math.min(0.95, 0.6 + (ratioJawCheek - 0.85) * 0.35);
  } else if (ratioForeheadJaw > 1.35) {
    shape = "HEART";
    confidence = Math.min(0.95, 0.6 + (ratioForeheadJaw - 1.35) * 0.35);
  } else if (ratioJawCheek < 0.62) {
    shape = "DIAMOND";
    confidence = Math.min(0.95, 0.6 + (0.62 - ratioJawCheek) * 0.35);
  } else {
    shape = "OVAL";
    confidence = 0.75;
  }

  return {
    faceShape: shape as FaceShapeResult["faceShape"],
    confidence: Math.round(confidence * 100) / 100,
    ratios: {
      faceLengthWidth: Math.round(ratioLenWidth * 1000) / 1000,
      jawCheekbone: Math.round(ratioJawCheek * 1000) / 1000,
      foreheadJaw: Math.round(ratioForeheadJaw * 1000) / 1000,
    },
  };
}
```

## 4. Real-Time Video Loop with Three.js Overlay

```typescript
// components/TryOnCamera.tsx
import { useEffect, useRef, useState } from "react";
import { initFaceLandmarker } from "../lib/faceLandmarker";
import { classifyFaceShape, FaceShapeResult } from "../lib/faceShape";

export function TryOnCamera({ hairstyleAssetUrl }: { hairstyleAssetUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceShape, setFaceShape] = useState<FaceShapeResult | null>(null);

  useEffect(() => {
    let rafId: number;
    let landmarker: Awaited<ReturnType<typeof initFaceLandmarker>>;

    async function start() {
      landmarker = await initFaceLandmarker();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      loop();
    }

    function loop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const result = landmarker.detectForVideo(video, performance.now());

      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0];
        const shape = classifyFaceShape(landmarks, video.videoWidth, video.videoHeight);
        setFaceShape(shape);

        // Draw hairstyle overlay using landmark anchoring
        // (Use Three.js for 3D meshes, or Canvas 2D for sprites)
        drawHairstyleOverlay(ctx, landmarks, video, hairstyleAssetUrl, result);
      }

      rafId = requestAnimationFrame(loop);
    }

    start();
    return () => {
      cancelAnimationFrame(rafId);
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [hairstyleAssetUrl]);

  return (
    <div>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} />
      {faceShape && (
        <div className="face-shape-badge">
          Face Shape: {faceShape.faceShape} ✓ ({Math.round(faceShape.confidence * 100)}%)
        </div>
      )}
    </div>
  );
}

function drawHairstyleOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number }[],
  video: HTMLVideoElement,
  assetUrl: string,
  result: any
) {
  const w = video.videoWidth;
  const h = video.videoHeight;

  // Anchor: forehead top (landmark 10) and temples (54, 284)
  const foreheadTop = { x: landmarks[10].x * w, y: landmarks[10].y * h };
  const templeLeft = { x: landmarks[54].x * w, y: landmarks[54].y * h };
  const templeRight = { x: landmarks[284].x * w, y: landmarks[284].y * h };
  const faceWidth = Math.hypot(templeRight.x - templeLeft.x, templeRight.y - templeLeft.y);

  // Apply head-pose rotation from transformation matrix
  if (result.facialTransformationMatrixes?.[0]) {
    const matrix = result.facialTransformationMatrixes[0].data;
    // Extract roll (in-plane rotation) from the 4x4 matrix
    const roll = Math.atan2(matrix[1], matrix[0]); // matrix[1][0], matrix[0][0]
    ctx.save();
    ctx.translate(foreheadTop.x, foreheadTop.y);
    ctx.rotate(roll);
    // Draw hairstyle sprite centered at forehead, scaled to face width
    const img = new Image();
    img.src = assetUrl;
    const targetW = faceWidth * 1.45;
    const targetH = targetW * (img.height / img.width);
    ctx.drawImage(img, -targetW / 2, -targetH * 0.7, targetW, targetH);
    ctx.restore();
  }
}
```

## 5. Three.js 3D Mesh Overlay (Production)

For 3D GLB hairstyle models, use `@react-three/fiber`:

```typescript
// components/HairstyleOverlay3D.tsx
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

export function HairstyleOverlay3D({
  landmarks,
  transformationMatrix,
  faceWidth,
}: {
  landmarks: { x: number; y: number; z: number }[];
  transformationMatrix: Float32Array;
  faceWidth: number;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/hairstyles/model.glb");

  useFrame(() => {
    if (!meshRef.current) return;

    // Position using forehead top landmark (index 10)
    const anchor = landmarks[10];
    meshRef.current.position.set(anchor.x, anchor.y, anchor.z);

    // Apply head-pose rotation from the transformation matrix
    const matrix = new THREE.Matrix4();
    matrix.fromArray(transformationMatrix);
    meshRef.current.quaternion.setFromRotationMatrix(matrix);

    // Scale based on face width
    const scale = faceWidth / 100; // 100 = reference face width
    meshRef.current.scale.setScalar(scale);
  });

  return <primitive ref={meshRef} object={scene} />;
}
```

## 6. Backend API Integration

The backend endpoints remain backward-compatible. Use them for:

- **Catalog**: `GET /ai/hairstyles` — fetch hairstyle list
- **Recommendations**: `GET /ai/hairstyles/recommend?face_shape=oval`
- **Save**: `POST /ai/try-on/save` — persist a try-on result
- **History**: `GET /ai/try-on/history` — retrieve saved looks
- **Server-side fallback**: `POST /ai/try-on/analyze` — if the client cannot run MediaPipe

```typescript
// Example: Save a try-on result
async function saveTryOnResult(
  hairstyleId: string,
  resultImageUrl: string,
  faceShape: string
) {
  const formData = new FormData();
  formData.append("hairstyle_id", hairstyleId);
  formData.append("result_image_url", resultImageUrl);
  formData.append("face_shape", faceShape);

  const resp = await fetch("/ai/try-on/save", {
    method: "POST",
    body: formData,
  });

  if (!resp.ok) throw new Error("Failed to save result");
  return resp.json();
}
```

## 7. Server-Side Fallback

When the client cannot run MediaPipe (old browser, no GPU), fall back to the
server-side analysis endpoint:

```typescript
async function serverSideAnalyze(photo: File): Promise<FaceShapeResult> {
  const formData = new FormData();
  formData.append("photo", photo);

  const resp = await fetch("/ai/try-on/analyze", {
    method: "POST",
    body: formData,
  });

  if (resp.status === 422) {
    throw new Error("No face detected. Please use a clear front-facing photo.");
  }
  if (!resp.ok) throw new Error("Analysis failed.");

  return resp.json();
}
```
