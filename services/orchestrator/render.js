import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..", "..");

export function buildStaticAppFromArtifacts(runDir, context) {
  const appDir = path.join(runDir, "app");
  fs.mkdirSync(appDir, { recursive: true });

  const templatePath = path.join(root, "templates", "saas-crud", "index.html");
  let html = fs.existsSync(templatePath)
    ? fs.readFileSync(templatePath, "utf8")
    : "<!doctype html><title>DeNovo</title><body>{{APP_NAME}}</body>";

  const modulePills = context.modules
    .map(
      (m) =>
        `<span class="pill">${m.name}@${m.version}${m.channel === "experimental" ? " (exp)" : ""}</span>`
    )
    .join("");
  const featurePills =
    (context.features || []).map((f) => `<span class="pill">${f}</span>`).join("") || "—";
  const testList = context.productSpec.acceptance_tests.map((t) => `<li>${t}</li>`).join("");
  const services = context.systemDesign.services.map((s) => s.name).join(", ");

  html = html
    .replace(/{{APP_NAME}}/g, context.productSpec.app_name)
    .replace(/{{MODE}}/g, context.mode)
    .replace(/{{CHANNEL}}/g, context.channel)
    .replace(/{{MODULE_COUNT}}/g, String(context.modules.length))
    .replace(/{{MODULE_PILLS}}/g, modulePills)
    .replace(/{{FEATURE_PILLS}}/g, featurePills)
    .replace(/{{TEST_LIST}}/g, testList)
    .replace(/{{SERVICES}}/g, services)
    .replace(/{{AUTH}}/g, context.systemDesign.auth_model.strategy);

  fs.writeFileSync(path.join(appDir, "index.html"), html);
}
