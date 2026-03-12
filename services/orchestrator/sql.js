import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Attempt to apply a SQL bundle to DATABASE_URL using psql if available.
 * If psql is not present or DATABASE_URL missing, we simply log a warning.
 *
 * Security: uses execFileSync with argument arrays — no shell interpolation.
 * bundlePath is validated as an existing file path before use.
 */
export function applySqlBundle(bundlePath) {
  const dbUrl = process.env.DATABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!dbUrl) {
    return { applied: false, reason: "DATABASE_URL not set; skipped SQL apply" };
  }

  // Resolve and validate bundlePath — must be an existing file, no shell chars
  const resolvedPath = path.resolve(bundlePath);
  if (!fs.existsSync(resolvedPath)) {
    return { applied: false, reason: "bundle not found" };
  }

  try {
    // execFileSync with array args — no shell, no injection
    execFileSync("psql", [dbUrl, "-f", resolvedPath], { stdio: "ignore" });
    return { applied: true, via: "psql" };
  } catch (err) {
    // fallback: supabase CLI if available
    try {
      if (supabaseServiceKey) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const conn = supabaseUrl ? `${supabaseUrl}/postgres` : null;
        if (conn) {
          execFileSync(
            "supabase",
            ["db", "remote", "commit", "--db-url", dbUrl, "--file", resolvedPath],
            { stdio: "ignore" }
          );
          return { applied: true, via: "supabase-cli" };
        }
      }
    } catch {}
    return { applied: false, reason: err.message };
  }
}
