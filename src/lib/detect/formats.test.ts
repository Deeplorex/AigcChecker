import { describe, expect, it } from "vitest";
import { analyzeBuffer } from "./formats";

function ascii(s: string): number[] {
  return s.split("").map((c) => c.charCodeAt(0));
}

function chunk(type: string, data: number[]): number[] {
  const len = data.length;
  return [
    (len >>> 24) & 255,
    (len >>> 16) & 255,
    (len >>> 8) & 255,
    len & 255,
    ...ascii(type),
    ...data,
    0,
    0,
    0,
    0, // CRC 不参与解析，填 0
  ];
}

function pngWith(...chunks: number[][]): ArrayBuffer {
  return new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...chunks.flat(),
  ]).buffer;
}

describe("analyzeBuffer · PNG", () => {
  it("识别 caBX 块为 C2PA，tEXt parameters 记为隐式特征", () => {
    const buf = pngWith(
      chunk("IHDR", new Array(13).fill(0)),
      chunk("caBX", ascii("c2pa manifest stub")),
      chunk("tEXt", [...ascii("parameters"), 0, ...ascii("steps: 20")]),
      chunk("IEND", []),
    );
    const r = analyzeBuffer(buf, "a.png", "image/png", 0);
    expect(r.fmt).toBe("PNG");
    expect(r.c2pa).toBe(true);
    expect(r.c2paKind).toBe("pngCaBX");
    expect(r.chunks).toEqual(["IHDR", "caBX", "tEXt", "IEND"]);
    expect(r.implicit.some((m) => m.key === "detect.implicit.pngText")).toBe(
      true,
    );
  });

  it("普通 PNG 不带任何标识", () => {
    const buf = pngWith(
      chunk("IHDR", new Array(13).fill(0)),
      chunk("IEND", []),
    );
    const r = analyzeBuffer(buf, "b.png", "image/png", 0);
    expect(r.c2pa).toBe(false);
    expect(r.implicit).toHaveLength(0);
    expect(r.aiHints).toHaveLength(0);
  });
});

function jpeg(...segments: number[][]): ArrayBuffer {
  return new Uint8Array([0xff, 0xd8, ...segments.flat(), 0xff, 0xda]).buffer;
}

function appSegment(marker: number, payload: number[]): number[] {
  const len = payload.length + 2;
  return [0xff, marker, (len >>> 8) & 255, len & 255, ...payload];
}

describe("analyzeBuffer · JPEG", () => {
  it("解析 APP1 EXIF 的 ASCII 字段", () => {
    // TIFF: little-endian, 1 个 IFD0 条目 Model(0x0110) type=ASCII cnt=3 内联 'X1\0'
    const tiff = [
      ...ascii("Exif\0\0"),
      0x49,
      0x49,
      0x2a,
      0x00,
      0x08,
      0x00,
      0x00,
      0x00, // header
      0x01,
      0x00, // 1 entry
      0x10,
      0x01,
      0x02,
      0x00,
      0x03,
      0x00,
      0x00,
      0x00, // tag/type/count
      ...ascii("X1\0"),
      0x00, // inline value + pad
      0x00,
      0x00,
      0x00,
      0x00, // next IFD
    ];
    const r = analyzeBuffer(
      jpeg(appSegment(0xe1, tiff)),
      "c.jpg",
      "image/jpeg",
      0,
    );
    expect(r.fmt).toBe("JPEG");
    expect(r.meta).toContainEqual({ field: "Model", value: "X1" });
    expect(r.chunks[0]).toBe("APP1(EXIF)");
    expect(r.c2pa).toBe(false);
  });

  it("APP11 jumbf 段识别为 C2PA", () => {
    const r = analyzeBuffer(
      jpeg(appSegment(0xeb, ascii("jumbf\0\0c2pa"))),
      "d.jpg",
      "image/jpeg",
      0,
    );
    expect(r.c2pa).toBe(true);
    expect(r.c2paKind).toBe("jpegJumbf");
  });
});

describe("analyzeBuffer · 全文签名与兜底", () => {
  it("命中生成工具签名", () => {
    const buf = new Uint8Array([
      0xff,
      0xd8,
      ...ascii("created by Midjourney"),
      0xff,
      0xda,
    ]).buffer;
    const r = analyzeBuffer(buf, "e.jpg", "image/jpeg", 0);
    expect(r.aiHints).toContain("Midjourney");
  });

  it("jumbf+c2pa.manifest 特征串兜底识别 C2PA", () => {
    const buf = new Uint8Array(ascii("xxxx jumbf yyyy c2pa.manifest zzzz"))
      .buffer;
    const r = analyzeBuffer(buf, "f.bin", "", 0);
    expect(r.fmt).toBe("unknown");
    expect(r.c2pa).toBe(true);
    expect(r.c2paKind).toBe("jumbfFeature");
  });

  it("文件名 hint 单独成立", () => {
    const r = analyzeBuffer(new Uint8Array(16).buffer, "dall-e-xyz.png", "", 0);
    expect(r.fnameHint).toBe(true);
  });
});
