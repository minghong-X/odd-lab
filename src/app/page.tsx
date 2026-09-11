import { getServerI18n } from "@/i18n/server";
import { Story } from "@/components/story";
import { ExperimentCards } from "@/components/experiment-cards";
import { getPhotoWall } from "@/lib/catalog";
export default async function Home() {
  const { t } = await getServerI18n();
  return (
    <main id="main">
      <Story pictures={getPhotoWall().map((a) => ({ id: a.id }))} />
      <section className="experiments-section" id="experiments">
        <div className="section-intro">
          <div>
            <span className="eyebrow">{t("story.nextKicker")}</span>
            <h2>{t("story.nextTitle")}</h2>
          </div>
          <p>
            {t("story.nextText1")}
            <br />
            {t("story.nextText2")}
          </p>
        </div>
        <ExperimentCards />
      </section>
    </main>
  );
}
