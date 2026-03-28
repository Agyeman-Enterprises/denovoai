"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function RecordsPage() {
  const supabase = createClient();
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let query = supabase.from("records").select("*").eq("is_archived", false).order("created_at", { ascending: false }).limit(50);
      if (search.trim()) {
        query = query.textSearch("search_vector", search, { type: "websearch", config: "english" });
      }
      const { data } = await query;
      setRecords(data || []);
      setLoading(false);
    }
    load();
  }, [supabase, search]);

  if (loading) return <p className="text-white/40">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{"{{PRIMARY_ENTITY_PLURAL}}"}</h1>
        <Link href="/app/records/new" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#1E40AF" }}>
          New {"{{PRIMARY_ENTITY}}"}
        </Link>
      </div>

      <input
        type="search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/30" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <th className="pb-2 pr-4">Title</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Priority</th>
              <th className="pb-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id as string} className="hover:bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <td className="py-2 pr-4"><Link href={`/app/records/${r.id}`} className="text-white/80 hover:text-white">{r.title as string}</Link></td>
                <td className="py-2 pr-4 text-white/40">{r.status as string}</td>
                <td className="py-2 pr-4"><span className={`text-xs ${(r.priority as string) === "high" || (r.priority as string) === "urgent" ? "text-red-400" : "text-white/30"}`}>{r.priority as string}</span></td>
                <td className="py-2 text-white/20 text-xs">{new Date(r.created_at as string).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && <p className="mt-4 text-sm text-white/25">No {"{{PRIMARY_ENTITY_PLURAL}}"} found.</p>}
      </div>
    </div>
  );
}
