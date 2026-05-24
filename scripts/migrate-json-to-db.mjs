import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

await loadDotEnvLocal();

const databaseUrl = process.env.DATABASE_URL;
const force = process.env.FORCE_DB_MIGRATION === "1";

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl:
    databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")
      ? undefined
      : { rejectUnauthorized: false },
});

const files = [
  ["x-post-candidates", "data/x-post-candidates.json", []],
  ["article-visibility", "data/article-visibility.json", { hiddenArticleIds: [] }],
  ["site-pages", "data/site-pages.json", {}],
];

await pool.query(`
  create table if not exists app_store (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
  )
`);

for (const [key, filePath, fallback] of files) {
  let value = fallback;

  try {
    const raw = await readFile(path.join(process.cwd(), filePath), "utf8");
    value = JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    // Missing files are fine; defaults are inserted so the DB has all keys.
  }

  if (!force) {
    const existing = await pool.query("select 1 from app_store where key = $1", [
      key,
    ]);

    if (existing.rowCount) {
      console.log(`kept existing ${key}`);
      continue;
    }
  }

  await pool.query(
    `
      insert into app_store (key, value, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (key)
      do update set value = excluded.value, updated_at = now()
    `,
    [key, JSON.stringify(value)],
  );
  console.log(`${force ? "overwrote" : "seeded"} ${key}`);
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
