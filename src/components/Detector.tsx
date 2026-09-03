"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { analyzeBuffer } from "@/lib/detect/formats";
import { detectVideoWatermark, detectWatermark } from "@/lib/detect/watermark";
import { buildReport, judge } from "@/lib/detect/verdict";
import type { StoredReport, WatermarkResult } from "@/lib/detect/types";
import ReportView from "./ReportView";

const MAX_SIZE = 50 * 1048576;
const PHASE_COUNT = 5;

type Phase = "idle" | "scanning" | "done";
type ShareState = "idle" | "working" | "copied" | "error";

export default function Detector() {
  const t = useTranslations();
  const locale = useLocale();
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const [doneSteps, setDoneSteps] = useState(0);
  const [report, setReport] = useState<StoredReport | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [srcPath, setSrcPath] = useState("");
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Nav「开始检测」按钮：已有报告时重置回空白检测框（每次渲染重挂以拿到最新闭包）
  useEffect(() => {
    const onReset = () => {
      if (phase === "done") reset();
    };
    window.addEventListener("labelcheck:reset", onReset);
    return () => window.removeEventListener("labelcheck:reset", onReset);
  });

  async function runPhases() {
    setPhase("scanning");
    setDoneSteps(0);
    for (let i = 0; i < PHASE_COUNT; i++) {
      setActiveStep(i);
      await new Promise((res) =>
        setTimeout(res, i === PHASE_COUNT - 1 ? 420 : 280),
      );
      setDoneSteps(i + 1);
    }
  }

  async function handle(file: File | undefined | null) {
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setFileError(t("tool.fileTooLarge"));
      return;
    }
    setFileError(null);
    setShareState("idle");
    const analyze = async (): Promise<StoredReport> => {
      const buf = await file.arrayBuffer();
      const r = analyzeBuffer(buf, file.name, file.type, file.lastModified);
      let wm: WatermarkResult | null = null;
      try {
        if (r.fmt === "JPEG" || r.fmt === "PNG" || r.fmt === "WebP") {
          wm = await detectWatermark(file);
        } else if (r.fmt === "MP4") {
          wm = await detectVideoWatermark(file);
        }
      } catch {
        wm = { found: false, error: true };
      }
      const v = judge(r, wm);
      return buildReport(r, v, wm, "内容标检 LabelCheck", "V2.1");
    };
    const [, result] = await Promise.all([runPhases(), analyze()]);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(
      file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    );
    setReport(result);
    setPhase("done");
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setTimeout(
      () =>
        reportRef.current?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        }),
      50,
    );
  }

  function reset() {
    setPhase("idle");
    setReport(null);
    setSrcPath("");
    setShareState("idle");
    setFileError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // 报告卸载后页面变矮，浏览器会把滚动位置钳到底部；
    // 等 DOM 更新完再滚回检测区顶部（与检测完成后的定位逻辑一致）
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setTimeout(
      () =>
        rootRef.current?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        }),
      50,
    );
  }

  function download() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `label-check-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function share() {
    if (!report || shareState === "working") return;
    setShareState("working");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { id } = (await res.json()) as { id: string };
      const link = `${location.origin}${locale === "zh" ? "" : "/en"}/r/${id}`;
      await navigator.clipboard.writeText(link);
      setShareState("copied");
    } catch (e) {
      console.error(e);
      setShareState("error");
    }
  }

  return (
    <div
      ref={rootRef}
      className="scroll-mt-20 overflow-hidden rounded-lg border border-border-strong bg-surface shadow-[0_14px_40px_-18px_rgba(8,45,79,0.18)]"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3 font-mono text-[12.5px] text-ink-mute">
        <div className="flex gap-1.5" aria-hidden="true">
          <i className="block h-[9px] w-[9px] rounded-full border border-border-strong" />
          <i className="block h-[9px] w-[9px] rounded-full border border-border-strong" />
          <i className="block h-[9px] w-[9px] rounded-full border border-border-strong" />
        </div>
        <span>{t("tool.head")}</span>
      </div>

      {phase === "idle" ? (
        <>
          <label
            htmlFor="fileInput"
            tabIndex={0}
            className="block cursor-pointer px-7 py-11 text-center transition-colors hover:bg-[#f4f3ee]"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("bg-[#f4f3ee]");
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("bg-[#f4f3ee]");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("bg-[#f4f3ee]");
              void handle(e.dataTransfer.files[0]);
            }}
          >
            <svg
              className="mx-auto mb-3.5 h-11 w-11 text-ink-soft"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M12 16V4m0 0l-4 4m4-4l4 4" />
              <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
            </svg>
            <h3 className="text-base font-semibold">{t("tool.dzTitle")}</h3>
            <p className="mx-auto mt-1.5 max-w-[520px] text-[13px] text-ink-mute">
              {t("tool.dzHint")}
            </p>
            <div className="mt-4 inline-flex gap-2 font-mono text-[11px] text-ink-soft">
              {["JPG", "PNG", "WebP", "MP4", "MOV"].map((f) => (
                <em
                  key={f}
                  className="rounded border border-border bg-bg px-2 py-0.5 not-italic"
                >
                  {f}
                </em>
              ))}
            </div>
          </label>
          {fileError ? (
            <div
              role="alert"
              className="border-t border-border bg-fail-bg px-7 py-3 text-[13px] text-fail"
            >
              {fileError}
            </div>
          ) : null}
        </>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        id="fileInput"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
        onClick={(e) => {
          // 连续选择同一文件也能再次触发检测
          (e.target as HTMLInputElement).value = "";
        }}
        onChange={(e) => void handle(e.target.files?.[0])}
      />

      {phase === "scanning" ? (
        <div className="px-7 py-6" aria-live="polite">
          {Array.from({ length: PHASE_COUNT }, (_, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 py-2 text-[13.5px] transition-opacity ${
                i === activeStep
                  ? "text-ink opacity-100"
                  : i < doneSteps
                    ? "text-ink-soft opacity-100"
                    : "text-ink-mute opacity-45"
              }`}
            >
              <span
                className={`relative h-2 w-2 flex-none rounded-full border-[1.5px] ${
                  i < doneSteps
                    ? "border-pass bg-pass"
                    : i === activeStep
                      ? "phase-dot-active border-ink"
                      : "border-border-strong"
                }`}
              />
              {t(`tool.phase${i}`)}
            </div>
          ))}
        </div>
      ) : null}

      {phase === "done" && report ? (
        <div ref={reportRef} className="scroll-mt-20">
          <div className="border-t border-border bg-[#fcfcfa] px-7 py-3.5">
            <label
              htmlFor="srcPath"
              className="mb-1.5 block text-[12.5px] text-ink-mute"
            >
              {t("tool.srcLabel")}
            </label>
            <input
              type="text"
              id="srcPath"
              value={srcPath}
              onChange={(e) => setSrcPath(e.target.value)}
              placeholder={t("tool.srcPlaceholder")}
              autoComplete="off"
              spellCheck={false}
              className="w-full max-w-[560px] rounded-md border border-border-strong bg-surface px-3 py-2 font-mono text-[12.5px] text-ink"
            />
          </div>
          <ReportView report={report} previewUrl={previewUrl} srcPath={srcPath}>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="cursor-pointer rounded-full bg-[#1c2b3a] px-[22px] py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-ink active:scale-[0.98]"
                onClick={download}
              >
                {t("report.download")}
              </button>
              <button
                className="cursor-pointer rounded-full border border-border-strong bg-transparent px-[22px] py-2.5 text-[13.5px] font-medium text-ink transition-colors hover:border-ink active:scale-[0.98] disabled:opacity-50"
                onClick={share}
                disabled={shareState === "working"}
              >
                {shareState === "copied"
                  ? t("report.shareCopied")
                  : t("report.share")}
              </button>
              <button
                className="cursor-pointer rounded-full border border-border-strong bg-transparent px-[22px] py-2.5 text-[13.5px] font-medium text-ink transition-colors hover:border-ink active:scale-[0.98]"
                onClick={reset}
              >
                {t("report.reset")}
              </button>
            </div>
            {shareState === "error" ? (
              <div className="mt-2 text-[12.5px] text-fail">
                {t("report.shareFailed", { reason: "network/server" })}
              </div>
            ) : null}
            <div className="mt-4 flex items-start gap-2 text-xs text-ink-mute">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="mt-0.5 flex-none"
                aria-hidden="true"
              >
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 018 0v3" />
              </svg>
              {t("report.privacyNote")}
            </div>
          </ReportView>
        </div>
      ) : null}
    </div>
  );
}
