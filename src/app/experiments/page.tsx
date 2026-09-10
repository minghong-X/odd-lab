import { getServerI18n, pageMetadata } from "@/i18n/server";
import { ExperimentCards } from "@/components/experiment-cards";
export const generateMetadata = pageMetadata("experiments.pageTitle");
export default async function ExperimentsPage() {
  const { t } = await getServerI18n();
  return (
    <main id="main" className="page-shell">
      <div className="page-heading">
        <span className="eyebrow">{t("experiments.pageKicker")}</span>
        <h1>{t("experiments.pageTitle")}</h1>
        <p>{t("experiments.pageText")}</p>
      </div>
      <ExperimentCards />
    </main>
  );
}
