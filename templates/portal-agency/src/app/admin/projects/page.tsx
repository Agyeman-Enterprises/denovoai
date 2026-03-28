"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ProjectsPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("projects").select("*, profiles(display_name)").order("created_at", { ascending: false });
      setProjects(data || []);
    }
    load();
  }, [supabase]);

  return (
    <div>
      <h1 className="text-2xl font-bold">All {"{{SERVICE_NOUN_PLURAL}}"}</h1>
      <div className="mt-6 space-y-2">
        {projects.map(p => (
          <Link key={p.id as string} href={`/admin/projects/${p.id}`}>
            <div className="flex items-center justify-between rounded-xl p-4 hover:border-indigo-500/30" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p className="text-sm font-medium">{p.title as string}</p>
                <p className="text-xs text-white/25">{String((p.profiles as Record<string, unknown>)?.display_name || 'Unassigned') || "Unassigned"}</p>
              </div>
              <span className={`text-xs ${(p.status as string) === "active" ? "text-green-400" : "text-white/30"}`}>{p.status as string}</span>
            </div>
          </Link>
        ))}
        {projects.length === 0 && <p className="text-sm text-white/25">No {"{{SERVICE_NOUN_PLURAL}}"} yet.</p>}
      </div>
    </div>
  );
}
