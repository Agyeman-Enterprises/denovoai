#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");
const orchestrator = path.join(root, "services", "orchestrator", "run.js");

const args = process.argv.slice(2);
execFileSync("node", [orchestrator, ...args], { stdio: "inherit" });
