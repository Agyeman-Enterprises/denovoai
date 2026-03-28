import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = ["All", "Newsletter", "Tutorial", "Deep Dive", "Case Study", "Interview", "Course"];

export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("content_items")
    .select("id, title, slug, excerpt, category, read_time_minutes, is_pro_only, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  if (params.category && params.category !== "All") {
    query = query.eq("category", params.category);
  }

  const { data: items } = await query;

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-white/40 hover:text-white/70">Pricing</Link>
          <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70">Sign In</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold">Browse {"{{CONTENT_NOUN_PLURAL}}"}</h1>

        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <Link
              key={c}
              href={c === "All" ? "/browse" : `/browse?category=${c}`}
              className="rounded-lg px-3 py-1.5 text-xs transition-colors"
              style={{
                background: (params.category === c || (!params.category && c === "All")) ? "#8B5CF6" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {c}
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(items || []).map((item: Record<string, unknown>) => (
            <Link
              key={item.id as string}
              href={`/${item.slug as string}`}
              className="group rounded-xl overflow-hidden transition-all hover:ring-1 hover:ring-violet-500/30"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-white/30">{item.category as string}</span>
                  {!!(item.is_pro_only) ? (
                    <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}>PRO</span>
                  ) : null}
                </div>
                <h3 className="font-semibold text-sm group-hover:text-violet-300 transition-colors">{item.title as string}</h3>
                {!!(item.excerpt) ? <p className="mt-2 text-xs text-white/30 line-clamp-3">{item.excerpt as string}</p> : null}
                <div className="flex items-center justify-between mt-4">
                  {!!(item.read_time_minutes) ? <span className="text-xs text-white/20">{item.read_time_minutes as number} min read</span> : <span />}
                  <span className="text-xs text-white/20">{new Date(item.published_at as string).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {(!items || items.length === 0) && (
          <div className="mt-12 text-center text-sm text-white/30">No {"{{CONTENT_NOUN_PLURAL}}"} found.</div>
        )}
      </div>
    </div>
  );
}
