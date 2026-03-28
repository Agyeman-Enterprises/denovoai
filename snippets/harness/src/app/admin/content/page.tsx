"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ContentModerationPage() {
  const supabase = createClient();
  const [listings, setListings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("listings").select("id, title, status, user_id, created_at").order("created_at", { ascending: false }).limit(50);
      setListings(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <p className="text-white/40">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
      <div className="mt-6 space-y-2">
        {listings.length === 0 ? (
          <p className="text-sm text-white/25">No listings to moderate.</p>
        ) : (
          listings.map(l => (
            <div key={l.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <p className="text-sm text-white/70">{l.title as string}</p>
                <p className="text-xs text-white/25">{new Date(l.created_at as string).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${(l.status as string) === "active" ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/40"}`}>{l.status as string}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
