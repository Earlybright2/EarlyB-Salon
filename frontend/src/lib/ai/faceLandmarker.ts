/**
 * Client-side MediaPipe FaceLandmarker (VIDEO + IMAGE modes).
 * Primary path for real-time try-on — runs in the browser, not on the server.
 */

import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

let landmarkerVideo: FaceLandmarker | null = null;
let landmarkerImage: FaceLandmarker | null = null;
let initPromise: Promise<FaceLandmarker> | null = null;

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

async function createLandmarker(runningMode: "VIDEO" | "IMAGE") {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: "GPU",
    },
    runningMode,
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFacialTransformationMatrixes: true,
  });
}

/** Initialize VIDEO mode landmarker (live camera). Idempotent. */
export async function initFaceLandmarker(): Promise<FaceLandmarker> {
  if (landmarkerVideo) return landmarkerVideo;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      landmarkerVideo = await createLandmarker("VIDEO");
    } catch {
      // CPU fallback if GPU delegate fails
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      landmarkerVideo = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFacialTransformationMatrixes: true,
      });
    }
    return landmarkerVideo;
  })();

  return initPromise;
}

/** IMAGE mode for single photo upload analysis. */
export async function initFaceLandmarkerImage(): Promise<FaceLandmarker> {
  if (landmarkerImage) return landmarkerImage;
  landmarkerImage = await createLandmarker("IMAGE");
  return landmarkerImage;
}

export function detectForVideo(
  landmarker: FaceLandmarker,
  video: HTMLVideoElement,
  timestampMs: number
): FaceLandmarkerResult {
  return landmarker.detectForVideo(video, timestampMs);
}

export async function detectForImage(
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap
): Promise<FaceLandmarkerResult | null> {
  const lm = await initFaceLandmarkerImage();
  const result = lm.detect(image);
  if (!result.faceLandmarks?.length) return null;
  return result;
}

export function isMediaPipeSupported(): boolean {
  return typeof window !== "undefined" && "mediaDevices" in navigator;
}

export async function disposeLandmarkers() {
  landmarkerVideo?.close();
  landmarkerImage?.close();
  landmarkerVideo = null;
  landmarkerImage = null;
  initPromise = null;
}
