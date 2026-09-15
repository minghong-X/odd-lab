import { getServerI18n } from "@/i18n/server";
import Link from "next/link";
import { appPath } from "@/lib/paths";
import { notFound } from "next/navigation";
import { getServerArtifacts } from "@/lib/server-artifacts";
import { localizeExperiment, getExperiment } from "@/lib/catalog";
import { ArtworkMedia } from "@/components/artwork-media";
import { ArtworkPreview } from "@/components/artwork-preview";
import { TaobaoArt } from "@/components/taobao-art";
import { Pelican, Crocodile } from "@/components/art";
export default async function ExperimentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { t, locale } = await getServerI18n();
  const { slug } = await params,
    record = getExperiment(slug);
  if (!record) notFound();
  const experiment = localizeExperiment(record, t);
  const list = await getServerArtifacts(slug);
  return (
    <main id="main" className="page-shell">
      <Link className="back-link" href="/experiments">
        ← {t("common.allExperiments")}
      </Link>
      <div className="experiment-heading">
        <div>
          <span className="eyebrow">{experiment.kicker}</span>
          <h1>{experiment.title}</h1>
          <p>{experiment.subtitle}</p>
          <div className="hero-actions">
            {list.length > 1 ? (
              <>
                <Link className="button primary" href={`/arena/${slug}`}>
                  {t("common.enterArena")} ↗
                </Link>
                <Link className="text-link" href={`/leaderboard/${slug}`}>
                  {t("common.viewLeaderboard")}
                </Link>
              </>
            ) : (
              <span className="status-pill">{t("common.preparing")}</span>
            )}
          </div>
        </div>
        <div className={`heading-art ${slug}`}>
          {slug === "pelican" ? (
            <Pelican />
          ) : slug === "crocodile" ? (
            <Crocodile />
          ) : (
            <TaobaoArt />
          )}
        </div>
      </div>
      <div className="experiment-protocol">
        <h2>{t("experiments.criteriaTitle")}</h2>
        <p>{experiment.criteria}</p>
        <small>{experiment.note}</small>
      </div>
      {list.length ? (
        <>
          <div className="gallery-heading">
            <h2>{t("experiments.galleryTitle")}</h2>
            <span>{t("experiments.artCount", { count: list.length })}</span>
          </div>
          <div className="art-gallery">
            {list.map((a) => (
              <article key={a.id}>
                {a.mediaType === "html" && a.mediaUrl ? (
                  <ArtworkPreview
                    src={a.mediaUrl}
                    label={a.title}
                    mediaType="html"
                  />
                ) : (
                  <a
                    href={
                      a.mediaUrl || appPath(`/api/media?id=${a.id}&motion=1`)
                    }
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t("experiments.enlargeModel", {
                      model: a.title,
                    })}
                  >
                    {a.mediaUrl ? (
                      <ArtworkMedia
                        src={a.mediaUrl}
                        mediaType={a.mediaType}
                        alt={a.title}
                      />
                    ) : (
                      <picture>
                        <source
                          media="(prefers-reduced-motion: reduce)"
                          srcSet={
                            a.mediaUrl || appPath(`/api/media?id=${a.id}`)
                          }
                        />
                        <img
                          src={
                            a.mediaUrl ||
                            appPath(`/api/media?id=${a.id}&motion=1`)
                          }
                          alt={t("experiments.artAlt", {
                            model: a.title,
                            experiment: experiment.title,
                          })}
                          width={a.width}
                          height={a.height}
                          loading="lazy"
                        />
                      </picture>
                    )}
                  </a>
                )}
                <div>
                  <h3>{a.title}</h3>
                  <span>
                    {a.generationTimeMs
                      ? t("experiments.duration", {
                          seconds: new Intl.NumberFormat(
                            locale === "zh" ? "zh-CN" : "en-US",
                            {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            },
                          ).format(a.generationTimeMs / 1000),
                        })
                      : t("experiments.durationUnknown")}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <h2>{t("experiments.emptyTitle")}</h2>
          <p>{t("experiments.emptyText")}</p>
          <Link className="button primary" href="/arena/pelican">
            {t("common.pelicanArena")} ↗
          </Link>
        </div>
      )}
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { t } = await getServerI18n();
  const e = getExperiment((await params).slug);
  return { title: e ? localizeExperiment(e, t).title : t("common.notFound") };
}
