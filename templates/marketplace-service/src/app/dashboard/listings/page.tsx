"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MyListingsPage() {
  const supabase = createClient();
  const [listings, setListings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
      setListings(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <p className="text-white/40">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">My {"{{LISTING_NOUN_PLURAL}}"}</h1>
      <div className="mt-6 space-y-2">
        {listings.length === 0 ? (
          <p className="text-sm text-white/25">No {"{{LISTING_NOUN_PLURAL}}"} yet. Create your first one.</p>
        ) : (
          listings.map(l => (
            <div key={l.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <p className="text-sm font-medium">{l.title as string}</p>
                <p className="text-xs text-white/25">${((l.price_cents as number) / 100).toFixed(0)} &middot; {l.category as string}</p>
              </div>
              <span className={`text-xs ${(l.status as string) === "active" ? "text-green-400" : "text-white/30"}`}>
                {l.status as string}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
