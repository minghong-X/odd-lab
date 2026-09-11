import type { Translate } from "@/i18n";
import catalog from "../../data/catalog.json";

export type Artifact = {
  id: string;
  model: string;
  title: string;
  experiment: string;
  file: string;
  animatedFile?: string;
  width: number;
  height: number;
  generationTimeMs: number | null;
  tokenUsage: number | null;
};
export const artifacts: Artifact[] = catalog;
export const experiments = [
  {
    slug: "pelican",
    color: "#c8dfed",
    number: "01",
    available: true,
  },
  {
    slug: "crocodile",
    color: "#d4e5cf",
    number: "02",
    available: true,
  },
  {
    slug: "starship",
    color: "#e7dacc",
    number: "03",
    available: false,
  },
] as const;
export function getExperiment(slug: string) {
  return experiments.find((e) => e.slug === slug);
}
export function getArtifacts(slug: string) {
  return artifacts.filter((a) => a.experiment === slug);
}

export function localizeExperiment(
  e: (typeof experiments)[number],
  t: Translate,
) {
  return {
    ...e,
    title: t(`experiments.${e.slug}Title`),
    kicker: t(`experiments.${e.slug}Kicker`),
    subtitle: t(`experiments.${e.slug}Subtitle`),
    tag: t(`experiments.${e.slug}Tag`),
    criteria: t(`experiments.${e.slug}Criteria`),
    note: t(`experiments.${e.slug}Note`),
  };
}

// Bound the animated wall to its 6 × 5 grid; interleave experiments so new
// submissions remain visible instead of falling into rows below the viewport.
export function getPhotoWall(limit = 30) {
  const groups = experiments.map((e) => getArtifacts(e.slug));
  const pictures: Artifact[] = [];
  for (
    let row = 0;
    pictures.length < limit && groups.some((g) => row < g.length);
    row++
  ) {
    for (const group of groups) {
      if (group[row] && pictures.length < limit) pictures.push(group[row]);
    }
  }
  return pictures;
}
