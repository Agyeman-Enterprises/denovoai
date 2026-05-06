import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES: string[] = ["{{CATEGORIES_ARRAY}}"];

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("id, title, body, category, created_at, author_id, profiles(display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (sp.category) query = query.eq("category", sp.category);
  if (sp.q) query = query.ilike("title", `%${sp.q}%`);

  const { data: posts } = await query;

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/feed" className="text-sm text-white/70 font-medium">Feed</Link>
          <Link href="/members" className="text-sm text-white/40 hover:text-white/70">{"{{MEMBER_NOUN_PLURAL}}"}</Link>
          <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/70">Dashboard</Link>
          <Link href="/post/new" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "{{PRIMARY_COLOR}}" }}>
            New {"{{POST_NOUN}}"}
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{"{{POST_NOUN_PLURAL}}"}</h1>
        </div>

        <form action="/feed" method="GET" className="mb-6">
          <input
            type="text"
            name="q"
            placeholder={`Search ${"{{POST_NOUN_PLURAL}}"}...`}
            defaultValue={sp.q || ""}
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </form>

        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/feed"
            className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${!sp.category ? "text-white" : "text-white/40 hover:text-white/70"}`}
            style={{ background: !sp.category ? "{{PRIMARY_COLOR}}" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            All
          </Link>
          {CATEGORIES.map(c => (
            <Link
              key={c}
              href={`/feed?category=${c}`}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${sp.category === c ? "text-white" : "text-white/40 hover:text-white/70"}`}
              style={{ background: sp.category === c ? "{{PRIMARY_COLOR}}" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {c}
            </Link>
          ))}
        </div>

        <div className="space-y-3">
          {(posts || []).length === 0 ? (
            <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm text-white/25">No {"{{POST_NOUN_PLURAL}}"} found.</p>
            </div>
          ) : (
            (posts || []).map((p: Record<string, unknown>) => {
              const profile = p.profiles as Record<string, unknown> | null;
              return (
                <Link key={p.id as string} href={`/post/${p.id}`} className="block rounded-xl p-5 transition-all hover:ring-1 hover:ring-violet-500/30" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "{{PRIMARY_COLOR}}", opacity: 0.7 }}>
                      {profile?.display_name ? (profile.display_name as string).charAt(0).toUpperCase() : "?"}
                    </div>
                    <span className="text-xs text-white/40">{(profile?.display_name as string) || "Anonymous"}</span>
                    <span className="text-[10px] text-white/20">&middot;</span>
                    <span className="text-[10px] text-white/20">{new Date(p.created_at as string).toLocaleDateString()}</span>
                    {(p.category as string) && <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] text-white/30" style={{ background: "rgba(255,255,255,0.05)" }}>{p.category as string}</span>}
                  </div>
                  <h3 className="font-semibold text-sm">{p.title as string}</h3>
                  {(p.body as string) && <p className="mt-1 text-xs text-white/30 line-clamp-2">{p.body as string}</p>}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
