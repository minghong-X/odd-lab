"use client";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { appPath } from "@/lib/paths";
import gsap from "gsap";
import { ArtworkMedia, type MediaType } from "./artwork-media";
import { ArenaSelector } from "@/components/arena-selector";
import { useI18n } from "@/i18n/provider";

export function Story({
  pictures,
}: {
  pictures: { id: string; mediaUrl?: string; mediaType?: MediaType }[];
}) {
  const { t } = useI18n();
  const intro = useRef<gsap.core.Timeline | null>(null);
  const pictureKey = pictures.map((p) => p.id).join(",");
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const wall = root.current!.querySelector<HTMLElement>(".photo-cloud")!;
      const photos = gsap.utils.toArray<HTMLElement>(".flying-photo");
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const width = wall.offsetWidth,
          height = wall.offsetHeight;
        const radius = Math.hypot(width, height) + 300;
        const angles = [
          0,
          Math.PI,
          Math.PI / 2,
          -Math.PI / 2,
          Math.PI / 4,
          (3 * Math.PI) / 4,
          -Math.PI / 4,
          (-3 * Math.PI) / 4,
        ];
        const arrival = (i: number, photo: HTMLElement, axis: "x" | "y") =>
          axis === "x"
            ? width / 2 +
              Math.cos(angles[i % 8]) * radius -
              photo.offsetLeft -
              photo.offsetWidth / 2
            : height / 2 +
              Math.sin(angles[i % 8]) * radius -
              photo.offsetTop -
              photo.offsetHeight / 2;
        const timeline = gsap.timeline({
          onStart: () => {
            wall.dataset.introState = "flying";
            gsap.set(photos, { willChange: "transform,opacity" });
          },
          onComplete: () => {
            wall.dataset.introState = "settled";
            gsap.set(photos, { willChange: "auto" });
          },
        });
        intro.current = timeline;
        timeline
          .fromTo(
            photos,
            {
              x: (i, p) => arrival(i, p, "x"),
              y: (i, p) => arrival(i, p, "y"),
              z: (i) => (i % 3 === 0 ? 300 : -700),
              rotation: (i) => (i % 2 ? 1 : -1) * (35 + (i % 4) * 15),
              rotationX: (i) => (i % 2 ? 1 : -1) * 28,
              rotationY: (i) => ((i % 3) - 1) * 32,
              scale: 0.65,
              opacity: 0,
            },
            {
              x: 0,
              y: 0,
              z: 0,
              rotation: 0,
              rotationX: 0,
              rotationY: 0,
              scale: 1,
              opacity: 1,
              duration: 2.4,
              stagger: 0.035,
              ease: "power3.out",
            },
            0.15,
          )
          .fromTo(
            ".hero-copy",
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
            1.75,
          );
        return () => {
          timeline.kill();
          intro.current = null;
        };
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        wall.dataset.introState = "settled";
      });
    }, root);
    return () => context.revert();
  }, [pictureKey]);
  return (
    <div ref={root} className="story">
      <section className="hero">
        <div className="hero-orbit" aria-hidden />
        <div className="photo-cloud" data-intro-state="ready" aria-hidden>
          {pictures.map((p, i) => (
            <div
              className="flying-photo"
              key={p.id}
              style={
                {
                  "--column": i % 6,
                  "--row": Math.floor(i / 6),
                  "--mobile-column": i % 5,
                  "--mobile-row": Math.floor(i / 5),
                  rotate: `${[-1, 1, -0.5, 1, -1, 0.5][i % 6]}deg`,
                } as CSSProperties
              }
            >
              {p.mediaUrl &&
              ["html", "video", "mp4"].includes(p.mediaType || "") ? (
                <ArtworkMedia src={p.mediaUrl} mediaType={p.mediaType} alt="" />
              ) : (
                <picture>
                  <source
                    media="(prefers-reduced-motion: reduce)"
                    srcSet={p.mediaUrl || appPath(`/api/media?id=${p.id}`)}
                  />
                  <img
                    src={
                      p.mediaUrl || appPath(`/api/media?id=${p.id}&motion=1`)
                    }
                    alt=""
                    width="220"
                    height="170"
                    loading="eager"
                    decoding="async"
                  />
                </picture>
              )}
              <span>{t("story.photoCaption")}</span>
            </div>
          ))}
        </div>
        <div className="hero-copy">
          <span className="hero-label">
            <i />
            {t("story.heroLabel")}
          </span>
          <h1>
            {t("story.heroTitle1")}
            <br />
            <span>{t("story.heroTitle2")}</span>
          </h1>
          <p>
            {t("story.heroDescription1")}
            <br />
            {t("story.heroDescription2")}
          </p>
          <div className="hero-actions">
            <ArenaSelector />
            <Link href="/leaderboard/pelican" className="hero-leaderboard">
              {t("common.leaderboard")}
              <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>
        <button
          className="replay-intro"
          onClick={() => intro.current?.restart()}
        >
          <span aria-hidden>↻</span> {t("story.replay")}
        </button>
        <span className="hero-note">{t("story.heroNote")}</span>
      </section>
    </div>
  );
}
