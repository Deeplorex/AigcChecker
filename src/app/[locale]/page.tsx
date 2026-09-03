import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Detector from "@/components/Detector";
import InfoSections from "@/components/InfoSections";
import Faq from "@/components/Faq";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("hero");
  return (
    <>
      <header className="mx-auto max-w-[1080px] px-6 pt-[84px] pb-14">
        <div className="mb-4 flex items-center gap-2.5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-ink-mute before:block before:h-px before:w-[22px] before:bg-ink-mute">
          {t("kicker")}
        </div>
        <h1 className="max-w-[640px] text-[clamp(30px,4.6vw,46px)] font-semibold leading-[1.18] tracking-tight">
          {t("titleLine1")}
          <br />
          {t("titleLine2")}
        </h1>
        <p className="mt-5 max-w-[560px] text-[16.5px] text-ink-soft">
          {t("lede")}
        </p>
        <div className="mt-6 flex flex-wrap gap-5 font-mono text-[12.5px] text-ink-mute">
          <span>
            {t("metaLaw")}{" "}
            <b className="font-medium text-ink">{t("metaLawValue")}</b>
          </span>
          <span>
            {t("metaDims")}{" "}
            <b className="font-medium text-ink">{t("metaDimsValue")}</b>
          </span>
          <span>
            {t("metaData")}{" "}
            <b className="font-medium text-ink">{t("metaDataValue")}</b>
          </span>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-[1080px] px-6 pb-10">
        <div id="tool" className="scroll-mt-20">
          <Detector />
        </div>
      </main>

      <InfoSections />
      <Faq />
    </>
  );
}
