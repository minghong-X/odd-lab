import { getServerI18n } from "@/i18n/server";
import Link from "next/link";
import { getServerArtifacts } from "@/lib/server-artifacts";
import { localizeExperiment, experiments } from "@/lib/catalog";
import { TaobaoArt } from "./taobao-art";
import { Pelican, Crocodile } from "./art";
export async function ExperimentCards() {
  const { t } = await getServerI18n();
  const counts = await Promise.all(
    experiments.map(async (e) => (await getServerArtifacts(e.slug)).length),
  );
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
              {i === 0 ? <Pelican /> : i === 1 ? <Crocodile /> : <TaobaoArt />}
              <span className="round-arrow" aria-hidden>
                ↗
              </span>
            </div>
            <div className="experiment-copy">
              <span>
                {e.tag} <b>·</b>{" "}
                {counts[i]
                  ? t("experiments.modelCount", {
                      count: counts[i],
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
