"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function BrowsePage() {
  const supabase = createClient();
  const [listings, setListings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("listings")
        .select("*, profiles(display_name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(24);
      setListings(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <p className="text-white/40">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Browse {"{{LISTING_NOUN_PLURAL}}"}</h1>
          <Link href="/" className="text-xs text-white/25 hover:text-white/40">Home</Link>
        </div>
        {listings.length === 0 ? (
          <p className="text-sm text-white/25">No {"{{LISTING_NOUN_PLURAL}}"} available yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map(l => (
              <Link key={l.id as string} href={`/listing/${l.id}`}>
                <div className="rounded-xl p-5 transition-all hover:border-violet-500/30" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 className="font-semibold text-white/90">{l.title as string}</h3>
                  <p className="mt-1 text-xs text-white/30 line-clamp-2">{l.description as string}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: "#8B5CF6" }}>
                      ${((l.price_cents as number) / 100).toFixed(0)}
                    </span>
                    <span className="text-xs text-white/20">{l.category as string}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
