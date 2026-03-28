"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ReportsPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("records").select("status").eq("is_archived", false);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: Record<string, unknown>) => {
        const s = r.status as string;
        counts[s] = (counts[s] || 0) + 1;
      });
      setStats(counts);
    }
    load();
  }, [supabase]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(stats).map(([status, count]) => (
          <div key={status} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs text-white/40">{status}</p>
            <p className="mt-1 text-2xl font-bold">{count}</p>
          </div>
        ))}
      </div>
      {Object.keys(stats).length === 0 && <p className="text-sm text-white/25">No data yet.</p>}
    </div>
  );
}
