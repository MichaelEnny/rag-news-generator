import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import pg from "pg";

const { Pool } = pg;

async function loadDotEnvFile() {
  const envPath = path.join(process.cwd(), ".env");

  try {
    const envFile = await readFile(envPath, "utf8");
    for (const line of envFile.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing .env files and fall back to process env only.
  }
}

await loadDotEnvFile();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set before running migrations.");
}

const migrationsDir = path.join(process.cwd(), "db", "migrations");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

try {
  const migrationFiles = (await readdir(migrationsDir))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  for (const fileName of migrationFiles) {
    const migrationPath = path.join(migrationsDir, fileName);
    const sql = await readFile(migrationPath, "utf8");
    await pool.query(sql);
    console.log("Migration applied:", migrationPath);
  }
} finally {
  await pool.end();
}
