/**
 * 容器级二进制解析：PNG chunks / JPEG APPn+EXIF / WebP RIFF / MP4 box，
 * C2PA 特征与生成工具签名扫描。纯函数，无 DOM 依赖，浏览器与 Node 均可运行。
 * 移植自 prototype/index.html（analyze / parseEXIF）。
 */

import { GEN_SIGNATURES, FILENAME_HINTS } from "./signatures";
import { ref, type FileAnalysis, type MsgRef } from "./types";

function hex(view: DataView, off: number, len: number): string {
  let s = "";
  for (let i = 0; i < len && off + i < view.byteLength; i++)
    s += String.fromCharCode(view.getUint8(off + i));
  return s;
}

/** JPEG APP1 段内 TIFF 结构的最小 EXIF 解析 */
function parseEXIF(
  view: DataView,
  app1off: number,
): Array<{ field: string; value: string }> {
  const meta: Array<{ field: string; value: string }> = [];
  try {
    if (hex(view, app1off + 4, 6) !== "Exif\0\0") return meta;
    const t = app1off + 10;
    const le = hex(view, t, 2) === "II";
    const u16 = (o: number) =>
      le ? view.getUint16(o, true) : view.getUint16(o, false);
    const u32 = (o: number) =>
      le ? view.getUint32(o, true) : view.getUint32(o, false);
    const ifd0 = t + u32(t + 4);
    const n = u16(ifd0);
    const tags: Record<number, string> = {
      0x010f: "Make",
      0x0110: "Model",
      0x0132: "DateTime",
      0x0131: "Software",
      0x8298: "Copyright",
    };
    for (let i = 0; i < n; i++) {
      const e = ifd0 + 2 + i * 12;
      const tag = u16(e);
      const type = u16(e + 2);
      const cnt = u32(e + 4);
      if (!tags[tag]) continue;
      if (type === 2 && cnt > 0 && cnt < 200) {
        const off = cnt <= 4 ? e + 8 : t + u32(e + 8);
        const s = hex(view, off, cnt).replace(/\0.*$/, "").trim();
        if (s) meta.push({ field: tags[tag], value: s });
      }
    }
  } catch {
    // 元数据损坏不影响主流程
  }
  return meta;
}

