import { useTranslations } from "next-intl";
import IcpRecord from "./IcpRecord";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto flex max-w-[1080px] flex-wrap justify-between gap-5 px-6 py-8 text-[12.5px] text-ink-mute">
        <div>
          {t("company")} · {t("disclaimer")}
        </div>
        <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] tracking-widest">
          <IcpRecord />
          <span>{t("meta")}</span>
        </div>
      </div>
    </footer>
  );
}
