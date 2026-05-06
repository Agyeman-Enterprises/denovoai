import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES: string[] = ["{{CATEGORIES_ARRAY}}"];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id, title, category, created_at, profiles(display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/feed" className="text-sm text-white/40 hover:text-white/70">Feed</Link>
          <Link href="/members" className="text-sm text-white/40 hover:text-white/70">{"{{MEMBER_NOUN_PLURAL}}"}</Link>
          <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70">Sign In</Link>
          <Link href="/post/new" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "{{PRIMARY_COLOR}}" }}>
            New {"{{POST_NOUN}}"}
          </Link>
        </div>
      </nav>

      <section className="px-6 py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold sm:text-6xl">
          Welcome to the {"{{COMMUNITY_NOUN}}"}.
        </h1>
        <p className="mt-4 text-lg text-white/40">{"{{APP_TAGLINE}}"}</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/feed" className="rounded-lg px-6 py-3 font-semibold text-white" style={{ background: "{{PRIMARY_COLOR}}" }}>
            Browse {"{{POST_NOUN_PLURAL}}"}
          </Link>
          <Link href="/upgrade" className="rounded-lg px-6 py-3 font-semibold text-white/70" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            Go Pro
          </Link>
        </div>
      </section>

      {(recentPosts && recentPosts.length > 0) && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-xl font-bold mb-6">Recent {"{{POST_NOUN_PLURAL}}"}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((p: Record<string, unknown>) => {
                const profile = p.profiles as Record<string, unknown> | null;
                return (
                  <Link key={p.id as string} href={`/post/${p.id}`} className="group rounded-xl p-5 transition-all hover:ring-1 hover:ring-violet-500/30" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "{{PRIMARY_COLOR}}", opacity: 0.7 }}>
                        {profile?.display_name ? (profile.display_name as string).charAt(0).toUpperCase() : "?"}
                      </div>
                      <span className="text-xs text-white/40">{(profile?.display_name as string) || "Anonymous"}</span>
                      <span className="ml-auto text-[10px] text-white/20">{p.category as string}</span>
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2">{p.title as string}</h3>
                    <p className="mt-2 text-[10px] text-white/20">{new Date(p.created_at as string).toLocaleDateString()}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <Link key={c} href={`/feed?category=${c}`} className="rounded-lg px-4 py-2 text-sm transition-colors hover:border-violet-500/30" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 text-center">
        <div className="mx-auto max-w-md rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-lg font-bold">Join the {"{{COMMUNITY_NOUN}}"}</h2>
          <p className="mt-2 text-sm text-white/40">Share knowledge, ask questions, and connect with {"{{MEMBER_NOUN_PLURAL}}"}.</p>
          <Link href="/auth/login" className="mt-4 inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white" style={{ background: "{{PRIMARY_COLOR}}" }}>
            Get Started
          </Link>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-white/20" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {"{{APP_NAME}}"} &mdash; {"{{APP_TAGLINE}}"}
      </footer>
    </div>
  );
}
