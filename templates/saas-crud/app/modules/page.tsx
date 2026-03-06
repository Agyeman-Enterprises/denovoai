import Link from "next/link";

async function getModules() {
  const res = await fetch("http://localhost:3000/api/modules", { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.modules ?? [];
}

export default async function ModulesPage() {
  const modules = await getModules();
  return (
    <main className="page">
      <h1>Modules</h1>
      <div className="grid">
        {modules.map((m: any) => (
          <div className="module" key={m.name}>
            <div className="pill">{m.channel}</div>
            <h3>{m.name}</h3>
            <p className="muted">v{m.version}</p>
            <Link href={"/modules/" + m.name}>Open</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
