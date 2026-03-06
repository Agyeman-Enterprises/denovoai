import fs from "node:fs";
import path from "node:path";

/**
 * Propagate secrets into the workspace environment.
 * Copies root .env.local into workspace/.env.local if present.
 * Also writes Vercel env file for CLI if possible.
 */
export function propagateEnv(workspaceDir) {
  const rootEnv = path.resolve(".env.local");
  const workspaceEnv = path.join(workspaceDir, ".env.local");
  if (fs.existsSync(rootEnv)) {
    fs.copyFileSync(rootEnv, workspaceEnv);
  }
  // Vercel env file
  const vercelEnv = path.join(workspaceDir, ".vercel", ".env.local");
  fs.mkdirSync(path.dirname(vercelEnv), { recursive: true });
  if (fs.existsSync(rootEnv)) {
    fs.copyFileSync(rootEnv, vercelEnv);
  }
}
