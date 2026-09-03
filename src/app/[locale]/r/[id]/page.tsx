import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getSql } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import ReportView from "@/components/ReportView";
import type { StoredReport } from "@/lib/detect/types";

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const sql = getSql();
  if (!sql || !/^[a-z0-9]{12}$/.test(id)) notFound();
  const rows = await sql`SELECT payload FROM reports WHERE id = ${id}`;
  if (rows.length === 0) notFound();

  return <SharedReportBody report={rows[0].payload as StoredReport} />;
}

function SharedReportBody({ report }: { report: StoredReport }) {
  const t = useTranslations("shared");
  return (
    <main id="main" className="mx-auto max-w-[1080px] px-6 pt-14 pb-10">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">
        {t("title")}
      </h1>
      <p className="mb-8 max-w-[640px] text-[13.5px] text-ink-mute">
        {t("note")}
      </p>
      <div className="overflow-hidden rounded-lg border border-border-strong bg-surface shadow-[0_14px_40px_-18px_rgba(8,45,79,0.18)]">
        <ReportView report={report}>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-block rounded-full bg-[#1c2b3a] px-[22px] py-2.5 text-[13.5px] font-medium text-white transition-colors hover:bg-ink"
            >
              {t("backHome")}
            </Link>
          </div>
        </ReportView>
      </div>
    </main>
  );
}
