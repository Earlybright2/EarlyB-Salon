/**
 * Canvas 2D hairstyle overlay with head-pose roll + soft edge blend.
 * Production path for real-time camera; mirrors server overlay anchors.
 */

import { LANDMARK_INDICES, type Landmark, toPixel, distance } from "./landmarks";

export interface OverlayDrawOptions {
  widthRatio?: number;
  verticalOffsetRatio?: number;
  opacity?: number;
}

const spriteCache = new Map<string, HTMLImageElement>();

export function preloadSprite(url: string): Promise<HTMLImageElement> {
  const cached = spriteCache.get(url);
  if (cached?.complete) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      spriteCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load sprite: ${url}`));
    img.src = url;
  });
}

function extractRoll(matrixData: number[] | Float32Array | undefined): number {
  if (!matrixData || matrixData.length < 16) return 0;
  const m10 = matrixData[4] ?? matrixData[1];
  const m00 = matrixData[0];
  return Math.atan2(Number(m10), Number(m00));
}

export function drawFrameWithHairstyle(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  landmarks: Landmark[],
  sprite: HTMLImageElement | null,
  transformationMatrix?: number[] | Float32Array,
  options: OverlayDrawOptions = {}
) {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return;

  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);

  if (!sprite || !landmarks?.length) {
    ctx.restore();
    return;
  }

  const widthRatio = options.widthRatio ?? 1.45;
  const verticalOffsetRatio = options.verticalOffsetRatio ?? -0.15;
  const opacity = options.opacity ?? 0.92;

  const I = LANDMARK_INDICES;
  const flipX = (lm: Landmark) => ({ x: (1 - lm.x) * w, y: lm.y * h });

  const foreheadTop = flipX(landmarks[I.foreheadTop]);
  const templeLeft = flipX(landmarks[I.foreheadLeft]);
  const templeRight = flipX(landmarks[I.foreheadRight]);
  const faceWidth = distance(templeLeft, templeRight);
  const centerX = (templeLeft.x + templeRight.x) / 2;
  const anchorY = foreheadTop.y + faceWidth * verticalOffsetRatio;

  const targetW = faceWidth * widthRatio;
  const aspect =
    sprite.naturalWidth > 0
      ? sprite.naturalHeight / sprite.naturalWidth
      : 1.2;
  const targetH = targetW * aspect;

  const roll = extractRoll(
    transformationMatrix
      ? Array.from(transformationMatrix as ArrayLike<number>)
      : undefined
  );

  ctx.save();
  ctx.translate(centerX, anchorY);
  ctx.rotate(-roll);
  ctx.globalAlpha = opacity;
  ctx.drawImage(sprite, -targetW / 2, -targetH * 0.55, targetW, targetH);
  ctx.restore();

  ctx.restore();
}

export function drawPhotoWithHairstyle(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | HTMLCanvasElement,
  landmarks: Landmark[],
  width: number,
  height: number,
  sprite: HTMLImageElement | null,
  transformationMatrix?: number[] | Float32Array,
  options: OverlayDrawOptions = {}
) {
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  if (!sprite || !landmarks?.length) return;

  const widthRatio = options.widthRatio ?? 1.45;
  const verticalOffsetRatio = options.verticalOffsetRatio ?? -0.15;
  const opacity = options.opacity ?? 0.92;
  const I = LANDMARK_INDICES;

  const foreheadTop = toPixel(landmarks[I.foreheadTop], width, height);
  const templeLeft = toPixel(landmarks[I.foreheadLeft], width, height);
  const templeRight = toPixel(landmarks[I.foreheadRight], width, height);
  const faceWidth = distance(templeLeft, templeRight);
  const centerX = (templeLeft.x + templeRight.x) / 2;
  const anchorY = foreheadTop.y + faceWidth * verticalOffsetRatio;
  const targetW = faceWidth * widthRatio;
  const aspect =
    sprite.naturalWidth > 0
      ? sprite.naturalHeight / sprite.naturalWidth
      : 1.2;
  const targetH = targetW * aspect;
  const roll = extractRoll(
    transformationMatrix
      ? Array.from(transformationMatrix as ArrayLike<number>)
      : undefined
  );

  ctx.save();
  ctx.translate(centerX, anchorY);
  ctx.rotate(-roll);
  ctx.globalAlpha = opacity;
  ctx.drawImage(sprite, -targetW / 2, -targetH * 0.55, targetW, targetH);
  ctx.restore();
}
