// Applies SQL migrations in db/migrations in order, once each.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const client = new pg.Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false } });
await client.connect();
await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
const dir = path.resolve("db/migrations");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const { rows } = await client.query("SELECT name FROM schema_migrations");
const done = new Set(rows.map((r) => r.name));
for (const f of files) {
  if (done.has(f)) { console.log(`skip ${f}`); continue; }
  const sql = fs.readFileSync(path.join(dir, f), "utf8");
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations(name) VALUES ($1)", [f]);
    await client.query("COMMIT");
    console.log(`applied ${f}`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`failed ${f}:`, e.message);
    process.exit(1);
  }
}
await client.end();
