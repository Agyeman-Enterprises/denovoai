"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TeamPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setMembers(data || []);
    }
    load();
  }, [supabase]);

  return (
    <div>
      <h1 className="text-2xl font-bold">{"{{TEAM_NOUN}}"} Members</h1>
      <div className="mt-6 space-y-2">
        {members.map(m => (
          <div key={m.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <p className="text-sm font-medium">{(m.display_name as string) || "No name"}</p>
            </div>
            <span className="text-xs text-white/30">{m.role as string}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
