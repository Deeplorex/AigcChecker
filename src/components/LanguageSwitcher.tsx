"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const target = locale === "zh" ? "en" : "zh";
  return (
    <Link
      href={pathname}
      locale={target}
      className="flex items-center gap-1.5 rounded-full border border-border-strong px-3 py-1 font-mono text-[11.5px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="h-[14px] w-[14px]"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      {target === "en" ? "EN" : "中文"}
    </Link>
  );
}
