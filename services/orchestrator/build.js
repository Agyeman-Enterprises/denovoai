import { execSync } from "node:child_process";

export function installDeps(workspaceDir) {
  try {
    execSync("npm install --ignore-scripts", { cwd: workspaceDir, stdio: "ignore" });
    return { installed: true };
  } catch (err) {
    return { installed: false, error: err.message };
  }
}

export function buildWorkspace(workspaceDir) {
  try {
    execSync("npm run build --if-present", { cwd: workspaceDir, stdio: "ignore" });
    return { built: true };
  } catch (err) {
    return { built: false, error: err.message };
  }
}
