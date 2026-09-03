/**
 * 像素级可见水印启发式：扫描四角与底边条带，统计高边缘密度的小连通区域（文字块特征）。
 * 依赖浏览器 canvas / Image，仅客户端使用。
 * 移植自 prototype/index.html（detectWatermark）。
 */

import type { WatermarkResult } from "./types";

export function detectWatermark(file: File): Promise<WatermarkResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const W = img.naturalWidth;
        const H = img.naturalHeight;
        const scale = Math.min(1, 900 / Math.max(W, H));
        const w = Math.round(W * scale);
        const h = Math.round(H * scale);
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext("2d");
        if (!ctx) throw new Error("no 2d context");
        ctx.drawImage(img, 0, 0, w, h);
        const d = ctx.getImageData(0, 0, w, h).data;
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
        let found: { density: string; zone: "corner" | "bottom" } | null = null;
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
            found = {
              density: peak.toFixed(2),
              zone: zi === zones.length - 1 ? "bottom" : "corner",
            };
            break;
          }
        }
        URL.revokeObjectURL(url);
        resolve(found ? { found: true, ...found } : { found: false });
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
