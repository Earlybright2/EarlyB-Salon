/**
 * Client-side full facial analysis — mirrors Python facial_analysis.py
 */
import { LANDMARK_INDICES, type Landmark, distance, toPixel } from "./landmarks";

export type FaceShape = "OVAL" | "ROUND" | "SQUARE" | "HEART" | "DIAMOND" | "OBLONG";

export interface FaceShapeResult {
  faceShape: FaceShape;
  confidence: number;
  ratios: { faceLengthWidth: number; jawCheekbone: number; foreheadJaw: number };
}

export interface SkinToneResult {
  label: string;
  fitzpatrick: number;
  hex: string;
  confidence: number;
}

export interface HairDensityResult {
  level: "high" | "medium" | "low" | "very_low";
  score: number;
  confidence: number;
}

export interface BeardResult {
  style: "clean_shaven" | "stubble" | "short_beard" | "full_beard" | "goatee_like" | "unknown";
  presenceScore: number;
  confidence: number;
}

export interface HairlineResult {
  stage: "normal" | "early_recession" | "moderate_recession" | "advanced_recession";
  norwoodEstimate: number;
  confidence: number;
  foreheadRatio: number;
  asymmetry: number;
  notes: string;
}

export interface FullAnalysis {
  faceShape: FaceShapeResult;
  skinTone: SkinToneResult;
  hairDensity: HairDensityResult;
  beard: BeardResult;
  hairline: HairlineResult;
  faceWidthPx: number;
  faceHeightPx: number;
  landmarksCount: number;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function classifyFaceShape(
  landmarks: Landmark[],
  width: number,
  height: number
): FaceShapeResult {
  const px = (i: number) => toPixel(landmarks[i], width, height);
  const I = LANDMARK_INDICES;
  const foreheadWidth = distance(px(I.foreheadLeft), px(I.foreheadRight));
  const cheekboneWidth = distance(px(I.cheekboneLeft), px(I.cheekboneRight));
  const jawWidth = distance(px(I.jawLeft), px(I.jawRight));
  const faceLength = distance(px(I.foreheadTop), px(I.jawChin));
  const ratioLenWidth = faceLength / Math.max(cheekboneWidth, 1e-6);
  const ratioJawCheek = jawWidth / Math.max(cheekboneWidth, 1e-6);
  const ratioForeheadJaw = foreheadWidth / Math.max(jawWidth, 1e-6);
  let shape: FaceShape = "OVAL";
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
    faceShape: shape,
    confidence: Math.round(confidence * 100) / 100,
    ratios: {
      faceLengthWidth: Math.round(ratioLenWidth * 1000) / 1000,
      jawCheekbone: Math.round(ratioJawCheek * 1000) / 1000,
      foreheadJaw: Math.round(ratioForeheadJaw * 1000) / 1000,
    },
  };
}

