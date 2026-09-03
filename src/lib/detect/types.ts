/**
 * 检测引擎共享类型。全部 JSON 可序列化、与语言无关：
 * 面向用户的文案一律用 MsgRef（i18n key + values），由 UI 层按当前 locale 渲染。
 * 移植自 prototype/index.html 的内联脚本。
 */

/** i18n 消息引用。values 里允许嵌套 MsgRef / MsgRef[]，由 UI 递归解析后再拼接。 */
export interface MsgRef {
  key: string;
  values?: MsgValues;
}
export type MsgValue = string | number | MsgRef | Array<string | MsgRef>;
export type MsgValues = Record<string, MsgValue>;

export function ref(key: string, values?: MsgValues): MsgRef {
  return { key, values };
}

export type CheckState = "pass" | "warn" | "fail";
export type SeverityLevel = "pass" | "warn" | "fail";

/** 法域：中国 / 欧盟 / 美国加州。 */
export type Jurisdiction = "CN" | "EU" | "US";

export type FileFormat =
  | "JPEG"
  | "PNG"
  | "WebP"
  | "MP4"
  | "MP3"
  | "WAV"
  | "M4A"
  | "OGG"
  | "FLAC"
  | "unknown";

export type C2paKind =
  | "pngCaBX"
  | "jpegJumbf"
  | "mp4Uuid"
  | "mp4Box"
  | "jumbfFeature"
  | "claimFeature";

export interface WatermarkResult {
  found: boolean;
  error?: boolean;
  zone?: "corner" | "bottom";
  density?: string;
}

export interface FileAnalysis {
  name: string;
  size: number;
  type: string;
  mtimeMs: number;
  fmt: FileFormat;
  /** 未知格式时的原始 MIME 或空串 */
  fmtRaw: string;
  meta: Array<{ field: string; value: string | MsgRef }>;
  chunks: string[];
  c2pa: boolean;
  c2paKind: C2paKind | null;
  c2paBytes?: number;
  xmp: boolean;
  pngTexts: string[];
  implicit: MsgRef[];
  aiHints: string[];
  fnameHint: boolean;
}

export type CheckKey =
  | "CN_IMPLICIT"
  | "CN_EXPLICIT"
  | "EU_MACHINE_READABLE"
  | "EU_VISIBLE"
  | "US_LATENT"
  | "US_VISIBLE"
  | "TRACE";

export interface VerdictCheck {
  key: CheckKey;
  /** 该检查项所属法域；空数组表示辅助信号，不属任何法域。 */
  jurisdictions: Jurisdiction[];
  /** 条文引用（如《标识办法》第5条），渲染时本地化。 */
  requirement: MsgRef;
  /** 识别出的生成方标签（产品专名，不进 i18n），仅 TRACE 项使用。 */
  generators?: string[];
  state: CheckState;
  detail: MsgRef;
  fix?: MsgRef;
}

export interface JurisdictionVerdict {
  jurisdiction: Jurisdiction;
  level: SeverityLevel;
}

export interface Verdict {
  level: SeverityLevel;
  titleKey: string;
  subKey: string;
  /** 各法域独立判定级别，顺序固定 CN → EU → US。 */
  byJurisdiction: JurisdictionVerdict[];
  checks: VerdictCheck[];
  aiPositive: boolean;
}

/** 可下载 / 可分享（存库）的报告载荷，与语言无关，渲染时再本地化。 */
export interface StoredReport {
  tool: string;
  version: string;
  time: string;
  file: {
    name: string;
    size: number;
    format: FileFormat;
    formatRaw: string;
    mtimeMs: number;
  };
  verdict: Verdict;
  meta: Array<{ field: string; value: string | MsgRef }>;
  chunks: string[];
  pngTexts: string[];
  xmp: boolean;
  c2pa: boolean;
  c2paKind: C2paKind | null;
  c2paBytes?: number;
  implicit: MsgRef[];
  aiHints: string[];
  fnameHint: boolean;
  watermark: WatermarkResult | null;
}
