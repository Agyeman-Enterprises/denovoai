/**
 * Lightweight schema validation wrapper.
 * Tries to use ajv if installed; otherwise performs required-field checks.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let ajv = null;
try {
  const Ajv = (await import("ajv")).default;
  ajv = new Ajv({ allErrors: true, strict: false });
} catch {
  // ajv not installed; fallback will be used.
}

function loadSchema(schemaPath) {
  return JSON.parse(fs.readFileSync(schemaPath, "utf8"));
}

export function validateOrWarn(schemaPath, data) {
  const schema = loadSchema(schemaPath);
  if (ajv) {
    const validate = ajv.compile(schema);
    const ok = validate(data);
    return { ok, errors: ok ? [] : validate.errors };
  }
  // Fallback: check top-level required keys only.
  const required = schema.required || [];
  const missing = required.filter((k) => data[k] === undefined);
  return { ok: missing.length === 0, errors: missing.map((k) => `${k} is required`) };
}

export function schemaPath(name) {
  const __filename = fileURLToPath(import.meta.url);
  const dir = path.dirname(__filename);
  return path.join(dir, `${name}.schema.json`);
}
