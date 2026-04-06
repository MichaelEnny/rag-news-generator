import { attachDatabasePool } from "@vercel/functions";
import { Pool, type QueryResultRow } from "pg";

import { env, isDatabaseConfigured } from "@/lib/env";

let pool: Pool | null = null;

function normalizeDatabaseUrl(connectionString: string) {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode");

    if (sslMode === "require" || sslMode === "prefer" || sslMode === "verify-ca") {
      url.searchParams.set("sslmode", "verify-full");
    }

    return url.toString();
  } catch {
    return connectionString;
  }
}

export function getPool() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: normalizeDatabaseUrl(env.DATABASE_URL)
    });
    attachDatabasePool(pool);
  }

  return pool;
}

export async function sql<T extends QueryResultRow = QueryResultRow>(queryText: string, values: unknown[] = []) {
  const currentPool = getPool();

  if (!currentPool) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return currentPool.query<T>(queryText, values);
}
