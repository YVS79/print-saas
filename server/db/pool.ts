import { Pool } from "pg";

let pool: Pool | null = null;

/** Lazily initialise the DB pool to avoid crash at import time */
export function getDb(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required");
    }

    pool = new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX ?? 10),
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS ?? 30_000),
      connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS ?? 10_000),
    });
  }

  return pool;
}