export function analyzeBuffer(
  buf: ArrayBuffer,
  fileName: string,
  mimeType: string,
  mtimeMs: number,
): FileAnalysis {
  const view = new DataView(buf);
  // 全文件转 latin1 字符串，用于 O(1) 模式检索（仅 ASCII 模式，编码映射不影响）
  const raw = new TextDecoder("iso-8859-1").decode(buf);
  const has = (p: string) => raw.includes(p);

  const r: FileAnalysis = {
    name: fileName,
    size: buf.byteLength,
    type: mimeType,
    mtimeMs,
    fmt: "unknown",
    fmtRaw: mimeType || "",
    meta: [],
    chunks: [],
    c2pa: false,
    c2paKind: null,
    xmp: false,
    pngTexts: [],
    implicit: [],
    aiHints: [],
    fnameHint: FILENAME_HINTS.test(fileName),
  };

  const head = hex(view, 0, 16);
  if (view.getUint8(0) === 0xff && view.getUint8(1) === 0xd8) r.fmt = "JPEG";
  else if (head.startsWith("\x89PNG")) r.fmt = "PNG";
  else if (head.startsWith("RIFF") && hex(view, 8, 4) === "WEBP")
    r.fmt = "WebP";
  else if (hex(view, 4, 4) === "ftyp") r.fmt = "MP4";

  /* --- PNG 块遍历 --- */
  if (r.fmt === "PNG") {
    let off = 8;
    while (off + 8 <= view.byteLength) {
      const len = view.getUint32(off, false);
      const type = hex(view, off + 4, 4);
      r.chunks.push(type);
      const dOff = off + 8;
      if (type === "caBX") {
        r.c2pa = true;
        r.c2paKind = "pngCaBX";
        r.c2paBytes = len;
      }
      if (type === "tEXt" || type === "iTXt" || type === "zTXt") {
        const body = raw.slice(dOff, dOff + Math.min(len, 2048));
        const kw = (body.split("\x00")[0] || "").slice(0, 60);
        if (kw) r.pngTexts.push(`${type}: ${kw}`);
        if (/parameters|prompt|workflow/i.test(kw))
          r.implicit.push(ref("detect.implicit.pngText", { keyword: kw }));
      }
      if (type === "eXIf")
        r.meta.push({
          field: "eXIf chunk",
          value: ref("detect.meta.presentBytes", { bytes: len }),
        });
      off += 12 + len;
      if (type === "IEND" || off > view.byteLength) break;
    }
  }

  /* --- JPEG APPn 遍历 --- */
  if (r.fmt === "JPEG") {
    let off = 2;
    while (off < view.byteLength - 4) {
      if (view.getUint8(off) !== 0xff) {
        off++;
        continue;
      }
      const marker = view.getUint8(off + 1);
      if (marker >= 0xe0 && marker <= 0xef) {
        const len = view.getUint16(off + 2, false);
        const seg = raw.slice(off + 4, off + 4 + Math.min(len, 64));
        r.chunks.push(
          `APP${marker - 0xe0}${seg.startsWith("Exif") ? "(EXIF)" : seg.includes("xmp") || seg.includes("XMP") ? "(XMP)" : ""}`,
        );
        if (marker === 0xe1) {
          r.meta.push(...parseEXIF(view, off));
          if (seg.includes("xap") || seg.includes("xmp") || seg.includes("XMP"))
            r.xmp = true;
        }
        // JPEG C2PA 位于 APP11 (JUMBF)
        if (marker === 0xeb && seg.includes("jumbf")) {
          r.c2pa = true;
          r.c2paKind = "jpegJumbf";
        }
        off += 2 + len;
      } else if (marker === 0xda) {
        break;
      } else {
        off += 2;
      }
    }
  }

  /* --- WebP RIFF 遍历 --- */
  if (r.fmt === "WebP") {
    let off = 12;
    while (off + 8 <= view.byteLength) {
      const cc = hex(view, off, 4);
      const len = view.getUint32(off + 4, true);
      r.chunks.push(cc.trim());
      if (cc === "EXIF")
        r.meta.push({
          field: "EXIF chunk",
          value: ref("detect.meta.presentBytes", { bytes: len }),
        });
      if (cc === "XMP ") r.xmp = true;
      off += 8 + len + (len % 2);
    }
  }

  /* --- MP4 顶层 box 遍历 --- */
  if (r.fmt === "MP4") {
    let off = 0;
    while (off + 8 <= view.byteLength && r.chunks.length < 40) {
      const size = view.getUint32(off, false);
      const type = hex(view, off + 4, 4);
      r.chunks.push(type);
      if (type === "uuid") {
        if (raw.slice(off, off + 64).includes("c2pa")) {
          r.c2pa = true;
          r.c2paKind = "mp4Uuid";
        }
      }
      if (type === "c2pa") {
        r.c2pa = true;
        r.c2paKind = "mp4Box";
      }
      if (size < 8) break;
      off += size;
    }
  }

  /* --- 全文模式扫描（兜底 + 签名识别） --- */
  if (!r.c2pa && has("jumbf") && (has("c2pa") || has("c2pa.manifest"))) {
    r.c2pa = true;
    r.c2paKind = "jumbfFeature";
  }
  if (!r.c2pa && has("c2pa") && has("c2pa.claim")) {
    r.c2pa = true;
    r.c2paKind = "claimFeature";
  }
  if (has("xpacket") || has("dc:format") || has("x:xmpmeta")) r.xmp = true;
  if (has("xmp:CreatorTool"))
    r.implicit.push(ref("detect.implicit.creatorTool"));
  if (has("Iptc4xmpExt")) r.implicit.push(ref("detect.implicit.iptcExt"));
  for (const [pat, label] of GEN_SIGNATURES) {
    if (has(pat) && !r.aiHints.includes(label)) r.aiHints.push(label);
  }

  return r;
}

export function implicitToSignalRefs(r: FileAnalysis): MsgRef[] {
  const signals: MsgRef[] = [];
  if (r.implicit.length)
    signals.push(
      ref("detect.signal.features", { features: r.implicit.slice(0, 4) }),
    );
  if (r.xmp && r.implicit.length) signals.push(ref("detect.signal.xmpAi"));
  if (r.c2pa) signals.push(ref("detect.signal.c2pa"));
  if (r.aiHints.length) signals.push(ref("detect.signal.toolSig"));
  return signals;
}
