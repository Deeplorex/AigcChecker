"use client";

import { useLocale, useTranslations } from "next-intl";
import type { MsgRef, MsgValue } from "@/lib/detect/types";

/**
 * 递归解析 MsgRef 为当前语言的纯字符串。
 * values 里的数组按语言用「、」或 ", " 拼接。
 */
export function useMsgResolver() {
  const t = useTranslations();
  const locale = useLocale();
  const sep = locale === "zh" ? "、" : ", ";

  function resolveValue(v: MsgValue): string {
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (Array.isArray(v))
      return v
        .map((x) => (typeof x === "string" ? x : resolveRef(x)))
        .join(sep);
    return resolveRef(v);
  }

  function resolveRef(r: MsgRef): string {
    if (!r.values) return t(r.key);
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(r.values)) flat[k] = resolveValue(v);
    return t(r.key, flat);
  }

  return resolveRef;
}

export function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}
