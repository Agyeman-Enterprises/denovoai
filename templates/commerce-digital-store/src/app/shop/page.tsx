import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CATEGORIES = ["All", "Templates", "Courses", "eBooks", "Music", "Design Assets", "Software"];

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, title, description, price_cents, compare_at_price_cents, images, category, product_type")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  if (params.category && params.category !== "All") {
    query = query.eq("category", params.category);
  }
  if (params.q) {
    query = query.ilike("title", `%${params.q}%`);
  }

  const { data: products } = await query;

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/cart" className="text-sm text-white/40 hover:text-white/70">Cart</Link>
          <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70">Sign In</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold">{"{{STORE_NOUN}}"}</h1>

        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <Link
              key={c}
              href={c === "All" ? "/shop" : `/shop?category=${c}`}
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
          {(products || []).map((p: Record<string, unknown>) => {
            const imgs = p.images as string[] | null;
            const compare = p.compare_at_price_cents as number | null;
            return (
              <Link key={p.id as string} href={`/product/${p.id}`} className="group rounded-xl overflow-hidden transition-all hover:ring-1 hover:ring-violet-500/30" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {imgs && imgs.length > 0
                  ? <div className="aspect-video bg-white/5 overflow-hidden"><img src={imgs[0]} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" /></div>
                  : <div className="aspect-video bg-gradient-to-br from-violet-600/20 to-violet-900/10" />
                }
                <div className="p-4">
                  <h3 className="font-semibold text-sm">{p.title as string}</h3>
                  {!!(p.description) ? <p className="mt-1 text-xs text-white/40 line-clamp-2">{p.description as string}</p> : null}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-bold text-violet-400">${((p.price_cents as number) / 100).toFixed(2)}</span>
                    {compare && compare > (p.price_cents as number) && (
                      <span className="text-xs text-white/25 line-through">${(compare / 100).toFixed(2)}</span>
                    )}
                  </div>
                  <span className="mt-1 inline-block text-[10px] text-white/20">{p.product_type as string}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {(!products || products.length === 0) && (
          <div className="mt-12 text-center text-sm text-white/30">No {"{{PRODUCT_NOUN_PLURAL}}"} found.</div>
        )}
      </div>
    </div>
  );
}
