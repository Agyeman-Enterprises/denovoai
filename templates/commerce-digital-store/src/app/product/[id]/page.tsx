"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface CartItem { productId: string; quantity: number; priceCents: number; title: string }

function getCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; }
}
function setCart(items: CartItem[]) { localStorage.setItem("cart", JSON.stringify(items)); }

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { id } = await params;
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("status", "active")
        .single();
      if (!cancelled) {
        setProduct(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params, supabase]);

  const addToCart = () => {
    if (!product) return;
    const cart = getCart();
    const existing = cart.find(i => i.productId === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ productId: product.id as string, quantity: 1, priceCents: product.price_cents as number, title: product.title as string });
    }
    setCart(cart);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center"><div className="text-sm text-white/30">Loading...</div></div>;
  }
  if (!product) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-white/30">{"{{PRODUCT_NOUN}}"} not found.</p>
        <Link href="/shop" className="text-sm text-violet-400 hover:text-violet-300">Back to {"{{STORE_NOUN}}"}</Link>
      </div>
    );
  }

  const imgs = product.images as string[] | null;
  const compare = product.compare_at_price_cents as number | null;

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/shop" className="text-sm text-white/40 hover:text-white/70">Shop</Link>
          <Link href="/cart" className="text-sm text-white/40 hover:text-white/70">Cart</Link>
          <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70">Sign In</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {imgs && imgs.length > 0 && (
          <div className="rounded-xl overflow-hidden aspect-video bg-white/5 mb-8">
            <img src={imgs[0]} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <div className="flex items-start justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{product.title as string}</h1>
            {!!(product.category) ? (
              <span className="mt-3 inline-block rounded-md px-2 py-1 text-xs" style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>
                {product.category as string}
              </span>
            ) : null}
          </div>

          <div className="shrink-0 rounded-xl p-6 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", minWidth: 200 }}>
            <div className="flex items-center justify-center gap-2">
              <p className="text-3xl font-bold text-violet-400">${((product.price_cents as number) / 100).toFixed(2)}</p>
              {compare && compare > (product.price_cents as number) && (
                <span className="text-sm text-white/25 line-through">${(compare / 100).toFixed(2)}</span>
              )}
            </div>
            <button
              onClick={addToCart}
              className="mt-4 w-full rounded-lg py-3 text-sm font-semibold text-white transition-all"
              style={{ background: added ? "#059669" : "#8B5CF6" }}
            >
              {added ? "Added!" : "Add to Cart"}
            </button>
            <Link href="/cart" className="mt-2 block text-xs text-violet-400 hover:text-violet-300">View Cart</Link>
          </div>
        </div>

        {!!(product.description) ? (
          <div className="mt-8">
            <p className="text-white/60 whitespace-pre-wrap">{product.description as string}</p>
          </div>
        ) : null}

        {product.product_type === "digital" ? (
          <div className="mt-8 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs text-white/40">Digital download &mdash; delivered instantly after purchase.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
