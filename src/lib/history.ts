/**
 * 个人检测历史：纯 localStorage，仅存报告 JSON（StoredReport），
 * 用于在本机再次下载报告。不联网、不上传；浏览器禁用或写满时静默降级。
 */

import type { StoredReport } from "./detect/types";

const KEY = "labelcheck:history";
const MAX_ENTRIES = 20;

export function loadHistory(): StoredReport[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is StoredReport =>
        Boolean(x) && typeof x === "object" && "file" in (x as object),
    );
  } catch {
    return [];
  }
}

export function saveReportToHistory(report: StoredReport): void {
  try {
    const list = [report, ...loadHistory()].slice(0, MAX_ENTRIES);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 存储满或被禁用时不影响检测主流程
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 同上
  }
}
