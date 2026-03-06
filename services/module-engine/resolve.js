#!/usr/bin/env node
/**
 * Minimal module resolver aligned with the DeNovo governance rules.
 * - Platform core is always included.
 * - Use-case core depends on mode.
 * - Feature flags pull in additional modules.
 * - Experimental modules are blocked unless allowExperimental is true.
 */
import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");
const rulesPath = path.join(root, "services", "module-engine", "usecase_rules.json");
const registryPath = path.join(root, "services", "module-engine", "modules.json");

const rules = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

const registryMap = new Map(registry.modules.map((m) => [m.name, m]));

function resolveModules({
  mode,
  features = [],
  requested = [],
  allowExperimental = false,
  experimentalPolicy = "error" // "error" | "skip" | "allow"
}) {
  if (!rules.modes[mode]) {
    throw new Error(`Unknown mode '${mode}'. Known: ${Object.keys(rules.modes).join(", ")}`);
  }

  const finalSet = new Set();

  // Platform core
  rules.platform_core.forEach((m) => finalSet.add(m));

  // Usecase core
  rules.modes[mode].core.forEach((m) => finalSet.add(m));

  // Feature-driven modules
  features.forEach((flag) => {
    const extra = rules.feature_rules[flag] || [];
    extra.forEach((m) => finalSet.add(m));
  });

  // User-requested modules
  requested.forEach((m) => finalSet.add(m));

  // Validate against registry and enforce channels
  const resolved = [];
  for (const name of finalSet) {
    const meta = registryMap.get(name);
    if (!meta) {
      throw new Error(`Module '${name}' not found in registry`);
    }
    if (meta.channel === "experimental" && !allowExperimental) {
      if (experimentalPolicy === "allow") {
        resolved.push(meta);
      } else if (experimentalPolicy === "skip") {
        continue;
      } else {
        throw new Error(
          `Module '${name}' is experimental. Re-run with allowExperimental=true to include it.`
        );
      }
    } else {
      resolved.push(meta);
    }
  }

  // Sort for determinism
  resolved.sort((a, b) => a.name.localeCompare(b.name));

  const lockfile = {
    mode,
    features,
    allowExperimental,
    modules: Object.fromEntries(resolved.map((m) => [m.name, `${m.version}`])),
    channel: allowExperimental ? "experimental" : "stable",
    generated_at: new Date().toISOString()
  };

  return { resolved, lockfile };
}

function main() {
  const args = process.argv.slice(2);
  const example = args.includes("--example");

  const config = example
    ? { mode: "community", features: ["uploads"], requested: ["private_groups"] }
    : JSON.parse(fs.readFileSync(0, "utf8")); // read from STDIN

  try {
    const { resolved, lockfile } = resolveModules(config);
    console.log(JSON.stringify({ resolved, lockfile }, null, 2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invokedDirectly) main();

export { resolveModules };
