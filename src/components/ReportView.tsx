"use client";

import { useLocale, useTranslations } from "next-intl";
import type { StoredReport } from "@/lib/detect/types";
import { fmtSize, useMsgResolver } from "./use-msg";

const badgeClass: Record<string, string> = {
  pass: "border-pass bg-pass-bg text-pass",
  warn: "border-warn bg-warn-bg text-warn",
  fail: "border-fail bg-fail-bg text-fail",
};
const iconClass: Record<string, string> = {
  pass: "bg-pass-bg text-pass",
  warn: "bg-warn-bg text-warn",
  fail: "bg-fail-bg text-fail",
};

/**
 * 报告视图：本地检测后与 /r/[id] 分享页共用。
 * children 作为操作区（下载/分享/重置或返回首页）。
 */
export default function ReportView({
  report,
  previewUrl,
  srcPath,
  children,
}: {
  report: StoredReport;
  previewUrl?: string | null;
  srcPath?: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const msg = useMsgResolver();
  const v = report.verdict;

  const fmtLabel =
    report.file.format === "MP4"
      ? t("detect.fmt.mp4")
      : report.file.format === "unknown"
        ? report.file.formatRaw || t("detect.fmt.unknown")
        : report.file.format;

  const metaRows: Array<[string, string]> = report.meta.map((m) => [
    m.field,
    typeof m.value === "string" ? m.value : msg(m.value),
  ]);
  const extras: Array<[string, string]> = [];
  if (report.chunks.length)
    extras.push([
      t("detect.extra.container"),
      report.chunks.slice(0, 24).join(" · "),
    ]);
  if (report.pngTexts.length)
    extras.push([
      t("detect.extra.pngTexts"),
      report.pngTexts.slice(0, 8).join("；"),
    ]);
  if (report.xmp)
    extras.push([
      t("detect.extra.xmpPresent"),
      t("detect.extra.xmpPresentValue"),
    ]);
  if (report.watermark)
    extras.push([
      t("detect.extra.wmScan"),
      report.watermark.found
        ? t("detect.extra.wmFound", {
            zone: t(`detect.zone.${report.watermark.zone ?? "corner"}`),
            density: report.watermark.density ?? "",
          })
        : t("detect.extra.wmNotFound"),
    ]);
  if (report.implicit.length)
    extras.push([
      t("detect.extra.implicitHits"),
      report.implicit
        .slice(0, 8)
        .map((r) => msg(r))
        .join(locale === "zh" ? "，" : ", "),
    ]);
  const allRows = [...metaRows, ...extras];

  // 路径诊断（仅在未检出 AI 信号时显示）
  let pathHint: "codex" | "reencoded" | null = null;
  if (!v.aiPositive && srcPath) {
    if (/\.codex[\/\\]generated_images/i.test(srcPath)) pathHint = "codex";
    else if (srcPath.trim() && !/(downloads|desktop)/i.test(srcPath))
      pathHint = "reencoded";
  }

  // 新版报告带 byJurisdiction → 按法域分组；旧分享报告（无该字段）走扁平渲染
  const grouped = Array.isArray(v.byJurisdiction);
  const auxChecks = grouped
    ? v.checks.filter((c) => !c.jurisdictions?.length)
    : [];
  const levelLabel = (level: string) =>
    level === "pass"
      ? t("report.badgePass")
      : level === "warn"
        ? t("report.badgeWarn")
        : t("report.badgeFail");

  const renderCheck = (c: (typeof v.checks)[number]) => (
    <div
      key={c.key}
      className="flex items-start gap-3.5 border-b border-border px-1 py-3 last:border-b-0"
    >
      <span
        className={`mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-xs ${iconClass[c.state]}`}
      >
        {c.state === "pass"
          ? t("report.iconPass")
          : c.state === "warn"
            ? t("report.iconWarn")
            : t("report.iconFail")}
      </span>
      <div className="flex-1">
        <div className="text-sm font-medium">
          {t(`checks.${c.key}.title`)}
          <code className="ml-2 font-mono text-[11.5px] font-normal text-ink-mute">
            {grouped && c.requirement
              ? msg(c.requirement)
              : t(`checks.${c.key}.code`)}
          </code>
        </div>
        <div className="mt-0.5 text-[13px] text-ink-soft">{msg(c.detail)}</div>
        {c.generators?.length ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">
              {t("report.generatorLabel")}
            </span>
            {c.generators.map((g) => (
              <span
                key={g}
                className="rounded-full border border-border bg-bg px-2.5 py-0.5 font-mono text-[11.5px] text-ink"
              >
                {g}
              </span>
            ))}
          </div>
        ) : null}
        {c.fix ? (
          <div className="mt-1.5 border-l-2 border-warn-bg pl-2.5 text-[12.5px] text-warn">
            {t("report.fixPrefix")}
            {msg(c.fix)}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="grid min-h-[200px] grid-cols-1 border-t border-border md:grid-cols-[250px_1fr]">
      <aside className="border-b border-border bg-[#fcfcfa] p-6 md:border-r md:border-b-0">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={t("report.thumbAlt")}
            width={800}
            height={600}
            className="block aspect-[4/3] w-full rounded-md border border-border bg-bg object-contain"
          />
        ) : null}
        <dl className="mt-3.5 font-mono text-[11.5px] leading-loose text-ink-soft">
          <dt className="float-left clear-left mr-2 text-ink-mute">
            {t("report.fileName")}
          </dt>
          <dd className="overflow-hidden break-all">{report.file.name}</dd>
          <dt className="float-left clear-left mr-2 text-ink-mute">
            {t("report.fileSize")}
          </dt>
          <dd className="overflow-hidden">{fmtSize(report.file.size)}</dd>
          <dt className="float-left clear-left mr-2 text-ink-mute">
            {t("report.fileFormat")}
          </dt>
          <dd className="overflow-hidden">{fmtLabel}</dd>
          <dt className="float-left clear-left mr-2 text-ink-mute">
            {t("report.fileMtime")}
          </dt>
          <dd className="overflow-hidden">
            {new Date(report.file.mtimeMs).toLocaleString(
              locale === "zh" ? "zh-CN" : "en-US",
            )}
          </dd>
        </dl>
      </aside>

      <section className="px-7 py-6">
        <div className="flex items-start gap-4 border-b border-border pb-5">
          <span
            className={`mt-0.5 flex-none rounded-full border-[1.5px] px-3.5 py-1.5 font-mono text-xs font-medium tracking-widest ${badgeClass[v.level]}`}
          >
            {v.level === "pass"
              ? t("report.badgePass")
              : v.level === "warn"
                ? t("report.badgeWarn")
                : t("report.badgeFail")}
          </span>
          <div>
            <h2 className="text-xl font-semibold leading-snug">
              {t(v.titleKey)}
            </h2>
            <div className="mt-1 text-[13.5px] text-ink-soft">
              {t(v.subKey)}
            </div>
          </div>
        </div>

        <div className="mt-5 mb-2.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-mute">
          {t("report.checksLabel")}
        </div>
        {grouped ? (
          <div className="flex flex-col gap-5">
            {v.byJurisdiction.map((jv) => (
              <div key={jv.jurisdiction}>
                <div className="mb-1 flex items-center justify-between gap-3 border-b border-border px-1 pb-2">
                  <div className="text-[13.5px] font-semibold">
                    {t(`jurisdiction.${jv.jurisdiction}.name`)}
                    <span className="ml-2 font-mono text-[11.5px] font-normal text-ink-mute">
                      {t(`jurisdiction.${jv.jurisdiction}.law`)}
                    </span>
                  </div>
                  <span
                    className={`flex-none rounded-full border-[1.5px] px-2.5 py-0.5 font-mono text-[10.5px] font-medium tracking-widest ${badgeClass[jv.level]}`}
                  >
                    {levelLabel(jv.level)}
                  </span>
                </div>
                <div className="flex flex-col">
                  {v.checks
                    .filter((c) => c.jurisdictions?.includes(jv.jurisdiction))
                    .map(renderCheck)}
                </div>
              </div>
            ))}
            {auxChecks.length ? (
              <div>
                <div className="mb-1 border-b border-border px-1 pb-2 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-mute">
                  {t("report.auxLabel")}
                </div>
                <div className="flex flex-col">
                  {auxChecks.map(renderCheck)}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col">{v.checks.map(renderCheck)}</div>
        )}

        {!v.aiPositive ? (
          <div className="mt-4 rounded-md bg-info-bg px-4 py-3.5 text-[13px] text-ink-soft [&_b]:text-ink [&_code]:font-mono">
            {t.rich("aiNote.body", {
              b: (chunks) => <b>{chunks}</b>,
            })}
            {pathHint ? (
              <>
                <br />
                <br />
                {t.rich(`aiNote.${pathHint}`, {
                  b: (chunks) => <b>{chunks}</b>,
                  code: (chunks) => <code>{chunks}</code>,
                })}
              </>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 mb-2.5 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-mute">
          {t("report.metaLabel")}
        </div>
        {allRows.length ? (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="border-b border-border px-2.5 py-[7px] text-left font-mono text-[11px] font-normal tracking-wider text-ink-mute">
                  {t("report.metaField")}
                </th>
                <th className="border-b border-border px-2.5 py-[7px] text-left font-mono text-[11px] font-normal tracking-wider text-ink-mute">
                  {t("report.metaContent")}
                </th>
              </tr>
            </thead>
            <tbody>
              {allRows.map(([k, val]) => (
                <tr key={k}>
                  <td className="border-b border-border px-2.5 py-2 font-mono text-xs text-ink">
                    {k}
                  </td>
                  <td className="border-b border-border px-2.5 py-2 font-mono text-xs break-all text-ink-soft">
                    {val.slice(0, 200)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-1 py-3 text-[13px] text-ink-mute">
            {t("report.metaNone")}
          </div>
        )}

        {children}
      </section>
    </div>
  );
}
