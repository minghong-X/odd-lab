import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { arenaService, elo } from "../src/lib/arena";
import type { Artifact } from "../src/lib/catalog";

const client = new PGlite();
const db = drizzle(client, { schema });
const fixtures: Artifact[] = ["one", "two", "three"].map((id) => ({
  id,
  model: `model-${id}`,
  title: `Title ${id}`,
  experiment: "test",
  file: `${id}.webp`,
  width: 800,
  height: 600,
  generationTimeMs: null,
  tokenUsage: null,
}));
const arena = arenaService(db, fixtures);
beforeAll(async () => {
  await client.waitReady;
  await client.exec(await readFile("src/db/migration.sql", "utf8"));
});
afterAll(async () => {
  await client.close();
});
describe("anonymous Arena transactions", () => {
  it("sends no model identity in the blind pairing", async () => {
    const p = await arena.create("test");
    expect(Object.keys(p).sort()).toEqual([
      "expiresIn",
      "id",
      "left",
      "right",
      "token",
    ]);
    expect(p.left).toEqual({ label: "A" });
    expect(JSON.stringify(p)).not.toContain("model-");
  });
  it("counts simultaneous retries once and reveals the actual models", async () => {
    const p = await arena.create("test");
    const before = (await arena.leaderboard("test")).totalVotes;
    const results = await Promise.all(
      Array.from({ length: 6 }, () => arena.vote(p.id, p.token, "left")),
    );
    expect(results.filter((r) => !r.repeated)).toHaveLength(1);
    expect(results[0].left.model).not.toBe(results[0].right.model);
    expect((await arena.leaderboard("test")).totalVotes).toBe(before + 1);
    const events = await db.select().from(schema.ratingEvents);
    expect(events).toHaveLength(2);
    expect(events.reduce((s, e) => s + e.after - e.before, 0)).toBeCloseTo(0);
    await expect(arena.vote(p.id, p.token, "right")).rejects.toMatchObject({
      status: 409,
    });
  });
  it("rejects invalid tokens without changing the rankings", async () => {
    const p = await arena.create("test");
    const before = await arena.leaderboard("test");
    await expect(arena.vote(p.id, "invalid", "left")).rejects.toMatchObject({
      status: 403,
    });
    await expect(arena.media(p.id, "invalid", "A")).rejects.toMatchObject({
      status: 403,
    });
    expect(await arena.leaderboard("test")).toEqual(before);
  });
  it("rejects expired unvoted pairs but preserves successful retry receipts", async () => {
    const p = await arena.create("test");
    await db
      .update(schema.battles)
      .set({ expiresAt: new Date(0) })
      .where(eq(schema.battles.id, p.id));
    await expect(arena.vote(p.id, p.token, "draw")).rejects.toMatchObject({
      status: 410,
    });
    const valid = await arena.create("test");
    await arena.vote(valid.id, valid.token, "draw");
    await db
      .update(schema.battles)
      .set({ expiresAt: new Date(0) })
      .where(eq(schema.battles.id, valid.id));
    expect((await arena.vote(valid.id, valid.token, "draw")).repeated).toBe(
      true,
    );
  });
  it("records neither without changing Elo or competitive match counts", async () => {
    const p = await arena.create("test");
    const before = await arena.leaderboard("test");
    await arena.vote(p.id, p.token, "neither");
    const after = await arena.leaderboard("test");
    expect(after.totalVotes).toBe(before.totalVotes + 1);
    for (const a of after.entries) {
      const b = before.entries.find((e) => e.id === a.id)!;
      expect(a.score).toBe(b.score);
      expect(a.matches).toBe(b.matches);
    }
    expect(
      after.entries.reduce((s, e) => s + e.rejected, 0) -
        before.entries.reduce((s, e) => s + e.rejected, 0),
    ).toBe(2);
  });
  it("allows everyone to issue new pairs and conserves ratings under concurrent different votes", async () => {
    const before = await arena.leaderboard("test");
    const pairs = await Promise.all(
      Array.from({ length: 8 }, () => arena.create("test")),
    );
    await Promise.all(
      pairs.map((p, i) => arena.vote(p.id, p.token, i % 2 ? "right" : "left")),
    );
    const after = await arena.leaderboard("test");
    expect(after.totalVotes).toBe(before.totalVotes + 8);
    expect(
      after.entries.reduce((s, e) => s + e.matches, 0) -
        before.entries.reduce((s, e) => s + e.matches, 0),
    ).toBe(16);
    expect(after.entries.reduce((s, e) => s + e.score, 0)).toBeCloseTo(4500);
  });
  it("does not pair missing experiments and rate-limits repeated issuance", async () => {
    await expect(arena.create("missing")).rejects.toMatchObject({
      status: 409,
    });
    await arena.limit("test-key", 2);
    await arena.limit("test-key", 2);
    await expect(arena.limit("test-key", 2)).rejects.toMatchObject({
      status: 429,
    });
  });
  it("uses symmetric Elo updates for wins and draws", () => {
    expect(elo(1500, 1500, 1)).toEqual([1516, 1484]);
    expect(elo(1500, 1500, 0.5)).toEqual([1500, 1500]);
  });
  it("rejects catalog ID collisions but permits different runs sharing an image file", () => {
    expect(() =>
      arenaService(db, [fixtures[0], { ...fixtures[1], id: fixtures[0].id }]),
    ).toThrow("unique");
    expect(() =>
      arenaService(db, [
        fixtures[0],
        { ...fixtures[1], file: fixtures[0].file },
      ]),
    ).not.toThrow();
  });
});
