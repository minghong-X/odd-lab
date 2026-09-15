import "server-only";
import type { Artifact } from "./catalog";

// The public distribution has no private storage transport or configuration.
type DisabledAdapter = {
  artifacts(experiment: string): Promise<Artifact[]>;
  vote(leftId: string, rightId: string, choice: string): Promise<never>;
  leaderboard(experiment: string): Promise<never>;
};
export function javaOrigin(): null {
  return null;
}
export function javaArena(_origin: string): DisabledAdapter {
  throw new Error("Internal storage is unavailable in public builds.");
}
