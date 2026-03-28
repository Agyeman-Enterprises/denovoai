"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
      setUsers(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleAction = async (userId: string, action: "ban" | "promote") => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: action === "ban" ? "banned" : "admin" } : u));
    }
  };

  const filtered = users.filter(u => {
    const name = ((u.display_name as string) || "").toLowerCase();
    const id = ((u.id as string) || "").toLowerCase();
    return name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
  });

  if (loading) return <p className="text-white/40">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Users</h1>
      <input
        type="text" placeholder="Search by name or ID..."
        value={search} onChange={e => setSearch(e.target.value)}
        className="mt-4 w-full max-w-sm rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      />
      <div className="mt-6 space-y-2">
        {filtered.map(u => (
          <div key={u.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div>
              <Link href={`/admin/users/${u.id}`} className="text-sm font-medium text-white/80 hover:text-white">{(u.display_name as string) || "No name"}</Link>
              <p className="text-xs text-white/25 font-mono">{(u.id as string).slice(0, 12)}...</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${(u.role as string) === "admin" ? "bg-violet-500/20 text-violet-400" : (u.role as string) === "banned" ? "bg-red-500/20 text-red-400" : "bg-white/5 text-white/40"}`}>{u.role as string}</span>
              {(u.role as string) !== "admin" && (u.role as string) !== "banned" && (
                <>
                  <button onClick={() => handleAction(u.id as string, "ban")} className="text-xs text-red-400 hover:text-red-300">Ban</button>
                  <button onClick={() => handleAction(u.id as string, "promote")} className="text-xs text-violet-400 hover:text-violet-300">Promote</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
