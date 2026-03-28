"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function DashboardPage() {
  const supabase = createClient();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setItems(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `New ${"{{PRIMARY_ENTITY}}"}` }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.error === "USAGE_LIMIT_REACHED") {
        setError("You've hit your limit. Upgrade to create more.");
      } else {
        setError(data.error || "Failed to create");
      }
    } else {
      setItems(prev => [data, ...prev]);
    }
    setCreating(false);
  };

  if (loading) return <p className="text-white/40">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My {"{{PRIMARY_ENTITY_PLURAL}}"}</h1>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "#3B82F6" }}
        >
          {creating ? "Creating..." : `New ${"{{PRIMARY_ENTITY}}"}`}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-sm text-red-400">{error}</p>
          <Link href="/dashboard/billing" className="mt-2 inline-block text-xs text-blue-400 hover:text-blue-300">Upgrade Plan</Link>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm text-white/25">No {"{{PRIMARY_ENTITY_PLURAL}}"} yet. Create your first one.</p>
          </div>
        ) : (
          items.map(item => (
            <Link key={item.id as string} href={`/dashboard/${item.id}`}>
              <div className="flex items-center justify-between rounded-xl p-4 transition-all hover:border-blue-500/30" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <p className="text-sm font-medium">{item.title as string}</p>
                  <p className="text-xs text-white/25">{new Date(item.created_at as string).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs ${(item.status as string) === "active" ? "text-green-400" : "text-white/30"}`}>
                  {item.status as string}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
