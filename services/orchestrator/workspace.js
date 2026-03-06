import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src, { withFileTypes: true }).forEach((entry) => {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  });
}

export function materializeWorkspace(runDir, { template = "saas-crud" }) {
  const templateDir = path.join(root, "templates", template);
  const workspaceDir = path.join(runDir, "workspace");
  if (!fs.existsSync(templateDir)) throw new Error(`Template not found: ${template}`);
  copyDir(templateDir, workspaceDir);
  return workspaceDir;
}
