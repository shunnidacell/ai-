import { Pool } from "pg";

type JsonValue = unknown;

let pool: Pool | null = null;
let ready: Promise<void> | null = null;

function getDatabaseUrl() {
  return process.env.DATABASE_URL;
}

export function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

function getPool() {
  if (!pool) {
    const connectionString = getDatabaseUrl();

    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured.");
    }

    pool = new Pool({
      connectionString,
      ssl:
        connectionString.includes("localhost") ||
        connectionString.includes("127.0.0.1")
          ? undefined
          : { rejectUnauthorized: false },
    });
  }

  return pool;
}

async function ensureStore() {
  if (!hasDatabase()) {
    return;
  }

  ready ??= getPool().query(`
    create table if not exists app_store (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    )
  `).then(() => undefined);

  await ready;
}

export async function readJsonFromDb<T>(key: string): Promise<T | null> {
  if (!hasDatabase()) {
    return null;
  }

  await ensureStore();
  const result = await getPool().query<{ value: T }>(
    "select value from app_store where key = $1",
    [key],
  );

  return result.rows[0]?.value ?? null;
}

export async function writeJsonToDb(key: string, value: JsonValue) {
  if (!hasDatabase()) {
    return false;
  }

  await ensureStore();
  await getPool().query(
    `
      insert into app_store (key, value, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (key)
      do update set value = excluded.value, updated_at = now()
    `,
    [key, JSON.stringify(value)],
  );

  return true;
}
