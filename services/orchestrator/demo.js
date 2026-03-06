#!/usr/bin/env node
/**
 * Minimal orchestrator demo.
 * Simulates a run using the module resolver and emits:
 * - detected mode/features
 * - final module set
 * - lockfile path
 * - run log stub
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveModules } from "../module-engine/resolve.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");
const runsDir = path.join(root, "runs");
fs.mkdirSync(runsDir, { recursive: true });

const prompt = process.env.DENOVO_PROMPT || "Build a gardening community with photo uploads";

// Very naive prompt interpreter (placeholder for LLM): detect simple keywords.
function interpretPrompt(text) {
  const lower = text.toLowerCase();
  const mode = lower.includes("market") ? "marketplace" : "community";

  const features = [];
  if (lower.includes("upload")) features.push("uploads");
  if (lower.includes("payment") || lower.includes("sell") || lower.includes("buy")) {
    features.push("payments");
    features.push("marketplace");
  }
  if (lower.includes("message")) features.push("messaging");
  if (lower.includes("ai")) features.push("ai");

  const requested = [];
  if (lower.includes("private")) requested.push("private_groups");

  return { mode, features, requested };
}

function main() {
  const runConfig = interpretPrompt(prompt);
  const { resolved, lockfile } = resolveModules(runConfig);

  const runId = `run-${Date.now()}`;
  const runDir = path.join(runsDir, runId);
  fs.mkdirSync(runDir, { recursive: true });

  const lockfilePath = path.join(runDir, "RunLockfile.json");
  fs.writeFileSync(lockfilePath, JSON.stringify(lockfile, null, 2));

  const runLog = {
    id: runId,
    prompt,
    ...runConfig,
    modules: resolved,
    steps: [
      "intake_complete",
      "spec_synthesized",
      "architecture_ready",
      "module_resolution_complete",
      "build_stubbed",
      "tests_stubbed",
      "deploy_stubbed"
    ],
    status: "stub-complete",
    created_at: new Date().toISOString()
  };
  const logPath = path.join(runDir, "run-log.json");
  fs.writeFileSync(logPath, JSON.stringify(runLog, null, 2));

  console.log("DeNovo demo run");
  console.log(`Prompt: ${prompt}`);
  console.log(`Detected mode: ${runConfig.mode}`);
  console.log(`Features: ${runConfig.features.join(", ") || "none"}`);
  console.log(`Modules (${resolved.length}): ${resolved.map((m) => m.name).join(", ")}`);
  console.log(`Lockfile: ${path.relative(root, lockfilePath)}`);
  console.log(`Run log: ${path.relative(root, logPath)}`);
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invokedDirectly) main();
