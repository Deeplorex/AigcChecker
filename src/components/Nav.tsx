"use client";

import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M3 12h18" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function FunnelIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function LogoMark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-ink text-bg shadow-[0_1px_2px_rgba(8,45,79,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:-rotate-6">
      <svg {...iconProps} className="h-[18px] w-[18px]" strokeWidth={1.8}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </span>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13.5px] text-ink-soft transition-colors hover:bg-info-bg hover:text-ink"
    >
      <span className="text-ink-mute transition-colors [&>svg]:h-[15px] [&>svg]:w-[15px]">
        {icon}
      </span>
      {children}
    </a>
  );
}

export default function Nav() {
  const t = useTranslations("nav");
  const sub = t("wordmarkSub");
  return (
    <nav className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md supports-[backdrop-filter]:bg-bg/65">
      <div className="mx-auto flex h-[60px] max-w-[1080px] items-center justify-between px-6">
        <a href="#" className="group flex items-center gap-2.5">
          <LogoMark />
          <span className="text-base font-semibold tracking-wide">
            {t("wordmark")}
            {sub ? (
              <span className="ml-2 font-mono text-[11px] font-normal tracking-widest text-ink-mute">
                {sub}
              </span>
            ) : null}
          </span>
        </a>
        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1 md:flex">
            <NavLink href="#law" icon={<BookIcon />}>
              {t("law")}
            </NavLink>
            <NavLink href="#funnel" icon={<FunnelIcon />}>
              {t("funnel")}
            </NavLink>
            <NavLink href="#faq" icon={<HelpIcon />}>
              {t("faq")}
            </NavLink>
          </div>
          <a
            href="#tool"
            onClick={() => {
              // 已有报告时通知 Detector 重置回空白检测框（见 Detector 的监听）
              window.dispatchEvent(new CustomEvent("labelcheck:reset"));
            }}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-[13.5px] font-medium text-bg shadow-[0_1px_2px_rgba(8,45,79,0.35)] transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(8,45,79,0.3)] [&>svg]:h-[15px] [&>svg]:w-[15px]"
          >
            <ScanIcon />
            {t("start")}
          </a>
          <LanguageSwitcher />
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-border-strong to-transparent" />
    </nav>
  );
}
