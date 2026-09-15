import type { Translate } from "@/i18n";
import catalog from "../../data/catalog.json";

export type Artifact = {
  id: string;
  model: string;
  title: string;
  experiment: string;
  file: string;
  mediaUrl?: string;
  mediaType?: "svg" | "png" | "gif" | "html" | "mp4" | "image" | "video";
  animatedFile?: string;
  width: number;
  height: number;
  generationTimeMs: number | null;
  tokenUsage: number | null;
};
export const artifacts = catalog as Artifact[];
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
    slug: "taobao",
    color: "#e7dacc",
    number: "03",
    available: true,
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

// Sample all experiments, then mix the 6-column desktop and 5-column mobile wall.
// Called on the server: one order is sent to the client, avoiding hydration changes.
export function getPhotoWall(
  limit = 30,
  list: Artifact[] = artifacts,
  random = Math.random,
) {
  const shuffle = <T>(items: T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  const groups = experiments.map((e) =>
    shuffle(list.filter((a) => a.experiment === e.slug)),
  );
  const sample: Artifact[] = [];
  for (
    let row = 0;
    sample.length < limit && groups.some((g) => row < g.length);
    row++
  ) {
    for (const group of groups) {
      if (group[row] && sample.length < limit) sample.push(group[row]);
    }
  }
  const remaining = shuffle(sample),
    pictures: Artifact[] = [];
  while (remaining.length) {
    const i = pictures.length;
    const candidate = remaining.findIndex(
      (a) =>
        a.experiment !== pictures[i - 6]?.experiment &&
        a.experiment !== pictures[i - 5]?.experiment,
    );
    pictures.push(remaining.splice(Math.max(candidate, 0), 1)[0]);
  }
  return pictures;
}
