import { getServerI18n, pageMetadata } from "@/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { localizeExperiment, experiments, getExperiment } from "@/lib/catalog";
import { Leaderboard } from "@/components/leaderboard";
export const generateMetadata = pageMetadata("rank.pageTitle");
export default async function RankingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { t } = await getServerI18n();
  const { slug } = await params,
    record = getExperiment(slug);
  if (!record) notFound();
  const e = localizeExperiment(record, t);
  return (
    <main id="main" className="page-shell">
      <div className="ranking-heading">
        <div>
          <span className="eyebrow">{t("rank.kicker")}</span>
          <h1>{t("rank.heading")}</h1>
          <p>{t("rank.description")}</p>
        </div>
        <Link className="button primary" href={`/arena/${slug}`}>
          {t("rank.vote")} ↗
        </Link>
      </div>
      <nav className="experiment-tabs" aria-label={t("rank.tabsLabel")}>
        {experiments
          .map((e) => localizeExperiment(e, t))
          .map((e) => (
            <Link
              key={e.slug}
              aria-current={e.slug === slug ? "page" : undefined}
              href={`/leaderboard/${e.slug}`}
            >
              {e.title}
            </Link>
          ))}
      </nav>
      <Leaderboard slug={slug} />
    </main>
  );
}
