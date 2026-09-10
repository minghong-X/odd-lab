import { readFile } from "node:fs/promises";
import { Pool } from "pg";
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL before running production migrations.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
try {
  await pool.query(await readFile("src/db/migration.sql", "utf8"));
  console.log("Database schema is ready.");
} finally {
  await pool.end();
}
