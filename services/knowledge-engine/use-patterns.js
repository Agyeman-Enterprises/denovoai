import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");

const patternsPath = path.join(root, "services", "knowledge-engine", "patterns.example.json");

function loadPatterns() {
  if (!fs.existsSync(patternsPath)) return [];
  return JSON.parse(fs.readFileSync(patternsPath, "utf8"));
}

/**
 * Returns a list of modules recommended by promoted patterns for the given mode/features.
 * Only returns modules from patterns with status "promoted".
 */
export function applyKnowledgePatterns(mode, features = []) {
  const patterns = loadPatterns().filter((p) => p.status === "promoted");
  const picks = new Set();
  for (const p of patterns) {
    if (p.pattern.includes(mode) || features.some((f) => p.pattern.includes(f))) {
      p.modules.forEach((m) => picks.add(m));
    }
  }
  return Array.from(picks);
}
