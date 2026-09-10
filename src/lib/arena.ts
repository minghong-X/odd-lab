import type { ErrorCode } from "@/i18n";
import {
  createHash,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "../db";
import {
  battles,
  votes,
  ratings,
  ratingEvents,
  rateLimits,
} from "../db/schema";
import type { Artifact } from "./catalog";

export type Choice = "left" | "right" | "draw" | "neither";
export class ArenaError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
  ) {
    super(code);
  }
}
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function elo(a: number, b: number, result: number) {
  const delta = 32 * (result - 1 / (1 + 10 ** ((b - a) / 400)));
  return [a + delta, b - delta] as const;
}
export function arenaService(db: Database, catalog: Artifact[]) {
  if (new Set(catalog.map((a) => a.id)).size !== catalog.length)
    throw new Error("Artifact IDs must be unique per model run.");
  const artifact = (id: string) => catalog.find((a) => a.id === id);
  async function seed(experiment: string) {
    const list = catalog.filter((a) => a.experiment === experiment);
    if (list.length)
      await db
        .insert(ratings)
        .values(list.map((a) => ({ artifactId: a.id, experiment })))
        .onConflictDoNothing();
    return list;
  }
  async function verify(id: string, token: string) {
    const [battle] = await db.select().from(battles).where(eq(battles.id, id));
    if (
      !battle ||
      !token ||
      !timingSafeEqual(
        Buffer.from(hashToken(token), "hex"),
        Buffer.from(battle.tokenHash, "hex"),
      )
    )
      throw new ArenaError(403, "invalidBattle");
    return battle;
  }
  return {
    async create(experiment: string) {
      const list = await seed(experiment);
      if (list.length < 2) throw new ArenaError(409, "preparing");
      const scores = await db
        .select()
        .from(ratings)
        .where(eq(ratings.experiment, experiment));
      // Mix fresh/underexposed entries with random exploration. Never favor a model name.
      const shuffled = [...list];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      if (randomInt(100) < 60)
        shuffled.sort(
          (a, b) =>
            (scores.find((r) => r.artifactId === a.id)?.matches ?? 0) -
            (scores.find((r) => r.artifactId === b.id)?.matches ?? 0),
        );
      const first = shuffled[0];
      const opponents = shuffled.filter((a) => a.model !== first.model);
      if (!opponents.length) throw new ArenaError(409, "notEnoughModels");
      const second = opponents[randomInt(opponents.length)];
      const [left, right] = randomInt(2) ? [first, second] : [second, first];
      const id = randomUUID(),
        token = randomBytes(32).toString("base64url");
      await db.insert(battles).values({
        id,
        tokenHash: hashToken(token),
        experiment,
        leftId: left.id,
        rightId: right.id,
        expiresAt: new Date(Date.now() + 15 * 60_000),
      });
      // Deliberately no artifact ID, model, filename, score or generation metadata.
      return {
        id,
        token,
        expiresIn: 900,
        left: { label: "A" },
        right: { label: "B" },
      };
    },
    async media(id: string, token: string, side: string) {
      const battle = await verify(id, token);
      if (!["A", "B"].includes(side)) throw new ArenaError(400, "invalidSide");
      if (battle.expiresAt.getTime() < Date.now())
        throw new ArenaError(410, "expired");
      const item = artifact(side === "A" ? battle.leftId : battle.rightId);
      if (!item) throw new ArenaError(404, "artUnavailable");
      return item;
    },
    async vote(id: string, token: string, choice: Choice) {
      await verify(id, token);
      return db.transaction(async (tx) => {
        const [battle] = await tx
          .select()
          .from(battles)
          .where(eq(battles.id, id))
          .for("update");
        const [existing] = await tx
          .select()
          .from(votes)
          .where(eq(votes.battleId, id));
        if (existing && existing.choice !== choice)
          throw new ArenaError(409, "alreadyVoted");
        const left = artifact(battle.leftId),
          right = artifact(battle.rightId);
        if (
          !left ||
          !right ||
          left.experiment !== battle.experiment ||
          right.experiment !== battle.experiment
        )
          throw new ArenaError(409, "pairUnavailable");
        if (!existing) {
          if (battle.expiresAt.getTime() < Date.now())
            throw new ArenaError(410, "expired");
          const voteId = randomUUID();
          await tx.insert(votes).values({ id: voteId, battleId: id, choice });
          // Stable lock order prevents A/B versus B/A transactions deadlocking.
          const rows = await tx
            .select()
            .from(ratings)
            .where(inArray(ratings.artifactId, [left.id, right.id]))
            .orderBy(ratings.artifactId)
            .for("update");
          const a = rows.find((r) => r.artifactId === left.id)!,
            b = rows.find((r) => r.artifactId === right.id)!;
          const [scoreA, scoreB] =
            choice === "neither"
              ? [a.score, b.score]
              : elo(
                  a.score,
                  b.score,
                  choice === "left" ? 1 : choice === "right" ? 0 : 0.5,
                );
          for (const [row, score, side] of [
            [a, scoreA, "left"],
            [b, scoreB, "right"],
          ] as const) {
            await tx
              .update(ratings)
              .set({
                score,
                matches: row.matches + (choice === "neither" ? 0 : 1),
                wins: row.wins + (choice === side ? 1 : 0),
                draws: row.draws + (choice === "draw" ? 1 : 0),
                rejected: row.rejected + (choice === "neither" ? 1 : 0),
              })
              .where(eq(ratings.artifactId, row.artifactId));
            await tx.insert(ratingEvents).values({
              id: randomUUID(),
              voteId,
              artifactId: row.artifactId,
              before: row.score,
              after: score,
            });
          }
        }
        return {
          choice,
          repeated: !!existing,
          left: {
            model: left.model,
            title: left.title,
            generationTimeMs: left.generationTimeMs,
            tokenUsage: left.tokenUsage,
          },
          right: {
            model: right.model,
            title: right.title,
            generationTimeMs: right.generationTimeMs,
            tokenUsage: right.tokenUsage,
          },
        };
      });
    },
    async leaderboard(experiment: string) {
      const list = await seed(experiment);
      const rows = await db
        .select()
        .from(ratings)
        .where(eq(ratings.experiment, experiment));
      const result = list
        .map((a) => ({
          ...a,
          ...(rows.find((r) => r.artifactId === a.id) ?? {
            score: 1500,
            matches: 0,
            wins: 0,
            draws: 0,
            rejected: 0,
          }),
        }))
        .sort(
          (a, b) =>
            b.score - a.score ||
            b.matches - a.matches ||
            a.model.localeCompare(b.model),
        );
      const count = list.length
        ? await db
            .select({ total: sql<number>`count(*)::int` })
            .from(votes)
            .innerJoin(battles, eq(votes.battleId, battles.id))
            .where(
              and(
                eq(battles.experiment, experiment),
                inArray(
                  battles.leftId,
                  list.map((a) => a.id),
                ),
                inArray(
                  battles.rightId,
                  list.map((a) => a.id),
                ),
              ),
            )
        : [];
      return {
        entries: result,
        totalVotes: count[0]?.total ?? 0,
        algorithm: "elo-1500-k32-v1",
      };
    },
    async limit(key: string, maximum: number) {
      const now = Date.now(),
        bucket = Math.floor(now / 60_000);
      const [row] = await db
        .insert(rateLimits)
        .values({
          key: `${key}:${bucket}`,
          count: 1,
          expiresAt: new Date(now + 120_000),
        })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: { count: sql`${rateLimits.count} + 1` },
        })
        .returning();
      // Bounded retention, shared across server instances; no user tracking table.
      await db.delete(rateLimits).where(sql`${rateLimits.expiresAt} < now()`);
      if (row.count > maximum) throw new ArenaError(429, "rateLimited");
    },
  };
}
