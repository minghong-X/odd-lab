"use client";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Starship } from "./art";
import { BoardingScene } from "./boarding-scene";
import { useI18n } from "@/i18n/provider";

export function Story({ pictures }: { pictures: { id: string }[] }) {
  const { t } = useI18n();
  const chapters = (["road", "ship", "board", "launch"] as const).map(
    (key, i) => ({
      small: t(`story.${key}Kicker`),
      title: t(`story.${key}Title`),
      text: t(`story.${key}Text`),
      label: t(`story.${key}Link`),
      link:
        i === 0
          ? "/experiments/pelican"
          : i === 1
            ? "/experiments/starship"
            : "/arena/pelican",
    }),
  );
  const intro = useRef<gsap.core.Timeline | null>(null);
  const pictureKey = pictures.map((p) => p.id).join(",");
  const root = useRef<HTMLDivElement>(null),
    [chapter, setChapter] = useState(0),
    [motion, setMotion] = useState(true);
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
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add(
      {
        wide: "(min-width: 701px) and (prefers-reduced-motion: no-preference)",
        narrow:
          "(max-width: 700px) and (prefers-reduced-motion: no-preference)",
      },
      () => {
        setMotion(true);
        const context = gsap.context(() => {
          const mobile = window.matchMedia("(max-width: 700px)").matches;
          gsap.to(".photo-cloud", {
            y: -90,
            scale: 0.84,
            opacity: 0.15,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero",
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: ".journey",
              start: "top top",
              end: "bottom bottom",
              scrub: 0.7,
              onUpdate: (self) =>
                setChapter(
                  self.progress < 0.22
                    ? 0
                    : self.progress < 0.51
                      ? 1
                      : self.progress < 0.66
                        ? 2
                        : 3,
                ),
            },
          });
          // Native SVG transforms preserve a stable drawing origin at every viewport size.
          const pelicanStart = mobile
            ? "translate(400 430) scale(.48)"
            : "translate(90 370) scale(.65)";
          const crocStart = mobile
            ? "translate(705 443) scale(.48)"
            : "translate(620 390) scale(.65)";
          const bird = ".traveler-pelican,.pelican-seat",
            croc = ".traveler-crocodile,.crocodile-seat";
          timeline
            .fromTo(
              bird,
              { attr: { transform: "translate(-600 370) scale(.65)" } },
              {
                attr: { transform: pelicanStart },
                duration: 1,
                ease: "power2.out",
              },
              0.2,
            )
            .fromTo(
              croc,
              { attr: { transform: "translate(-900 390) scale(.65)" } },
              {
                attr: { transform: crocStart },
                duration: 1.2,
                ease: "power2.out",
              },
              0,
            )
            .to(
              ".bike-wheel,.moto-wheel",
              {
                attr: {
                  transform: (_: number, target: SVGElement) =>
                    `rotate(540 ${target.dataset.cx} ${target.dataset.cy})`,
                },
                duration: 1.3,
                ease: "none",
              },
              0,
            )
            .to(
              bird,
              {
                attr: { transform: "translate(310 507) scale(.38)" },
                duration: 1,
                ease: "power2.inOut",
              },
              1.45,
            )
            .to(
              croc,
              {
                attr: { transform: "translate(525 514) scale(.38)" },
                duration: 1,
                ease: "power2.inOut",
              },
              1.45,
            )
            .fromTo(
              ".launch-rig",
              { opacity: 0, attr: { transform: "translate(180 140)" } },
              {
                opacity: 1,
                attr: { transform: "translate(0 0)" },
                duration: 1.1,
              },
              1.4,
            )
            .to(
              ".launch-rig .engine-cutaway",
              { opacity: 1, duration: 0.35 },
              2.4,
            )
            .to(
              ".launch-rig .engine-cutaway",
              { opacity: 0, duration: 0.35 },
              3.05,
            )
            .to(
              ".launch-rig .hatch-door",
              { attr: { width: 0 }, duration: 0.45, ease: "power2.inOut" },
              3.2,
            )
            // A brief dissolve cuts from the parked riders to the cabin; no crossing paths.
            .to(
              ".ground-passengers",
              { opacity: 0, duration: 0.25, ease: "sine.inOut" },
              3.5,
            )
            .to(
              ".launch-rig .ship-passengers",
              { opacity: 1, duration: 0.25 },
              3.75,
            )
            .to(
              ".launch-rig .hatch-door",
              { attr: { width: 90 }, duration: 0.35, ease: "power2.inOut" },
              4.05,
            )
            .to(".launch-rig .ship-flame", { opacity: 1, duration: 0.3 }, 4.5)
            .to(
              ".journey-sky",
              { backgroundColor: "#172e48", duration: 1 },
              4.5,
            )
            .to(
              ".journey-road,.ground-vehicles",
              { y: 350, opacity: 0, duration: 1 },
              4.7,
            )
            .to(".journey-stars", { opacity: 1, duration: 1 }, 4.5)
            .to(
              ".launch-rig",
              {
                attr: { transform: "translate(0 -950)" },
                duration: 1.5,
                ease: "power2.in",
              },
              5,
            )
            .to({}, { duration: 0.3 });
        }, root);
        return () => context.revert();
      },
    );
    mm.add("(prefers-reduced-motion: reduce)", () => {
      setMotion(false);
      const context = gsap.context(() => {
        const mobile = window.matchMedia("(max-width:700px)").matches;
        gsap.set(".traveler-pelican,.pelican-seat", {
          attr: {
            transform: mobile
              ? "translate(400 430) scale(.48)"
              : "translate(90 370) scale(.65)",
          },
        });
        gsap.set(".traveler-crocodile,.crocodile-seat", {
          attr: {
            transform: mobile
              ? "translate(705 443) scale(.48)"
              : "translate(620 390) scale(.65)",
          },
        });
      }, root);
      return () => context.revert();
    });
    return () => mm.revert();
  }, []);
  return (
    <div ref={root} className={!motion ? "story reduced" : "story"}>
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
                  rotate: `${[-3, 2, -1, 3, -2, 1][i % 6]}deg`,
                } as CSSProperties
              }
            >
              <picture>
                <source
                  media="(prefers-reduced-motion: reduce)"
                  srcSet={`/api/media?id=${p.id}`}
                />
                <img
                  src={`/api/media?id=${p.id}&motion=1`}
                  alt=""
                  width="220"
                  height="170"
                  loading="eager"
                  decoding="async"
                />
              </picture>
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
        </div>
        <a href="#journey" className="scroll-invite">
          <span className="scroll-track">
            <i />
          </span>
          {t("story.scrollInvite")}
        </a>
        {motion && (
          <button
            className="replay-intro"
            onClick={() => intro.current?.restart()}
          >
            <span aria-hidden>↻</span> {t("story.replay")}
          </button>
        )}
        <span className="hero-note">{t("story.heroNote")}</span>
      </section>
      <section
        className="journey"
        id="journey"
        aria-label={t("story.journeyLabel")}
      >
        <div className="journey-stage">
          <div className="journey-sky" />
          <div className="journey-stars" aria-hidden />
          <div className="journey-road" aria-hidden>
            <div />
          </div>
          <div className={`journey-caption chapter-${chapter}`}>
            <span className="eyebrow">{chapters[chapter].small}</span>
            <h2>{chapters[chapter].title}</h2>
            <p>{chapters[chapter].text}</p>
            <Link className="text-link" href={chapters[chapter].link}>
              {chapters[chapter].label} ↗
            </Link>
          </div>
          <BoardingScene />
          <div
            className="journey-progress"
            aria-label={t("story.progressLabel", {
              current: chapter + 1,
              total: 4,
            })}
          >
            {[
              t("story.phaseRoad"),
              t("story.phaseShip"),
              t("story.phaseBoard"),
              t("story.phaseLaunch"),
            ].map((s, i) => (
              <span key={s} className={chapter === i ? "active" : ""}>
                <i />
                {s}
              </span>
            ))}
          </div>
          <a className="skip-story" href="#experiments">
            {t("story.skip")} ↗
          </a>
        </div>
      </section>
      <section className="mars-finale">
        <div className="mars-image" />
        <div className="mars-copy">
          <span className="eyebrow">{t("story.finalKicker")}</span>
          <h2>
            {t("story.finalTitle1")}
            <br />
            {t("story.finalTitle2")}
          </h2>
          <p>{t("story.finalText")}</p>
          <Link className="button light" href="/arena/pelican">
            {t("story.finalVote")}
            <span>↗</span>
          </Link>
        </div>
        <div className="mars-ship">
          <Starship />
        </div>
        <span className="mars-coordinate">{t("story.destination")}</span>
      </section>
    </div>
  );
}
