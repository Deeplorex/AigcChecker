import { neon } from "@neondatabase/serverless";

/**
 * Neon serverless 客户端（裸 SQL，单表，无 ORM）。
 * DATABASE_URL 未配置时返回 null，分享功能降级为 503，检测功能不受影响。
 */
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

/** 短 ID：12 位小写字母数字，约 62^12 空间，碰撞可忽略且冲突时插入会报错重试 */
export function newReportId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(bytes, (b) => alphabet[b % 36]).join("");
}
