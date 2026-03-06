#!/usr/bin/env node
/**
 * Replay a previous run using its RunLockfile and artifacts.
 * For now, it regenerates the static app view from stored artifacts.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildStaticAppFromArtifacts } from "./render.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");

function main() {
  const runId = process.argv[2];
  if (!runId) {
    console.error("Usage: node services/orchestrator/replay.js <run-id>");
    process.exit(1);
  }
  const runDir = path.join(root, "runs", runId);
  const artifactsDir = path.join(runDir, "artifacts");
  const specPath = path.join(artifactsDir, "ProductSpec.json");
  const designPath = path.join(artifactsDir, "SystemDesign.json");
  const lockPath = path.join(artifactsDir, "RunLockfile.json");

  if (![specPath, designPath, lockPath].every(fs.existsSync)) {
    console.error("Missing artifacts for replay.");
    process.exit(1);
  }

  const productSpec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const systemDesign = JSON.parse(fs.readFileSync(designPath, "utf8"));
  const lockfile = JSON.parse(fs.readFileSync(lockPath, "utf8"));

  buildStaticAppFromArtifacts(runDir, {
    productSpec,
    systemDesign,
    modules: Object.entries(lockfile.modules).map(([name, version]) => ({
      name,
      version,
      channel: lockfile.channel
    })),
    features: lockfile.features || [],
    mode: lockfile.mode,
    channel: lockfile.channel
  });

  console.log("Replayed run", runId);
  console.log("Static app regenerated at", path.join("runs", runId, "app", "index.html"));
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invokedDirectly) main();
