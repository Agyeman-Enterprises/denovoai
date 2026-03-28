import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = ["Templates", "Courses", "eBooks", "Music", "Design Assets", "Software"];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: featured } = await supabase
    .from("products")
    .select("id, title, price_cents, images, category")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/shop" className="text-sm text-white/40 hover:text-white/70">Shop</Link>
          <Link href="/cart" className="text-sm text-white/40 hover:text-white/70">Cart</Link>
          <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70">Sign In</Link>
          <Link href="/admin" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#8B5CF6" }}>
            Admin
          </Link>
        </div>
      </nav>

      <section className="px-6 py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold sm:text-6xl">
          {"{{APP_TAGLINE}}"}
        </h1>
        <p className="mt-4 text-lg text-white/40">
          Browse {"{{PRODUCT_NOUN_PLURAL}}"} and get instant delivery.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/shop" className="rounded-lg px-6 py-3 font-semibold text-white" style={{ background: "#8B5CF6" }}>
            Browse {"{{STORE_NOUN}}"}
          </Link>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <Link key={c} href={`/shop?category=${c}`} className="rounded-lg px-4 py-2 text-sm transition-colors hover:border-violet-500/30" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {(featured && featured.length > 0) && (
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-xl font-bold mb-6">Featured {"{{PRODUCT_NOUN_PLURAL}}"}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p: Record<string, unknown>) => {
                const imgs = p.images as string[] | null;
                return (
                  <Link key={p.id as string} href={`/product/${p.id}`} className="group rounded-xl overflow-hidden transition-all hover:ring-1 hover:ring-violet-500/30" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {imgs && imgs.length > 0
                      ? <div className="aspect-video bg-white/5 overflow-hidden"><img src={imgs[0]} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" /></div>
                      : <div className="aspect-video bg-gradient-to-br from-violet-600/20 to-violet-900/10" />
                    }
                    <div className="p-4">
                      <h3 className="font-semibold text-sm">{p.title as string}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-white/30">{p.category as string}</span>
                        <span className="text-sm font-bold text-violet-400">${((p.price_cents as number) / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <footer className="px-6 py-8 text-center text-xs text-white/20" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {"{{APP_NAME}}"} &mdash; {"{{APP_TAGLINE}}"}
      </footer>
    </div>
  );
}
