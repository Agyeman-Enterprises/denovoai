import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = ["All", "Design", "Development", "Marketing", "Writing", "Consulting", "Finance"];

export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("directory_listings")
    .select("id, name, description, category, logo_url, location, is_featured, view_count")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (params.category && params.category !== "All") {
    query = query.eq("category", params.category);
  }
  if (params.q) {
    query = query.ilike("name", `%${params.q}%`);
  }

  const { data: listings } = await query;

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/submit" className="text-sm text-white/40 hover:text-white/70">Submit</Link>
          <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70">Sign In</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold">Browse {"{{LISTING_NOUN_PLURAL}}"}</h1>

        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <Link key={c} href={c === "All" ? "/browse" : `/browse?category=${c}`} className="rounded-lg px-3 py-1.5 text-xs transition-colors" style={{ background: (params.category === c || (!params.category && c === "All")) ? "#8B5CF6" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {c}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(listings || []).map((l: Record<string, unknown>) => (
            <Link key={l.id as string} href={`/listing/${l.id}`} className="group rounded-xl p-5 transition-all hover:ring-1 hover:ring-violet-500/30" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3 mb-3">
                {!!(l.logo_url) ? (
                  <img src={l.logo_url as string} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-violet-600/20 flex items-center justify-center text-sm font-bold text-violet-400">{(l.name as string).charAt(0)}</div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{l.name as string}</h3>
                    {l.is_featured ? <span className="rounded-md px-1.5 py-0.5 text-[10px] text-amber-400" style={{ background: "rgba(251,191,36,0.1)" }}>Featured</span> : null}
                  </div>
                  <span className="text-[10px] text-white/30">{l.category as string}{!!(l.location) ? ` · ${l.location}` : ""}</span>
                </div>
              </div>
              {!!(l.description) ? <p className="text-xs text-white/40 line-clamp-2">{l.description as string}</p> : null}
              <p className="mt-2 text-[10px] text-white/20">{l.view_count as number} views</p>
            </Link>
          ))}
        </div>

        {(!listings || listings.length === 0) && (
          <div className="mt-12 text-center text-sm text-white/30">No {"{{LISTING_NOUN_PLURAL}}"} found.</div>
        )}
      </div>
    </div>
  );
}
