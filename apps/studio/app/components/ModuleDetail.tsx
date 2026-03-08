"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type RunSummary = {
  id: string;
  prompt: string;
  mode: string;
  features: string[];
  modules: { name: string; version?: string; channel?: string }[];
  artifactsPath: string;
};

export default function ModuleDetail({
  moduleName,
  moduleInfo,
  runs,
  onClose
}: {
  moduleName: string;
  moduleInfo?: { version?: string; channel?: string; runs?: number };
  runs: RunSummary[];
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // focus close button for keyboard users
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const matched = runs.filter((r) => (r.modules || []).some((m) => m.name === moduleName));

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="module-title">
      <div className="modal-card">
        <div className="modal-header">
          <h2 id="module-title">{moduleName}</h2>
          <button ref={closeRef} onClick={onClose} aria-label="Close module details">✕</button>
        </div>
        <div className="modal-body">
          <p className="muted">Channel: {moduleInfo?.channel || "stable"} • Version: {moduleInfo?.version || "—"}</p>

          <h4>Included in runs ({matched.length})</h4>
          {matched.length === 0 && <p className="muted">No runs include this module yet.</p>}
          <ul className="module-runs-list">
            {matched.map((r) => (
              <li key={r.id}>
                <div className="run-line">
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.prompt}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{r.mode} • {r.modules?.length ?? 0} modules</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Link href={`/runs/${r.id}`} className="view-link">Open run</Link>
                    {r.artifactsPath && (
                      <a href={`/${r.artifactsPath.replace(/^runs\//, "runs/")}/../app/index.html`} target="_blank" rel="noreferrer" className="view-link">Static</a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
