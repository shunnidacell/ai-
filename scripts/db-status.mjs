import pg from "pg";

const { Pool } = pg;
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
