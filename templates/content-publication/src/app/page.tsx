import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = ["Newsletter", "Tutorial", "Deep Dive", "Case Study", "Interview", "Course"];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: featured } = await supabase
    .from("content_items")
    .select("id, title, slug, excerpt, category, read_time_minutes, is_pro_only, published_at")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/browse" className="text-sm text-white/40 hover:text-white/70">Browse</Link>
          <Link href="/pricing" className="text-sm text-white/40 hover:text-white/70">Pricing</Link>
          <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70">Sign In</Link>
          <Link href="/dashboard" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#8B5CF6" }}>
            Dashboard
          </Link>
        </div>
      </nav>

      <section className="px-6 py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold sm:text-6xl">
          {"{{APP_TAGLINE}}"}
        </h1>
        <p className="mt-4 text-lg text-white/40">
          Premium {"{{CONTENT_NOUN_PLURAL}}"} delivered to your inbox.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/browse" className="rounded-lg px-6 py-3 font-semibold text-white" style={{ background: "#8B5CF6" }}>
            Browse {"{{CONTENT_NOUN_PLURAL}}"}
          </Link>
          <Link href="/pricing" className="rounded-lg px-6 py-3 font-semibold text-white/70" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            Subscribe
          </Link>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <Link key={c} href={`/browse?category=${c}`} className="rounded-lg px-4 py-2 text-sm transition-colors hover:border-violet-500/30" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {(featured && featured.length > 0) ? (
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-xl font-bold mb-6">Featured {"{{CONTENT_NOUN_PLURAL}}"}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((item: Record<string, unknown>) => (
                <Link key={item.id as string} href={`/${item.slug as string}`} className="group rounded-xl overflow-hidden transition-all hover:ring-1 hover:ring-violet-500/30" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="aspect-video bg-gradient-to-br from-violet-600/20 to-violet-900/10 flex items-center justify-center">
                    <span className="text-3xl text-white/10">{"{{CONTENT_NOUN}}"}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-white/30">{item.category as string}</span>
                      {!!(item.is_pro_only) ? (
                        <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}>PRO</span>
                      ) : null}
                    </div>
                    <h3 className="font-semibold text-sm">{item.title as string}</h3>
                    {!!(item.excerpt) ? <p className="mt-1 text-xs text-white/30 line-clamp-2">{item.excerpt as string}</p> : null}
                    <div className="flex items-center justify-between mt-3">
                      {!!(item.read_time_minutes) ? <span className="text-xs text-white/20">{item.read_time_minutes as number} min read</span> : <span />}
                      <span className="text-xs text-white/20">{new Date(item.published_at as string).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="px-6 py-8 text-center text-xs text-white/20" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex justify-center gap-4 mb-2">
          <Link href="/api/rss" className="hover:text-white/40">RSS Feed</Link>
        </div>
        {"{{APP_NAME}}"} &mdash; {"{{APP_TAGLINE}}"}
      </footer>
    </div>
  );
}
