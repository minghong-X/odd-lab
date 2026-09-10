import { getServerI18n } from "@/i18n/server";
import Link from "next/link";
import { localizeExperiment, experiments, getArtifacts } from "@/lib/catalog";
import { Pelican, Crocodile, Starship } from "./art";
export async function ExperimentCards() {
  const { t } = await getServerI18n();
  return (
    <div className="experiment-grid">
      {experiments
        .map((e) => localizeExperiment(e, t))
        .map((e, i) => (
          <Link
            href={`/experiments/${e.slug}`}
            className={`experiment-card experiment-${e.slug}`}
            key={e.slug}
          >
            <div
              className="experiment-art"
              style={{ backgroundColor: e.color }}
            >
              <span className="experiment-number">{e.number}</span>
              {i === 0 ? (
                <Pelican />
              ) : i === 1 ? (
                <Crocodile />
              ) : (
                <Starship cutaway />
              )}
              <span className="round-arrow" aria-hidden>
                ↗
              </span>
            </div>
            <div className="experiment-copy">
              <span>
                {e.tag} <b>·</b>{" "}
                {getArtifacts(e.slug).length
                  ? t("experiments.modelCount", {
                      count: getArtifacts(e.slug).length,
                    })
                  : t("common.preparing")}
              </span>
              <h3>{e.title}</h3>
              <p>{e.subtitle}</p>
            </div>
          </Link>
        ))}
    </div>
  );
}
