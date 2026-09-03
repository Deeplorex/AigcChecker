import { describe, expect, it } from "vitest";
import { judge } from "./verdict";
import { ref, type FileAnalysis, type Jurisdiction } from "./types";

function base(overrides: Partial<FileAnalysis> = {}): FileAnalysis {
  return {
    name: "x.png",
    size: 100,
    type: "image/png",
    mtimeMs: 0,
    fmt: "PNG",
    fmtRaw: "",
    meta: [],
    chunks: [],
    c2pa: false,
    c2paKind: null,
    xmp: false,
    pngTexts: [],
    implicit: [],
    aiHints: [],
    fnameHint: false,
    ...overrides,
  };
}

function levelOf(v: ReturnType<typeof judge>, j: Jurisdiction) {
  return v.byJurisdiction.find((x) => x.jurisdiction === j)?.level;
}

describe("judge · 总体分级（中国驱动）", () => {
  it("无任何隐式标识 → fail", () => {
    const v = judge(base(), { found: false });
    expect(v.level).toBe("fail");
    expect(v.titleKey).toBe("verdict.fail.title");
    expect(v.checks.find((c) => c.key === "CN_IMPLICIT")?.detail.key).toBe(
      "checks.CN_IMPLICIT.detail.failNone",
    );
  });

  it("有普通元数据但无 AI 指向 → CN_IMPLICIT failWithMeta，总体仍 fail", () => {
    const v = judge(base({ meta: [{ field: "Model", value: "X1" }] }), {
      found: false,
    });
    expect(v.level).toBe("fail");
    expect(v.checks.find((c) => c.key === "CN_IMPLICIT")?.detail.key).toBe(
      "checks.CN_IMPLICIT.detail.failWithMeta",
    );
  });

  it("有隐式信号但缺 C2PA 与来源签名 → warn", () => {
    const v = judge(
      base({ xmp: true, implicit: [ref("detect.implicit.creatorTool")] }),
      { found: true, zone: "corner", density: "0.21" },
    );
    expect(v.level).toBe("warn");
    expect(v.titleKey).toBe("verdict.warn.title");
    expect(v.checks.find((c) => c.key === "CN_EXPLICIT")?.state).toBe("pass");
  });

  it("C2PA + 来源签名 → pass", () => {
    const v = judge(
      base({ c2pa: true, c2paKind: "pngCaBX", aiHints: ["OpenAI"] }),
      { found: true, zone: "bottom", density: "0.30" },
    );
    expect(v.level).toBe("pass");
    expect(v.aiPositive).toBe(true);
  });
});

describe("judge · 法域独立判定", () => {
  it("全空文件 → 三地全部 fail", () => {
    const v = judge(base(), null);
    expect(levelOf(v, "CN")).toBe("fail");
    expect(levelOf(v, "EU")).toBe("fail");
    expect(levelOf(v, "US")).toBe("fail");
  });

  it("隐式标识 + 可见水印（无 C2PA）→ CN/EU pass，US warn", () => {
    const v = judge(
      base({ xmp: true, implicit: [ref("detect.implicit.creatorTool")] }),
      { found: true, zone: "corner", density: "0.21" },
    );
    expect(levelOf(v, "CN")).toBe("pass");
    expect(levelOf(v, "EU")).toBe("pass");
    expect(levelOf(v, "US")).toBe("warn");
  });

  it("C2PA + 可见水印 → 三地全部 pass（C2PA 同时计入隐式信号）", () => {
    const v = judge(base({ c2pa: true, c2paKind: "jpegJumbf" }), {
      found: true,
      zone: "corner",
      density: "0.30",
    });
    expect(levelOf(v, "CN")).toBe("pass");
    expect(levelOf(v, "EU")).toBe("pass");
    expect(levelOf(v, "US")).toBe("pass");
  });

  it("隐式标识但无可见水印 → CN warn", () => {
    const v = judge(
      base({ xmp: true, implicit: [ref("detect.implicit.creatorTool")] }),
      { found: false },
    );
    expect(levelOf(v, "CN")).toBe("warn");
    expect(levelOf(v, "EU")).toBe("warn");
  });
});

