/**
 * Prompt Engine (heuristic stub).
 * Converts a free-form prompt into structured intent:
 * - mode
 * - features (flags)
 * - requested modules (explicit asks)
 * - product spec + acceptance tests
 *
 * This is intentionally deterministic and dependency-free so it can run offline.
 * Swap this module with an LLM-backed version later.
 */
import crypto from "node:crypto";

const MODES = ["community", "marketplace", "booking", "saas_dashboard"];

const FEATURE_KEYWORDS = {
  payments: ["payment", "checkout", "stripe", "sell", "buy", "commerce", "billing"],
  marketplace: ["sell", "buy", "marketplace", "catalog", "listings"],
  uploads: ["upload", "photo", "image", "media"],
  messaging: ["chat", "message", "dm"],
  ai: ["ai", "agent", "copilot", "recommendation"],
  private_groups: ["private", "group"]
};

const MODE_KEYWORDS = {
  community: ["community", "forum", "social", "group"],
  marketplace: ["marketplace", "store", "shop", "buy", "sell"],
  booking: ["book", "reservation", "schedule", "calendar"],
  saas_dashboard: ["dashboard", "crm", "admin", "analytics"]
};

export function interpretPrompt(prompt) {
  const lower = prompt.toLowerCase();

  let mode = "community";
  for (const [candidate, words] of Object.entries(MODE_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) {
      mode = candidate;
      break;
    }
  }

  const features = [];
  for (const [flag, words] of Object.entries(FEATURE_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) features.push(flag);
  }

  const requested = [];
  if (lower.includes("private")) requested.push("private_groups");

  const appName = deriveAppName(prompt, mode);

  const productSpec = {
    app_name: appName,
    target_users: ["early adopters", "power users", "public beta"],
    jobs_to_be_done: [`${appName}: deliver value for ${mode} use case`],
    core_features: features.map((f, i) => ({ name: f, priority: i + 1 })),
    non_goals: ["security/compliance not production-hardened in stub"],
    constraints: ["generated offline demo"],
    acceptance_tests: [
      "User can sign in",
      "User can perform the primary action for this mode",
      "Smoke test passes"
    ]
  };

  const systemDesign = {
    services: [
      { name: "frontend", responsibilities: ["render UI", "call APIs"] },
      { name: "backend", responsibilities: ["expose APIs", "business logic"] }
    ],
    data_models: [
      { name: "users", fields: [{ name: "id", type: "uuid" }, { name: "email", type: "text" }] }
    ],
    api_endpoints: [{ method: "GET", path: "/health", description: "health check" }],
    auth_model: { strategy: "magic_link", roles: ["user", "admin"] },
    observability: { metrics: ["health_check"], logs: ["requests"] }
  };

  return { mode, features, requested, productSpec, systemDesign };
}

function deriveAppName(prompt, mode) {
  const words = prompt.split(/\s+/).filter(Boolean);
  const base = words.slice(0, 3).join(" ") || "DeNovo App";
  const hash = crypto.createHash("md5").update(prompt).digest("hex").slice(0, 4);
  return `${capitalize(base)} (${capitalize(mode)}-${hash})`;
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
