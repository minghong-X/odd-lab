import { cache } from "react";
import { getArtifacts } from "./catalog";
import { javaArena, javaOrigin } from "@/lib/java-arena";

// Share the gallery read between a page and its experiment cards during server rendering.
export const getServerArtifacts = cache(async (experiment: string) => {
  const origin = javaOrigin();
  return origin
    ? javaArena(origin).artifacts(experiment)
    : getArtifacts(experiment);
});