describe("judge · 单项规则", () => {
  it("EU_MACHINE_READABLE：C2PA → foundC2pa（嵌套凭证详情）；仅元数据 → foundMeta；全缺 → fail + fix", () => {
    const withC2pa = judge(base({ c2pa: true, c2paKind: "pngCaBX" }), null);
    const eu = withC2pa.checks.find((c) => c.key === "EU_MACHINE_READABLE");
    expect(eu?.state).toBe("pass");
    expect(eu?.detail.key).toBe("checks.EU_MACHINE_READABLE.detail.foundC2pa");
    expect(eu?.requirement.key).toBe("checks.EU_MACHINE_READABLE.requirement");

    const metaOnly = judge(
      base({ xmp: true, implicit: [ref("detect.implicit.iptcExt")] }),
      null,
    );
    const eu2 = metaOnly.checks.find((c) => c.key === "EU_MACHINE_READABLE");
    expect(eu2?.state).toBe("pass");
    expect(eu2?.detail.key).toBe("checks.EU_MACHINE_READABLE.detail.foundMeta");

    const none = judge(base(), null);
    const eu3 = none.checks.find((c) => c.key === "EU_MACHINE_READABLE");
    expect(eu3?.state).toBe("fail");
    expect(eu3?.fix).toBeDefined();
  });

  it("US_LATENT：C2PA → pass；仅隐式元数据 → warn（metaOnly）；全缺 → fail", () => {
    const withC2pa = judge(base({ c2pa: true, c2paKind: "mp4Uuid" }), null);
    expect(withC2pa.checks.find((c) => c.key === "US_LATENT")?.state).toBe(
      "pass",
    );

    const metaOnly = judge(
      base({ xmp: true, implicit: [ref("detect.implicit.iptcExt")] }),
      null,
    );
    const us = metaOnly.checks.find((c) => c.key === "US_LATENT");
    expect(us?.state).toBe("warn");
    expect(us?.detail.key).toBe("checks.US_LATENT.detail.metaOnly");

    expect(
      judge(base(), null).checks.find((c) => c.key === "US_LATENT")?.state,
    ).toBe("fail");
  });

  it("可见披露：EU/US 两项均随水印扫描结果走", () => {
    const withWm = judge(base(), {
      found: true,
      zone: "bottom",
      density: "0.3",
    });
    expect(withWm.checks.find((c) => c.key === "EU_VISIBLE")?.state).toBe(
      "pass",
    );
    expect(withWm.checks.find((c) => c.key === "US_VISIBLE")?.state).toBe(
      "pass",
    );

    const noWm = judge(base(), { found: false });
    expect(noWm.checks.find((c) => c.key === "EU_VISIBLE")?.state).toBe("warn");
    expect(noWm.checks.find((c) => c.key === "US_VISIBLE")?.state).toBe("warn");
  });

  it("显式标识：视频格式走视频文案", () => {
    const v = judge(base({ fmt: "MP4" }), null);
    expect(v.checks.find((c) => c.key === "CN_EXPLICIT")?.detail.key).toBe(
      "checks.CN_EXPLICIT.detail.failVideo",
    );
  });

  it("TRACE 为辅助项：jurisdictions 为空，仅文件名 hint → fnameHint 文案", () => {
    const v = judge(base({ fnameHint: true }), null);
    const trace = v.checks.find((c) => c.key === "TRACE");
    expect(trace?.jurisdictions).toEqual([]);
    expect(trace?.detail.key).toBe("checks.TRACE.detail.fnameHint");
    expect(trace?.generators).toBeUndefined();
    expect(v.aiPositive).toBe(false);
  });

  it("TRACE 识别出生成方 → generators 结构化输出 + identified 文案", () => {
    const v = judge(base({ aiHints: ["OpenAI", "OpenAI GPT-4o"] }), null);
    const trace = v.checks.find((c) => c.key === "TRACE");
    expect(trace?.generators).toEqual(["OpenAI", "OpenAI GPT-4o"]);
    expect(trace?.detail.key).toBe("checks.TRACE.detail.identified");
    expect(trace?.detail.values?.generator).toEqual([
      "OpenAI",
      "OpenAI GPT-4o",
    ]);
    expect(trace?.state).toBe("pass");
  });

  it("每项检查都带 requirement 条文引用", () => {
    const v = judge(base(), null);
    for (const c of v.checks) {
      expect(c.requirement.key).toBe(`checks.${c.key}.requirement`);
    }
  });
});
