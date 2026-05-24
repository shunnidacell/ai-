import pg from "pg";
import { readFile } from "node:fs/promises";

const { Pool } = pg;

await loadDotEnvLocal();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log("DATABASE_URL is not set. Data will reset on Render deploys.");
  process.exit(0);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl:
    databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")
      ? undefined
      : { rejectUnauthorized: false },
});

await pool.query(`
  create table if not exists app_store (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
  )
`);

const result = await pool.query(`
  select
    key,
    jsonb_typeof(value) as type,
    case
      when jsonb_typeof(value) = 'array' then jsonb_array_length(value)
      when jsonb_typeof(value) = 'object' then (
        select count(*) from jsonb_object_keys(value)
      )
      else null
    end as items,
    updated_at
  from app_store
  order by key
`);

if (result.rows.length === 0) {
  console.log("DATABASE_URL is set, but app_store is empty.");
} else {
  console.table(result.rows);
}

await pool.end();

async function loadDotEnvLocal() {
  let raw = "";

  try {
    raw = await readFile(".env.local", "utf8");
  } catch {
    return;
  }

  for (const line of raw.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex <= 0) continue;

    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed.slice(equalIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
