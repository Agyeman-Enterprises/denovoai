"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ModuleItem = { name: string; version: string; channel: string };
type RunSummary = {
  id: string;
  prompt: string;
  mode: string;
  features: string[];
  modules: ModuleItem[];
  artifactsPath: string;
};

export default function Studio() {
  const [prompt, setPrompt] = useState("Build a community app with uploads");
  const [runs, setRuns] = useState<RunSummary[]>([]);

  useEffect(() => {
    refreshRuns();
  }, []);

  const refreshRuns = async () => {
    const res = await fetch("/api/runs", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setRuns(data.runs || []);
    }
  };

  const startRun = async () => {
    await fetch("/api/run", {
      method: "POST",
      body: JSON.stringify({ prompt }),
      headers: { "Content-Type": "application/json" }
    }).catch(() => {});
    await refreshRuns();
  };

  return (
    <main className="page">
      <div className="card">
        <h1>DeNovo Studio</h1>
        <p className="muted">Describe an app, review modules, launch, replay.</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Describe your app..."
          style={{ marginTop: 10 }}
        />
        <button style={{ marginTop: 12 }} onClick={startRun}>
          Generate & Deploy (stub)
        </button>
      </div>

      <div className="card">
        <h3>Recent Runs</h3>
        {runs.length === 0 && <p className="muted">No runs yet.</p>}
        <div className="grid">
          {runs.map((r) => (
            <div key={r.id} className="card">
              <div className="pill">{r.mode || "—"}</div>
              <h4>{r.prompt}</h4>
              <p className="muted">Features: {r.features?.join(", ") || "none"}</p>
              <p className="muted">Modules: {r.modules?.length ?? 0}</p>
              <p className="muted">Artifacts: {r.artifactsPath}</p>
              <Link href={`/runs/${r.id}`}>Open run</Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
