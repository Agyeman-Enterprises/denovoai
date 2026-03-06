import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Run Playwright tests inside the workspace if dependencies are installed.
 * This is best-effort; failures are returned as status.
 */
export function runWorkspaceTests(workspaceDir) {
  try {
    execSync("npm test -- --reporter=list", { cwd: workspaceDir, stdio: "ignore" });
    return { ran: true, status: "passed" };
  } catch (err) {
    return { ran: true, status: "failed", error: err.message };
  }
}
