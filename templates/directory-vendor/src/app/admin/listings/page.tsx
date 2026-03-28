"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("directory_listings")
      .select("id, name, status, category, is_featured, view_count, created_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => { setListings(data || []); setLoading(false); });
  }, [supabase]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("directory_listings").update({ status }).eq("id", id);
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from("directory_listings").update({ is_featured: !current }).eq("id", id);
    setListings(prev => prev.map(l => l.id === id ? { ...l, is_featured: !current } : l));
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    await supabase.from("directory_listings").delete().eq("id", id);
    setListings(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/admin" className="text-lg font-bold text-white">{"{{APP_NAME}}"} Admin</Link>
        <Link href="/admin" className="text-sm text-white/40 hover:text-white/70">Approval Queue</Link>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold">All Listings</h1>

        {loading && <p className="mt-8 text-sm text-white/30">Loading...</p>}

        {!loading && (
          <div className="mt-6 space-y-2">
            {listings.map(l => (
              <div key={l.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{l.name as string}</p>
                    <span className="rounded-md px-1.5 py-0.5 text-[10px]" style={{
                      background: l.status === "active" ? "rgba(16,185,129,0.15)" : l.status === "pending" ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.05)",
                      color: l.status === "active" ? "#34d399" : l.status === "pending" ? "#fbbf24" : "rgba(255,255,255,0.3)",
                    }}>{(l.status as string).toUpperCase()}</span>
                    {l.is_featured ? <span className="text-[10px] text-amber-400">Featured</span> : null}
                  </div>
                  <p className="text-xs text-white/25">{l.category as string} &middot; {l.view_count as number} views</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleFeatured(l.id as string, l.is_featured as boolean)} className="rounded-md px-3 py-1.5 text-xs text-white/40 hover:text-white" style={{ background: "rgba(255,255,255,0.05)" }}>
                    {l.is_featured ? "Unfeature" : "Feature"}
                  </button>
                  <select value={l.status as string} onChange={e => updateStatus(l.id as string, e.target.value)} className="rounded-md px-2 py-1 text-xs text-white" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button onClick={() => deleteListing(l.id as string)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
