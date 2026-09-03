import { useTranslations } from "next-intl";

/** 法规要求 + 标识丢失环节，两个静态信息区块 */
export default function InfoSections() {
  const t = useTranslations("law");
  const tf = useTranslations("funnel");
  const lawItems = [
    "explicit",
    "implicit",
    "distribution",
    "overseas",
  ] as const;
  const steps = ["s1", "s2", "s3", "s4"] as const;

  return (
    <section
      id="law"
      className="mx-auto max-w-[1080px] scroll-mt-20 px-6 pt-[72px] pb-5"
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-14">
        <div>
          <h2 className="mb-4 text-2xl font-semibold leading-snug tracking-tight">
            {t("title")}
          </h2>
          <div className="text-[14.5px] text-ink-soft">
            <p>{t.rich("p1", { b: (chunks) => <b>{chunks}</b> })}</p>
            <p className="mt-3">{t("p2")}</p>
          </div>
          <div className="mt-7 font-mono text-[11px] uppercase tracking-[0.13em] text-ink-mute">
            {t("listLabel")}
          </div>
          <ul className="mt-1 list-none">
            {lawItems.map((key) => (
              <li
                key={key}
                className="flex items-baseline gap-3.5 border-b border-border py-3.5 last:border-b-0"
              >
                <span className="w-24 flex-none font-mono text-[11px] text-ink-mute">
                  {t(`items.${key}.tag`)}
                </span>
                <div>
                  <b className="text-sm font-semibold">
                    {t(`items.${key}.title`)}
                  </b>
                  <span className="mt-0.5 block text-[13px] text-ink-soft">
                    {t(`items.${key}.desc`)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div id="funnel" className="scroll-mt-20">
          <h2 className="mb-4 text-2xl font-semibold leading-snug tracking-tight">
            {tf("title")}
          </h2>
          <div className="text-[14.5px] text-ink-soft">
            <p>{tf("lede")}</p>
          </div>
          <div className="mt-2">
            {steps.map((key, i) => (
              <div
                key={key}
                className="grid grid-cols-[34px_1fr] gap-4 border-b border-border py-4 last:border-b-0"
              >
                <span className="pt-0.5 font-mono text-xs text-ink-mute">
                  0{i + 1}
                </span>
                <div>
                  <b className="text-[14.5px] font-semibold">
                    {tf(`steps.${key}.title`)}
                  </b>
                  <p className="mt-1 text-[13.5px] text-ink-soft">
                    {tf(`steps.${key}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
