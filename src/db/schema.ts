import {
  pgTable,
  text,
  timestamp,
  integer,
  doublePrecision,
  uniqueIndex,
} from "drizzle-orm/pg-core";
export const battles = pgTable("battles", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull(),
  experiment: text("experiment").notNull(),
  leftId: text("left_id").notNull(),
  rightId: text("right_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const votes = pgTable(
  "votes",
  {
    id: text("id").primaryKey(),
    battleId: text("battle_id")
      .notNull()
      .references(() => battles.id),
    choice: text("choice").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("vote_battle_unique").on(table.battleId)],
);
export const ratings = pgTable("ratings", {
  artifactId: text("artifact_id").primaryKey(),
  experiment: text("experiment").notNull(),
  score: doublePrecision("score").notNull().default(1500),
  matches: integer("matches").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  rejected: integer("rejected").notNull().default(0),
});
export const ratingEvents = pgTable("rating_events", {
  id: text("id").primaryKey(),
  voteId: text("vote_id")
    .notNull()
    .references(() => votes.id),
  artifactId: text("artifact_id").notNull(),
  before: doublePrecision("before").notNull(),
  after: doublePrecision("after").notNull(),
  algorithm: text("algorithm").notNull().default("elo-1500-k32-v1"),
});
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
