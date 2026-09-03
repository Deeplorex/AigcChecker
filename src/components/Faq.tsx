import { useTranslations } from "next-intl";

export default function Faq() {
  const t = useTranslations("faq");
  const items = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;
  return (
    <section
      id="faq"
      className="mx-auto max-w-[1080px] scroll-mt-20 px-6 pt-[72px] pb-5"
    >
      <h2 className="mb-2 text-2xl font-semibold tracking-tight">
        {t("title")}
      </h2>
      {items.map((key) => (
        <details key={key} className="group border-b border-border">
          <summary className="flex cursor-pointer list-none items-center justify-between px-1 py-[18px] text-[15px] font-medium underline-offset-[6px] decoration-border-strong hover:underline [&::-webkit-details-marker]:hidden">
            {t(`items.${key}.q`)}
            <span className="font-mono text-base text-ink-mute transition-transform duration-200 group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="px-1 pb-5 text-sm text-ink-soft">
            {t(`items.${key}.a`)}
          </div>
        </details>
      ))}
    </section>
  );
}
