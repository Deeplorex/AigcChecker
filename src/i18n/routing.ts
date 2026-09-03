import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["zh", "en"],
  defaultLocale: "zh",
  // zh 无前缀（/），en 带前缀（/en）
  localePrefix: "as-needed",
  // 按浏览器 Accept-Language 自动选择语言（默认即为 true，显式声明以备查）：
  // 英文访客访问 / 会被 307 到 /en；用户手动切换后写入 NEXT_LOCALE cookie，之后以 cookie 为准
  localeDetection: true,
});

export type Locale = (typeof routing.locales)[number];
