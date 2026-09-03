"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

/**
 * 备案号仅在 .cn 或 *.deeplorex.com 域名下展示。
 * 客户端读取 hostname，避免把域名判断烘焙进静态页面。
 */
export default function IcpRecord() {
  const t = useTranslations("footer");
  const host = useSyncExternalStore(
    () => () => {},
    () => window.location.hostname,
    () => "",
  );

  const show =
    host.endsWith(".cn") ||
    host === "deeplorex.com" ||
    host.endsWith(".deeplorex.com");
  if (!show) return null;
  return (
    <a
      href="https://beian.miit.gov.cn/"
      target="_blank"
      rel="noreferrer"
      className="transition-colors hover:text-ink"
    >
      {t("icp")}
    </a>
  );
}
