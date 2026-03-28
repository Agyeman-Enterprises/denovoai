"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STAGES = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"];

export default function BoardPage() {
  const supabase = createClient();
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("records").select("*").eq("is_archived", false).order("updated_at", { ascending: false });
      setRecords(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <p className="text-white/40">Loading board...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Board</h1>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageRecords = records.filter(r => r.status === stage);
          return (
            <div key={stage} className="min-w-[220px] shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-white/50">{stage}</h3>
                <span className="text-[10px] text-white/20">{stageRecords.length}</span>
              </div>
              <div className="space-y-2">
                {stageRecords.map(r => (
                  <a key={r.id as string} href={`/app/records/${r.id}`}>
                    <div className="rounded-lg p-3 transition-all hover:border-blue-500/30" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs font-medium text-white/80">{r.title as string}</p>
                      <p className={`mt-1 text-[10px] ${(r.priority as string) === "high" || (r.priority as string) === "urgent" ? "text-red-400" : "text-white/20"}`}>{r.priority as string}</p>
                    </div>
                  </a>
                ))}
                {stageRecords.length === 0 && <p className="text-[10px] text-white/15">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
