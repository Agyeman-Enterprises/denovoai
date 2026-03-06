#!/usr/bin/env node
/**
 * DeNovo Orchestrator (offline demo)
 * - Intake prompt -> intent (mode/features/requested + product spec/design)
 * - Resolve modules with governance rules
 * - Apply knowledge patterns (adds recommended modules when compatible)
 * - Emit artifacts: ProductSpec.json, SystemDesign.json, RunLockfile.json, run-log.json
 * - Generate a static HTML "app" representing the build
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { interpretPrompt } from "../prompt-engine/index.js";
import { resolveModules } from "../module-engine/resolve.js";
import { applyKnowledgePatterns } from "../knowledge-engine/use-patterns.js";
import { PHASES, nextPhase } from "./state-machine.js";
import { buildStaticAppFromArtifacts } from "./render.js";
import { validateOrWarn, schemaPath } from "../../packages/schemas/validate.js";
import { materializeWorkspace } from "./workspace.js";
import { customizeWorkspace, writeModulesApi } from "./customize.js";
import { generateModulePages, generateSqlBundle } from "./codegen.js";
import { applySqlBundle } from "./sql.js";
import { runWorkspaceTests } from "./tests.js";
import { deployToVercel } from "../deployer/vercel.js";
import { installDeps, buildWorkspace } from "./build.js";
import { propagateEnv } from "./env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");
const runsDir = path.join(root, "runs");
fs.mkdirSync(runsDir, { recursive: true });

function parseArgs() {
  const argv = process.argv.slice(2);
  const promptIdx = argv.indexOf("--prompt");
  const prompt =
    promptIdx !== -1 && argv[promptIdx + 1]
      ? argv[promptIdx + 1]
      : "Build a gardening community with photo uploads";
  const allowExperimental = argv.includes("--allow-experimental");
  return { prompt, allowExperimental };
}

function writeJSON(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

async function main() {
  const { prompt, allowExperimental } = parseArgs();
  const runId = `run-${Date.now()}`;
  const runDir = path.join(runsDir, runId);
  const artifactsDir = path.join(runDir, "artifacts");
  fs.mkdirSync(runDir, { recursive: true });

  const events = [];
  let phase = "intake";
  const pushEvent = (type, payload = {}) => {
    events.push({ phase, type, payload, at: new Date().toISOString() });
  };

  // Intake -> Spec -> Design
  const intent = interpretPrompt(prompt);
  pushEvent("intake.complete", intent);
  phase = nextPhase(phase);

  pushEvent("spec.generated", intent.productSpec);
  const specCheck = validateOrWarn(schemaPath("product-spec"), intent.productSpec);
  pushEvent("spec.validated", specCheck);
  phase = nextPhase(phase);

  pushEvent("design.generated", intent.systemDesign);
  const designCheck = validateOrWarn(schemaPath("system-design"), intent.systemDesign);
  pushEvent("design.validated", designCheck);
  phase = nextPhase(phase);

  // Compose modules (usecase rules + knowledge patterns)
  const knowledgeModules = applyKnowledgePatterns(intent.mode, intent.features);
  const requested = [...intent.requested, ...knowledgeModules];
  const { resolved, lockfile } = resolveModules({
    mode: intent.mode,
    features: intent.features,
    requested,
    allowExperimental,
    experimentalPolicy: allowExperimental ? "allow" : "skip"
  });
  pushEvent("compose.resolved", { modules: resolved, lockfile });
  phase = nextPhase(phase);

  // Build (stub workspace materialization)
  const workspaceDir = materializeWorkspace(runDir, { template: "saas-crud" });
  pushEvent("build.workspace_created", { workspaceDir });
  customizeWorkspace(workspaceDir, {
    productSpec: intent.productSpec,
    systemDesign: intent.systemDesign,
    modules: resolved,
    features: intent.features,
    mode: intent.mode,
    channel: lockfile.channel
  });
  pushEvent("build.workspace_customized", { workspaceDir });

  // Module-aware codegen
  generateModulePages(workspaceDir, resolved);
  const sqlBundle = generateSqlBundle(runDir, resolved);
  pushEvent("build.module_pages_generated", { count: resolved.length });
  pushEvent("build.sql_bundle_generated", { path: sqlBundle });
  writeModulesApi(workspaceDir, resolved);
  pushEvent("build.api_modules_generated");

  // Install deps + build (best effort)
  propagateEnv(workspaceDir);
  const installResult = installDeps(workspaceDir);
  pushEvent("build.deps", installResult);
  const buildResult = buildWorkspace(workspaceDir);
  pushEvent("build.compile", buildResult);
  phase = nextPhase(phase);

  // Verify (best effort tests)
  const testResult = runWorkspaceTests(workspaceDir);
  pushEvent("verify.tests_run", testResult);
  phase = nextPhase(phase);

  // Apply SQL (best effort)
  const sqlApply = applySqlBundle(sqlBundle);
  pushEvent("deploy.sql_apply", sqlApply);

  // Deploy (stub)
  const deployResult = await deployToVercel(workspaceDir);
  pushEvent("deploy.vercel", deployResult);
  phase = nextPhase(phase);

  // Complete
  pushEvent("complete");

  // Persist artifacts
  writeJSON(path.join(artifactsDir, "ProductSpec.json"), intent.productSpec);
  writeJSON(path.join(artifactsDir, "SystemDesign.json"), intent.systemDesign);
  writeJSON(path.join(artifactsDir, "RunLockfile.json"), lockfile);
  writeJSON(path.join(runDir, "run-log.json"), { id: runId, prompt, events, status: "complete" });

  // Static app output
  buildStaticAppFromArtifacts(runDir, {
    productSpec: intent.productSpec,
    systemDesign: intent.systemDesign,
    modules: resolved,
    features: intent.features,
    mode: intent.mode,
    channel: lockfile.channel
  });

  console.log("DeNovo run complete");
  console.log(`Prompt: ${prompt}`);
  console.log(`Mode: ${intent.mode}, Features: ${intent.features.join(", ") || "none"}`);
  console.log(`Modules (${resolved.length}): ${resolved.map((m) => m.name).join(", ")}`);
  console.log(`Artifacts: ${path.relative(root, artifactsDir)}`);
  console.log(`Static app: ${path.relative(root, path.join(runDir, "app", "index.html"))}`);
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invokedDirectly) main();
