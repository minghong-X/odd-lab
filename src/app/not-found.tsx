import { getServerI18n } from "@/i18n/server";
import Link from "next/link";
export default async function NotFound() {
  const { t } = await getServerI18n();
  return (
    <main id="main" className="page-shell empty-state">
      <span className="eyebrow">404</span>
      <h1>{t("common.notFound")}</h1>
      <Link className="button primary" href="/experiments">
        {t("common.backExperiments")} ↗
      </Link>
    </main>
  );
}
