import fs from "node:fs";
import path from "node:path";

/**
 * Apply simple substitutions into the materialized workspace:
 * - populate app/index.tsx with run-specific info
 * - write .env.local with Supabase/DB vars if available at repo root
 * - generate a simple /api/modules endpoint with resolved modules
 */
export function customizeWorkspace(workspaceDir, context) {
  const appPath = path.join(workspaceDir, "app", "index.tsx");
  if (fs.existsSync(appPath)) {
    const modules = context.modules;
    const features = context.features;
    const tests = context.productSpec.acceptance_tests;
    const mode = context.mode;
    const content = `import React from "react";
import Link from "next/link";
import { MockData } from "./components/MockData";

const modules = ${JSON.stringify(modules, null, 2)};
const features = ${JSON.stringify(features, null, 2)};
const tests = ${JSON.stringify(tests, null, 2)};
const mode = "${mode}";
import { MockData } from "./components/MockData";
import { MockData } from "./components/MockData";

export default function Home() {
  return (
    <main className="page">
      <header className="hero card">
        <div>
          <p className="eyebrow">DeNovo generated</p>
          <h1>${escapeTSX(context.productSpec.app_name)}</h1>
          <p className="muted">Mode: ${context.mode} · Channel: ${context.channel}</p>
          <div className="chips">
            {features.length === 0 ? <span className="pill">No extra features</span> : null}
            {features.map((f) => (
              <span className="pill" key={f}>{f}</span>
            ))}
          </div>
        </div>
        <div className="card meta">
          <div><strong>Modules</strong><span>{modules.length}</span></div>
          <div><strong>Tests</strong><span>{tests.length}</span></div>
          <div><strong>API</strong><Link href="/api/modules">/api/modules</Link></div>
        </div>
      </header>

      <section className="card">
        <h3>Acceptance Tests</h3>
        <ul>
          {tests.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>Modules</h3>
        <div className="grid">
          {modules.map((m) => (
            <div className="module" key={m.name}>
              <div className="pill">{m.channel}</div>
              <h4>{m.name}</h4>
              <p className="muted">v{m.version}</p>
              <Link href={"/modules/" + m.name}>Open</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Recommended next steps</h3>
        <ul>
          <li>Run <code>npm install</code> then <code>npm run dev</code> in this workspace</li>
          <li>Apply DB schema: <code>psql "$DATABASE_URL" &lt; artifacts/schema.bundle.sql</code></li>
          <li>Visit <Link href="/modules">/modules</Link> to browse generated module pages</li>
        </ul>
      </section>
      <MockData modules={modules} />
    </main>
  );
}
`;
    fs.writeFileSync(appPath, content);
  }

  // Propagate env secrets from repo root .env.local into workspace/.env.local (if present)
  const rootEnv = path.resolve(".env.local");
  const workspaceEnv = path.join(workspaceDir, ".env.local");
  if (fs.existsSync(rootEnv) && !fs.existsSync(workspaceEnv)) {
    fs.copyFileSync(rootEnv, workspaceEnv);
  }
}

export function writeModulesApi(workspaceDir, modules) {
  const apiDir = path.join(workspaceDir, "app", "api", "modules");
  fs.mkdirSync(apiDir, { recursive: true });
  const routePath = path.join(apiDir, "route.ts");
  const content = `import { NextResponse } from "next/server";

const modules = ${JSON.stringify(
    modules.map((m) => ({ name: m.name, version: m.version, channel: m.channel })),
    null,
    2
  )};

export async function GET() {
  return NextResponse.json({ modules });
}
`;
  fs.writeFileSync(routePath, content);
}

function escapeTSX(str) {
  return String(str).replace(/`/g, "\\`").replace(/\${/g, "\\${");
}
