import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Attempt to apply a SQL bundle to DATABASE_URL using psql if available.
 * If psql is not present or DATABASE_URL missing, we simply log a warning.
 */
export function applySqlBundle(bundlePath) {
  const dbUrl = process.env.DATABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl) {
    return { applied: false, reason: "DATABASE_URL not set; skipped SQL apply" };
  }
  if (!fs.existsSync(bundlePath)) {
    return { applied: false, reason: "bundle not found" };
  }

  try {
    execSync(`psql "${dbUrl}" -f "${bundlePath}"`, { stdio: "ignore" });
    return { applied: true, via: "psql" };
  } catch (err) {
    // fallback: supabase remote psql if available
    try {
      if (supabaseServiceKey) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const conn = supabaseUrl ? `${supabaseUrl}/postgres` : null;
        if (conn) {
          execSync(`supabase db remote commit --db-url "${dbUrl}" --file "${bundlePath}"`, {
            stdio: "ignore"
          });
          return { applied: true, via: "supabase-cli" };
        }
      }
    } catch {}
    return { applied: false, reason: err.message };
  }
}
