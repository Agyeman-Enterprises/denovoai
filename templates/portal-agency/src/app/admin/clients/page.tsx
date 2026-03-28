"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ClientsPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("profiles").select("*").eq("role", "client").order("created_at", { ascending: false });
      setClients(data || []);
    }
    load();
  }, [supabase]);

  return (
    <div>
      <h1 className="text-2xl font-bold">{"{{CLIENT_NOUN_PLURAL}}"}</h1>
      <div className="mt-6 space-y-2">
        {clients.map(c => (
          <Link key={c.id as string} href={`/admin/clients/${c.id}`}>
            <div className="flex items-center justify-between rounded-xl p-4 hover:border-indigo-500/30" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p className="text-sm font-medium">{(c.display_name as string) || "No name"}</p>
                <p className="text-xs text-white/25">{(c.company_name as string) || ""}</p>
              </div>
              <span className="text-xs text-white/20">{new Date(c.created_at as string).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
        {clients.length === 0 && <p className="text-sm text-white/25">No {"{{CLIENT_NOUN_PLURAL}}"} yet.</p>}
      </div>
    </div>
  );
}
