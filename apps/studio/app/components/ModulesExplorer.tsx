"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ModuleDetail from "./ModuleDetail";

type ModuleItem = { name: string; version?: string; channel?: string; runs?: number; sampleRunId?: string };
type RunSummary = { id: string; prompt: string; mode: string; features: string[]; modules: { name: string }[]; artifactsPath: string };

export default function ModulesExplorer({ modules, runs }: { modules: ModuleItem[]; runs: RunSummary[] }) {
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("all");
  const [selected, setSelected] = useState<ModuleItem | null>(null);

  const filtered = useMemo(() => {
    return modules
      .filter((m) => (channel === "all" ? true : (m.channel || "stable") === channel))
      .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()) || (m.version || "").includes(query));
  }, [modules, query, channel]);

  return (
    <aside className="card modules-explorer">
      <h3>Modules Explorer</h3>
      <p className="muted">Browse modules resolved by runs. Click a module to view details and runs.</p>

      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <input
          placeholder="Search modules..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search modules"
        />
        <select value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Filter channel">
          <option value="all">All</option>
          <option value="stable">Stable</option>
          <option value="experimental">Experimental</option>
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        {filtered.length === 0 && <p className="muted">No modules match.</p>}
        <ul className="module-list">
          {filtered.map((m) => (
            <li key={m.name}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <button className="link-button" onClick={() => setSelected(m)}>
                    <div className="module-name">{m.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{m.version ? `v${m.version}` : "version unknown"} • {m.channel || 'stable'}</div>
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="pill-small">{m.runs ?? 0} runs</span>
                  {m.sampleRunId ? (
                    <Link href={`/runs/${m.sampleRunId}`} className="view-link">Open sample run</Link>
                  ) : (
                    <span className="muted">No run</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selected && <ModuleDetail moduleName={selected.name} moduleInfo={selected} runs={runs} onClose={() => setSelected(null)} />}
    </aside>
  );
}
