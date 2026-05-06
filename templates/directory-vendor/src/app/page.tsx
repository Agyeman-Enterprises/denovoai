import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = ["Design", "Development", "Marketing", "Writing", "Consulting", "Finance"];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: featured } = await supabase
    .from("directory_listings")
    .select("id, name, description, category, logo_url, website_url")
    .eq("status", "active")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/browse" className="text-sm text-white/40 hover:text-white/70">Browse</Link>
          <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70">Sign In</Link>
          <Link href="/submit" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#8B5CF6" }}>
            Submit {"{{LISTING_NOUN}}"}
          </Link>
        </div>
      </nav>

      <section className="px-6 py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold sm:text-6xl">
          Find the best {"{{LISTING_NOUN_PLURAL}}"}.
        </h1>
        <p className="mt-4 text-lg text-white/40">{"{{APP_TAGLINE}}"}</p>
        <div className="mt-8 flex justify-center">
          <Link href="/browse" className="rounded-lg px-6 py-3 font-semibold text-white" style={{ background: "#8B5CF6" }}>
            Browse {"{{LISTING_NOUN_PLURAL}}"}
          </Link>
        </div>
      </section>

      {(featured && featured.length > 0) && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-xl font-bold mb-6">Featured {"{{LISTING_NOUN_PLURAL}}"}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((l: Record<string, unknown>) => (
                <Link key={l.id as string} href={`/listing/${l.id}`} className="group rounded-xl p-5 transition-all hover:ring-1 hover:ring-violet-500/30" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    {!!(l.logo_url) ? (
                      <Image src={l.logo_url as string} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" unoptimized />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-violet-600/20 flex items-center justify-center text-sm font-bold text-violet-400">{(l.name as string).charAt(0)}</div>
                    )}
                    <div>
                      <h3 className="font-semibold text-sm">{l.name as string}</h3>
                      <span className="text-[10px] text-white/30">{l.category as string}</span>
                    </div>
                  </div>
                  {!!(l.description) ? <p className="text-xs text-white/40 line-clamp-2">{l.description as string}</p> : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-6 pb-16">
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

      <section className="px-6 pb-16 text-center">
        <div className="mx-auto max-w-md rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-lg font-bold">List your {"{{LISTING_NOUN}}"}</h2>
          <p className="mt-2 text-sm text-white/40">Get discovered by thousands of potential clients.</p>
          <Link href="/submit" className="mt-4 inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white" style={{ background: "#8B5CF6" }}>
            Submit {"{{LISTING_NOUN}}"}
          </Link>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-white/20" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {"{{APP_NAME}}"} &mdash; {"{{APP_TAGLINE}}"}
      </footer>
    </div>
  );
}
