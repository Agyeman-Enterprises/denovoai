import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..", "..", ".."); // from workspace/app/modules/[name]
const modulesPath = path.join(repoRoot, "app", "api", "modules", "route.ts");

async function getModule(name: string) {
  // simple static parse of generated route file
  try {
    const text = fs.readFileSync(modulesPath, "utf8");
    const jsonMatch = text.match(/const modules = (\\[.*\\]);/s);
    if (!jsonMatch) return null;
    const mods = JSON.parse(jsonMatch[1]);
    return mods.find((m: any) => m.name === name) || null;
  } catch {
    return null;
  }
}

export default async function ModulePage({ params }: { params: { name: string } }) {
  const mod = await getModule(params.name);
  if (!mod) return <main className="page">Module not found.</main>;
  return (
    <main className="page">
      <div className="card">
        <h1>{mod.name}</h1>
        <p className="muted">Version {mod.version}</p>
        <p className="muted">Channel {mod.channel}</p>
        <p>This page is auto-generated; hook your module UI here.</p>
      </div>
    </main>
  );
}
