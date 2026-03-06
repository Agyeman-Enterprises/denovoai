import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

/**
 * Deploy to Vercel using vercel CLI if VERCE L_TOKEN is set.
 * Assumes the user has `vercel` CLI available in PATH.
 */
export async function deployToVercel(workspaceDir) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    return { deployed: false, reason: "VERCEL_TOKEN not set" };
  }
  try {
    // ensure project name
    const pkgPath = path.join(workspaceDir, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (!pkg.name) {
        pkg.name = "denovo-app";
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      }
    }
    const envFlags = [];
    // If .env.local exists, Vercel CLI can pick it up with --env-file
    const envFile = path.join(workspaceDir, ".env.local");
    if (fs.existsSync(envFile)) {
      envFlags.push("--env-file", ".env.local");
    }
    execSync(`vercel --token ${token} --prod --confirm ${envFlags.join(" ")}`, {
      cwd: workspaceDir,
      stdio: "pipe"
    });
    // Get latest deployment URL
    const url = execSync(`vercel --token ${token} --prod ls --json`, {
      cwd: workspaceDir,
      stdio: "pipe"
    }).toString();
    return { deployed: true, url };
  } catch (err) {
    return { deployed: false, reason: err.message };
  }
}
