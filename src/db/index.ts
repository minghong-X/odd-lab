import { PGlite } from "@electric-sql/pglite";
import { drizzle as pgliteDrizzle } from "drizzle-orm/pglite";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = ReturnType<typeof pgliteDrizzle<typeof schema>>;
const globalDB = globalThis as unknown as { oddDB?: Promise<Database> };
export async function getDB(): Promise<Database> {
  if (!globalDB.oddDB)
    globalDB.oddDB = createDB().catch((error) => {
      globalDB.oddDB = undefined;
      throw error;
    });
  return globalDB.oddDB;
}
async function createDB(): Promise<Database> {
  if (process.env.DATABASE_URL) {
    // Both drivers implement the same Drizzle PostgreSQL query/transaction API.
    return pgDrizzle(
      new Pool({ connectionString: process.env.DATABASE_URL, max: 4 }),
      { schema },
    ) as unknown as Database;
  }
  if (process.env.VERCEL || process.env.NODE_ENV === "production")
    throw new Error(
      "DATABASE_URL is required in production. Run npm run db:migrate before deploying.",
    );
  const client = new PGlite(process.env.ODD_DB_PATH || ".local-db");
  await client.waitReady;
  const { readFile } = await import("node:fs/promises");
  await client.exec(await readFile("src/db/migration.sql", "utf8"));
  return pgliteDrizzle(client, { schema });
}
