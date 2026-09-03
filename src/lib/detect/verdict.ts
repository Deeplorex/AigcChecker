/**
 * 三地法规逐项判定：中国《标识办法》+ GB 45438-2025、欧盟 AI Act Art. 50、
 * 加州 SB 942。每项标注所属法域与条文引用，各法域独立出级别；
 * 总体级别仍由中国判定驱动（国内优先）。纯函数，文案全部以 MsgRef 输出。
 */

import { implicitToSignalRefs } from "./formats";
import {
  ref,
  type FileAnalysis,
  type JurisdictionVerdict,
  type SeverityLevel,
  type Verdict,
  type VerdictCheck,
  type WatermarkResult,
} from "./types";

export function judge(r: FileAnalysis, wm: WatermarkResult | null): Verdict {
  const checks: VerdictCheck[] = [];
  const isImg = r.fmt === "JPEG" || r.fmt === "PNG" || r.fmt === "WebP";
  const isAudio =
    r.fmt === "MP3" ||
    r.fmt === "WAV" ||
    r.fmt === "M4A" ||
    r.fmt === "OGG" ||
    r.fmt === "FLAC";
  const aiPositive = r.c2pa || r.aiHints.length > 0;
  const wmFound = Boolean(wm && wm.found);
  // 隐式标识必须是指向 AI 来源的元数据，普通 EXIF（相机型号/拍摄时间）不计入
  const signals = implicitToSignalRefs(r);
  const hasImplicit = signals.length > 0;

  // ── 中国 · 《标识办法》+ GB 45438-2025 ─────────────────────────────
  checks.push({
    key: "CN_IMPLICIT",
    jurisdictions: ["CN"],
    requirement: ref("checks.CN_IMPLICIT.requirement"),
    state: hasImplicit ? "pass" : "fail",
    detail: hasImplicit
      ? ref("checks.CN_IMPLICIT.detail.found", { signals })
      : r.meta.length > 0 || r.xmp
        ? ref("checks.CN_IMPLICIT.detail.failWithMeta")
        : ref("checks.CN_IMPLICIT.detail.failNone"),
    fix: hasImplicit ? undefined : ref("checks.CN_IMPLICIT.fix"),
  });

  checks.push({
    key: "CN_EXPLICIT",
    jurisdictions: ["CN"],
    requirement: ref("checks.CN_EXPLICIT.requirement"),
    state: wmFound ? "pass" : "warn",
    detail: wmFound
      ? ref("checks.CN_EXPLICIT.detail.found", {
          zone: ref(`detect.zone.${wm!.zone ?? "corner"}`),
          density: wm!.density ?? "",
        })
      : isImg
        ? ref("checks.CN_EXPLICIT.detail.failImg")
        : r.fmt === "MP4"
          ? ref("checks.CN_EXPLICIT.detail.failVideo")
          : isAudio
            ? ref("checks.CN_EXPLICIT.detail.failAudio")
            : ref("checks.CN_EXPLICIT.detail.failText"),
    fix: wmFound ? undefined : ref("checks.CN_EXPLICIT.fix"),
  });

  // ── 欧盟 · AI Act 第 50 条 ─────────────────────────────────────────
  const euMachineReadable = r.c2pa || hasImplicit;
  checks.push({
    key: "EU_MACHINE_READABLE",
    jurisdictions: ["EU"],
    requirement: ref("checks.EU_MACHINE_READABLE.requirement"),
    state: euMachineReadable ? "pass" : "fail",
    detail: r.c2pa
      ? ref("checks.EU_MACHINE_READABLE.detail.foundC2pa", {
          kind: ref(
            `checks.C2PA.detail.found.${r.c2paKind ?? "jumbfFeature"}`,
            { bytes: r.c2paBytes ?? 0 },
          ),
        })
      : hasImplicit
        ? ref("checks.EU_MACHINE_READABLE.detail.foundMeta", { signals })
        : ref("checks.EU_MACHINE_READABLE.detail.missing"),
    fix: euMachineReadable ? undefined : ref("checks.EU_MACHINE_READABLE.fix"),
  });

  checks.push({
    key: "EU_VISIBLE",
    jurisdictions: ["EU"],
    requirement: ref("checks.EU_VISIBLE.requirement"),
    state: wmFound ? "pass" : "warn",
    detail: wmFound
      ? ref("checks.EU_VISIBLE.detail.found")
      : ref("checks.EU_VISIBLE.detail.missing"),
  });

  // ── 美国加州 · SB 942 ──────────────────────────────────────────────
  checks.push({
    key: "US_LATENT",
    jurisdictions: ["US"],
    requirement: ref("checks.US_LATENT.requirement"),
    state: r.c2pa ? "pass" : hasImplicit ? "warn" : "fail",
    detail: r.c2pa
      ? ref("checks.US_LATENT.detail.foundC2pa", {
          kind: ref(
            `checks.C2PA.detail.found.${r.c2paKind ?? "jumbfFeature"}`,
            { bytes: r.c2paBytes ?? 0 },
          ),
        })
      : hasImplicit
        ? ref("checks.US_LATENT.detail.metaOnly")
        : ref("checks.US_LATENT.detail.missing"),
    fix: r.c2pa ? undefined : ref("checks.US_LATENT.fix"),
  });

  checks.push({
    key: "US_VISIBLE",
    jurisdictions: ["US"],
    requirement: ref("checks.US_VISIBLE.requirement"),
    state: wmFound ? "pass" : "warn",
    detail: wmFound
      ? ref("checks.US_VISIBLE.detail.found")
      : ref("checks.US_VISIBLE.detail.missing"),
  });

  // ── 辅助信号（不属任何法域）────────────────────────────────────────
  const generators = [...new Set(r.aiHints)].slice(0, 5);
  checks.push({
    key: "TRACE",
    jurisdictions: [],
    requirement: ref("checks.TRACE.requirement"),
    state: aiPositive ? "pass" : "warn",
    generators: generators.length ? generators : undefined,
    detail: generators.length
      ? ref("checks.TRACE.detail.identified", { generator: generators })
      : r.c2pa
        ? ref("checks.TRACE.detail.c2paOnly")
        : r.fnameHint
          ? ref("checks.TRACE.detail.fnameHint")
          : ref("checks.TRACE.detail.none"),
  });

  const byJurisdiction: JurisdictionVerdict[] = [
    { jurisdiction: "CN", level: cnLevel(hasImplicit, wmFound) },
    {
      jurisdiction: "EU",
      level: !euMachineReadable ? "fail" : wmFound ? "pass" : "warn",
    },
    {
      jurisdiction: "US",
      level:
        !r.c2pa && !hasImplicit ? "fail" : r.c2pa && wmFound ? "pass" : "warn",
    },
  ];

  // 总体级别仍由中国判定驱动（产品定位国内优先）
  const level = !hasImplicit
    ? "fail"
    : r.c2pa && r.aiHints.length
      ? "pass"
      : "warn";
  const titleKey = `verdict.${level}.title`;
  const subKey = `verdict.${level}.sub`;
  return { level, titleKey, subKey, byJurisdiction, checks, aiPositive };
}

function cnLevel(hasImplicit: boolean, wmFound: boolean): SeverityLevel {
  if (!hasImplicit) return "fail";
  return wmFound ? "pass" : "warn";
}

export function buildReport(
  r: FileAnalysis,
  v: Verdict,
  wm: WatermarkResult | null,
  toolName: string,
  version: string,
) {
  return {
    tool: toolName,
    version,
    time: new Date().toISOString(),
    file: {
      name: r.name,
      size: r.size,
      format: r.fmt,
      formatRaw: r.fmtRaw,
      mtimeMs: r.mtimeMs,
    },
    verdict: v,
    meta: r.meta,
    chunks: r.chunks,
    pngTexts: r.pngTexts,
    xmp: r.xmp,
    c2pa: r.c2pa,
    c2paKind: r.c2paKind,
    c2paBytes: r.c2paBytes,
    implicit: r.implicit,
    aiHints: r.aiHints,
    fnameHint: r.fnameHint,
    watermark: wm,
  };
}