export function analyzeSkinTone(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number
): SkinToneResult {
  const samples: number[][] = [];
  const indices = [
    LANDMARK_INDICES.foreheadTop,
    LANDMARK_INDICES.cheekboneLeft,
    LANDMARK_INDICES.cheekboneRight,
    LANDMARK_INDICES.noseTip,
    LANDMARK_INDICES.cheekLeft,
    LANDMARK_INDICES.cheekRight,
  ];
  const r = Math.max(4, Math.floor(Math.min(width, height) * 0.02));
  for (const i of indices) {
    const p = toPixel(landmarks[i], width, height);
    const x0 = Math.max(0, Math.floor(p.x - r));
    const y0 = Math.max(0, Math.floor(p.y - r));
    try {
      const data = ctx.getImageData(x0, y0, r * 2, r * 2).data;
      for (let k = 0; k < data.length; k += 4) {
        const gray = (data[k] + data[k + 1] + data[k + 2]) / 3;
        if (gray > 25 && gray < 245) samples.push([data[k], data[k + 1], data[k + 2]]);
      }
    } catch {
      /* skip */
    }
  }
  if (samples.length < 5) {
    return { label: "Unknown", fitzpatrick: 3, hex: "#c4a484", confidence: 0.2 };
  }
  const mean = samples
    .reduce((acc, s) => [acc[0] + s[0], acc[1] + s[1], acc[2] + s[2]], [0, 0, 0])
    .map((v) => v / samples.length);
  const Lapprox = 0.299 * mean[0] + 0.587 * mean[1] + 0.114 * mean[2];
  let fitz = 3;
  let label = "Type III (Light Medium)";
  if (Lapprox >= 200) {
    fitz = 1;
    label = "Type I (Very Fair)";
  } else if (Lapprox >= 175) {
    fitz = 2;
    label = "Type II (Fair)";
  } else if (Lapprox >= 150) {
    fitz = 3;
    label = "Type III (Light Medium)";
  } else if (Lapprox >= 120) {
    fitz = 4;
    label = "Type IV (Medium)";
  } else if (Lapprox >= 90) {
    fitz = 5;
    label = "Type V (Tan / Deep)";
  } else {
    fitz = 6;
    label = "Type VI (Deep)";
  }
  const hex = `#${mean.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
  return {
    label,
    fitzpatrick: fitz,
    hex,
    confidence: clamp(0.55 + samples.length / 8000, 0.5, 0.9),
  };
}

export function analyzeHairDensity(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  faceHeightPx: number
): HairDensityResult {
  const I = LANDMARK_INDICES;
  const top = toPixel(landmarks[I.foreheadTop], width, height);
  const left = toPixel(landmarks[I.foreheadLeft], width, height);
  const right = toPixel(landmarks[I.foreheadRight], width, height);
  const bandH = Math.max(8, Math.floor(faceHeightPx * 0.28));
  const cx = (left.x + right.x) / 2;
  const halfW = Math.abs(right.x - left.x) * 0.55;
  const x0 = Math.max(0, Math.floor(cx - halfW));
  const y0 = Math.max(0, Math.floor(top.y - bandH));
  const w = Math.min(width - x0, Math.floor(halfW * 2));
  const h = Math.min(height - y0, bandH);
  if (w < 4 || h < 4) return { level: "medium", score: 0.5, confidence: 0.3 };
  let darkSum = 0;
  let edgeish = 0;
  let n = 0;
  try {
    const data = ctx.getImageData(x0, y0, w, h).data;
    for (let i = 0; i < data.length; i += 4) {
      const g = (data[i] + data[i + 1] + data[i + 2]) / 3;
      darkSum += 1 - g / 255;
      if (i > 4) {
        const prev = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;
        edgeish += Math.min(1, Math.abs(g - prev) / 40);
      }
      n++;
    }
  } catch {
    return { level: "medium", score: 0.5, confidence: 0.3 };
  }
  const score = clamp(0.55 * (darkSum / Math.max(n, 1)) + 0.45 * (edgeish / Math.max(n, 1)) * 3, 0, 1);
  let level: HairDensityResult["level"] = "medium";
  if (score >= 0.65) level = "high";
  else if (score >= 0.45) level = "medium";
  else if (score >= 0.28) level = "low";
  else level = "very_low";
  return { level, score: Math.round(score * 1000) / 1000, confidence: 0.62 };
}

export function analyzeBeard(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number
): BeardResult {
  const I = LANDMARK_INDICES;
  const chin = toPixel(landmarks[I.jawChin], width, height);
  const jl = toPixel(landmarks[I.jawLeft], width, height);
  const jr = toPixel(landmarks[I.jawRight], width, height);
  const ll = toPixel(landmarks[I.lowerLip], width, height);
  const ul = toPixel(landmarks[I.upperLip], width, height);
  const ml = toPixel(landmarks[I.mouthLeft], width, height);
  const mr = toPixel(landmarks[I.mouthRight], width, height);
  const x0 = Math.max(0, Math.floor(Math.min(jl.x, jr.x)));
  const x1 = Math.min(width, Math.ceil(Math.max(jl.x, jr.x)));
  const y0 = Math.max(0, Math.floor(Math.min(ll.y, ul.y) - 2));
  const y1 = Math.min(height, Math.ceil(chin.y + 8));
  const w = x1 - x0;
  const h = y1 - y0;
  if (w < 10 || h < 10) return { style: "unknown", presenceScore: 0, confidence: 0.2 };
  let dark = 0;
  let varSum = 0;
  let n = 0;
  let prev = 0;
  try {
    const data = ctx.getImageData(x0, y0, w, h).data;
    for (let i = 0; i < data.length; i += 4) {
      const g = (data[i] + data[i + 1] + data[i + 2]) / 3;
      dark += 1 - g / 255;
      if (n) varSum += Math.min(1, Math.abs(g - prev) / 35);
      prev = g;
      n++;
    }
  } catch {
    return { style: "unknown", presenceScore: 0, confidence: 0.2 };
  }
  const presence = clamp(0.5 * (varSum / Math.max(n, 1)) * 4 + 0.5 * (dark / Math.max(n, 1)), 0, 1);
  const narrow = Math.abs(mr.x - ml.x) / (Math.abs(jr.x - jl.x) + 1e-6);
  let style: BeardResult["style"] = "clean_shaven";
  if (presence < 0.18) style = "clean_shaven";
  else if (presence < 0.35) style = "stubble";
  else if (presence < 0.55) style = "short_beard";
  else if (narrow < 0.45 && presence > 0.4) style = "goatee_like";
  else style = "full_beard";
  return {
    style,
    presenceScore: Math.round(presence * 1000) / 1000,
    confidence: clamp(0.5 + presence * 0.35, 0.45, 0.88),
  };
}

export function analyzeHairline(
  landmarks: Landmark[],
  width: number,
  height: number,
  faceHeightPx: number
): HairlineResult {
  const I = LANDMARK_INDICES;
  const top = toPixel(landmarks[I.foreheadTop], width, height);
  const chin = toPixel(landmarks[I.jawChin], width, height);
  const eyeY =
    (toPixel(landmarks[I.leftEyeOuter], width, height).y +
      toPixel(landmarks[I.rightEyeOuter], width, height).y) /
    2;
  const leftPeak = toPixel(landmarks[I.leftPeak], width, height);
  const rightPeak = toPixel(landmarks[I.rightPeak], width, height);
  const faceH = Math.max(faceHeightPx, distance(top, chin), 1);
  const foreheadRatio = Math.abs(eyeY - top.y) / faceH;
  const leftDrop = Math.abs(leftPeak.y - top.y) / faceH;
  const rightDrop = Math.abs(rightPeak.y - top.y) / faceH;
  const asymmetry = Math.abs(leftDrop - rightDrop);
  const meanPeak = (leftDrop + rightDrop) / 2;
  let stage: HairlineResult["stage"] = "normal";
  let norwood = 1;
  let notes = "Balanced forehead-to-face ratio; minimal peak drop.";
  let confidence = 0.7;
  if (foreheadRatio < 0.28 && meanPeak < 0.04) {
    stage = "normal";
    norwood = 1;
  } else if (foreheadRatio < 0.34 && meanPeak < 0.07) {
    stage = "early_recession";
    norwood = 2;
    notes = "Mild temple/forehead height increase — monitor / early care.";
    confidence = 0.65;
  } else if (foreheadRatio < 0.4) {
    stage = "moderate_recession";
    norwood = 3;
    notes = "Noticeable forehead height; consider restoration consultation.";
    confidence = 0.6;
  } else {
    stage = "advanced_recession";
    norwood = 4;
    notes = "Significant forehead ratio; recommend specialist assessment.";
    confidence = 0.55;
  }
  if (asymmetry > 0.05) {
    notes += " Asymmetric hairline peaks detected.";
    confidence = Math.max(0.45, confidence - 0.05);
  }
  return {
    stage,
    norwoodEstimate: norwood,
    confidence: Math.round(confidence * 100) / 100,
    foreheadRatio: Math.round(foreheadRatio * 1000) / 1000,
    asymmetry: Math.round(asymmetry * 1000) / 1000,
    notes,
  };
}

export function runFullAnalysis(
  landmarks: Landmark[],
  width: number,
  height: number,
  ctx?: CanvasRenderingContext2D | null
): FullAnalysis {
  const I = LANDMARK_INDICES;
  const faceWidth = distance(
    toPixel(landmarks[I.foreheadLeft], width, height),
    toPixel(landmarks[I.foreheadRight], width, height)
  );
  const faceHeight = distance(
    toPixel(landmarks[I.foreheadTop], width, height),
    toPixel(landmarks[I.jawChin], width, height)
  );
  const faceShape = classifyFaceShape(landmarks, width, height);
  const hairline = analyzeHairline(landmarks, width, height, faceHeight);
  let skinTone: SkinToneResult = { label: "Unknown", fitzpatrick: 3, hex: "#c4a484", confidence: 0.2 };
  let hairDensity: HairDensityResult = { level: "medium", score: 0.5, confidence: 0.3 };
  let beard: BeardResult = { style: "unknown", presenceScore: 0, confidence: 0.2 };
  if (ctx) {
    skinTone = analyzeSkinTone(ctx, landmarks, width, height);
    hairDensity = analyzeHairDensity(ctx, landmarks, width, height, faceHeight);
    beard = analyzeBeard(ctx, landmarks, width, height);
  }
  return {
    faceShape,
    skinTone,
    hairDensity,
    beard,
    hairline,
    faceWidthPx: faceWidth,
    faceHeightPx: faceHeight,
    landmarksCount: landmarks.length,
  };
}

export function scoreHairstyle(
  style: {
    faceShapes?: string[];
    category?: string;
    name?: string;
    trendScore?: number;
    isCelebrity?: boolean;
    celebrityName?: string;
    genderTarget?: string;
  },
  analysis: FullAnalysis
): number {
  let score = 0;
  const faceShape = analysis.faceShape.faceShape.toLowerCase();
  const compatible = (style.faceShapes || []).map((s) => s.toLowerCase());
  if (!compatible.length || compatible.includes(faceShape) || compatible.includes("all")) score += 40;
  else score += 10;
  score += (style.trendScore ?? 50) * 0.25;
  if (style.isCelebrity) score += 12;
  if (style.celebrityName) score += 3;
  const category = (style.category || "").toLowerCase();
  const name = (style.name || "").toLowerCase();
  const shortKeys = ["fade", "buzz", "crop", "taper", "skin", "bald", "low cut"];
  const isShort = shortKeys.some((k) => category.includes(k) || name.includes(k));
  const stage = analysis.hairline.stage;
  if (stage === "moderate_recession" || stage === "advanced_recession") score += isShort ? 15 : -8;
  else if (stage === "early_recession") score += isShort ? 8 : 0;
  const volumeKeys = ["afro", "twist", "braid", "locs", "curly", "high top"];
  const isVolume = volumeKeys.some((k) => category.includes(k) || name.includes(k));
  const dens = analysis.hairDensity.level;
  if (dens === "high" && isVolume) score += 8;
  if ((dens === "low" || dens === "very_low") && isVolume) score -= 10;
  if ((dens === "low" || dens === "very_low") && isShort) score += 6;
  return Math.round(score * 100) / 100;
}
