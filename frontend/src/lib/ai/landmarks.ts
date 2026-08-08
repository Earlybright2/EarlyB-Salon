/**
 * Shared MediaPipe 468-point landmark indices — must stay in sync with
 * ai_tryon/landmark_detector.py LANDMARK_INDICES.
 */

export const LANDMARK_INDICES = {
  foreheadLeft: 54,
  foreheadRight: 284,
  foreheadTop: 10,
  foreheadCenter: 9,
  cheekboneLeft: 116,
  cheekboneRight: 345,
  jawLeft: 172,
  jawRight: 397,
  jawChin: 152,
  jawLeftMid: 136,
  jawRightMid: 365,
  noseTip: 1,
  noseBridge: 168,
  leftEyeOuter: 33,
  rightEyeOuter: 263,
  leftPeak: 108,
  rightPeak: 337,
  mouthLeft: 61,
  mouthRight: 291,
  upperLip: 13,
  lowerLip: 14,
  cheekLeft: 205,
  cheekRight: 425,
} as const;

export type Landmark = { x: number; y: number; z?: number };

export function toPixel(
  lm: Landmark,
  width: number,
  height: number
): { x: number; y: number } {
  return { x: lm.x * width, y: lm.y * height };
}

export function distance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
