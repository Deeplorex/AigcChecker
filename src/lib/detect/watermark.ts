/**
 * 像素级可见水印启发式：扫描四角与底边条带，统计高边缘密度的小连通区域（文字块特征）。
 * 图片直接解码扫描；视频抽帧（10% / 50% / 90% 时长处）逐帧扫描，任一帧命中即判存在。
 * 依赖浏览器 canvas / Image / video，仅客户端使用。
 * 移植自 prototype/index.html（detectWatermark）。
 */

import type { WatermarkResult } from "./types";

type ScanHit = { density: string; zone: "corner" | "bottom" };

/** 对一帧 RGBA 像素做边缘密度扫描，命中文字块特征时返回命中信息。 */
function scanFrame(d: Uint8ClampedArray, w: number, h: number): ScanHit | null {
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    gray[i] = (d[o] * 0.299 + d[o + 1] * 0.587 + d[o + 2] * 0.114) | 0;
  }
  // Sobel 边缘
  const edge = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx =
        -gray[i - w - 1] -
        2 * gray[i - 1] -
        gray[i + w - 1] +
        gray[i - w + 1] +
        2 * gray[i + 1] +
        gray[i + w + 1];
      const gy =
        -gray[i - w - 1] -
        2 * gray[i - w] -
        gray[i - w + 1] +
        gray[i + w - 1] +
        2 * gray[i + w] +
        gray[i + w + 1];
      edge[i] = gx * gx + gy * gy > 12000 ? 1 : 0;
    }
  // 候选区域：四角块 + 底边条带（覆盖豆包/即梦等常见水印位置）
  const bw = Math.round(w * 0.32);
  const bh = Math.round(h * 0.18);
  const zones = [
    { x: 0, y: 0, w: bw, h: bh },
    { x: w - bw, y: 0, w: bw, h: bh },
    { x: 0, y: h - bh, w: bw, h: bh },
    { x: w - bw, y: h - bh, w: bw, h: bh },
    { x: 0, y: h - Math.round(h * 0.09), w: w, h: Math.round(h * 0.09) },
  ];
  for (let zi = 0; zi < zones.length; zi++) {
    const z = zones[zi];
    // 网格化统计边缘密度峰值
    const gs = 14;
    const cols = Math.floor(z.w / gs);
    const rows = Math.floor(z.h / gs);
    let peak = 0;
    for (let ry = 0; ry < rows; ry++)
      for (let cx = 0; cx < cols; cx++) {
        let cnt = 0;
        for (let yy = 0; yy < gs; yy++)
          for (let xx = 0; xx < gs; xx++) {
            const px = z.x + cx * gs + xx;
            const py = z.y + ry * gs + yy;
            if (px < w && py < h) cnt += edge[py * w + px];
          }
        const density = cnt / (gs * gs);
        if (density > peak) peak = density;
      }
    // 文字块边缘密度阈值（实测：清晰文字块 >0.18，自然画面通常 <0.10）
    if (peak > 0.18) {
      return {
        density: peak.toFixed(2),
        zone: zi === zones.length - 1 ? "bottom" : "corner",
      };
    }
  }
  return null;
}

/** 按统一缩放规则建 canvas 并画出当前帧，返回像素数据。 */
function framePixels(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
): { d: Uint8ClampedArray; w: number; h: number } | null {
  const scale = Math.min(1, 900 / Math.max(srcW, srcH));
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);
  return { d: ctx.getImageData(0, 0, w, h).data, w, h };
}

export function detectWatermark(file: File): Promise<WatermarkResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const frame = framePixels(img, img.naturalWidth, img.naturalHeight);
        if (!frame) throw new Error("no 2d context");
        const hit = scanFrame(frame.d, frame.w, frame.h);
        URL.revokeObjectURL(url);
        resolve(hit ? { found: true, ...hit } : { found: false });
      } catch {
        URL.revokeObjectURL(url);
        resolve({ found: false, error: true });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ found: false, error: true });
    };
    img.src = url;
  });
}

/** 视频显式水印：抽帧后逐帧扫描，任一帧命中即判存在。 */
export function detectVideoWatermark(file: File): Promise<WatermarkResult> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    let settled = false;
    const finish = (r: WatermarkResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(guard);
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      resolve(r);
    };
    // 解码/seek 偶发挂起时的兜底
    const guard = setTimeout(
      () => finish({ found: false, error: true }),
      15000,
    );
    video.onerror = () => finish({ found: false, error: true });
    video.onloadedmetadata = () => {
      void (async () => {
        try {
          if (!video.videoWidth || !video.videoHeight) {
            finish({ found: false, error: true });
            return;
          }
          const dur = video.duration;
          const times =
            Number.isFinite(dur) && dur > 0.2
              ? [0.1, 0.5, 0.9].map((p) => Math.min(dur * p, dur - 0.1))
              : [0];
          for (const t of times) {
            await new Promise<void>((res, rej) => {
              video.onseeked = () => res();
              video.onerror = () => rej(new Error("seek failed"));
              video.currentTime = t;
            });
            const frame = framePixels(
              video,
              video.videoWidth,
              video.videoHeight,
            );
            if (!frame) throw new Error("no 2d context");
            const hit = scanFrame(frame.d, frame.w, frame.h);
            if (hit) {
              finish({ found: true, ...hit });
              return;
            }
          }
          finish({ found: false });
        } catch {
          finish({ found: false, error: true });
        }
      })();
    };
    video.src = url;
  });
}
