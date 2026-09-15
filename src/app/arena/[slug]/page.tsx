import { getServerI18n, pageMetadata } from "@/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerArtifacts } from "@/lib/server-artifacts";
import { localizeExperiment, getExperiment } from "@/lib/catalog";
import { javaOrigin } from "@/lib/java-arena";
import { ArenaClient } from "@/components/arena-client";
export const generateMetadata = pageMetadata("arena.pageTitle");
export default async function ArenaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { t } = await getServerI18n();
  const { slug } = await params,
    record = getExperiment(slug);
  if (!record) notFound();
  const e = localizeExperiment(record, t);
  const artworks = await getServerArtifacts(slug);
  const internal = !!javaOrigin();
  return (
    <main
      id="main"
      className={`page-shell arena-page ${slug === "taobao" ? "taobao-arena" : ""}`}
    >
      <div className="arena-heading">
        <div>
          <Link className="back-link" href={`/experiments/${slug}`}>
            {e.title} ↗
          </Link>
          <h1>
            {t("arena.heading1")} <br className="mobile-only" />
            {t("arena.heading2")}
          </h1>
        </div>
        <Link className="text-link" href={`/leaderboard/${slug}`}>
          {t("common.leaderboard")} ↗
        </Link>
      </div>
      {artworks.length > 1 ? (
        <ArenaClient
          slug={slug}
          internalArtworks={
            internal
              ? artworks.map((a) => ({
                  id: a.id,
                  src: a.mediaUrl!,
                  mediaType: a.mediaType || "image",
                }))
              : undefined
          }
        />
      ) : (
        <div className="empty-state">
          <h2>{t("arena.emptyTitle")}</h2>
          <p>{t("arena.emptyText")}</p>
          <Link href="/arena/pelican" className="button primary">
            {t("common.pelicanArena")} ↗
          </Link>
        </div>
      )}
    </main>
  );
}
