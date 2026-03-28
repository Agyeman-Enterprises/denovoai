"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuditLogPage() {
  const supabase = createClient();
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
      setLogs(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <p className="text-white/40">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Audit Log</h1>
      <div className="mt-6 space-y-1">
        {logs.length === 0 ? (
          <p className="text-sm text-white/25">No audit entries.</p>
        ) : (
          logs.map(l => (
            <div key={l.id as string} className="flex items-center justify-between rounded-lg p-3 text-sm" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div>
                <span className="text-white/70 font-medium">{l.action as string}</span>
                <span className="text-white/25 ml-2">{l.entity_type as string} {((l.entity_id as string) || "").slice(0, 8)}</span>
              </div>
              <span className="text-xs text-white/25">{new Date(l.created_at as string).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
