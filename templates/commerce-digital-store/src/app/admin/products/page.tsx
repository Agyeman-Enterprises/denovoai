"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("products")
      .select("id, title, price_cents, status, category, product_type, stock_count, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [supabase]);

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "active" ? "archived" : "active";
    await supabase.from("products").update({ status: next }).eq("id", id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: next } : p));
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/admin" className="text-lg font-bold text-white">{"{{APP_NAME}}"} Admin</Link>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-white/40 hover:text-white/70">Dashboard</Link>
          <Link href="/admin/orders" className="text-sm text-white/40 hover:text-white/70">Orders</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Products</h1>
          <Link href="/admin/products/new" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#8B5CF6" }}>
            New {"{{PRODUCT_NOUN}}"}
          </Link>
        </div>

        {loading && <p className="mt-8 text-sm text-white/30">Loading...</p>}

        {!loading && products.length === 0 && (
          <p className="mt-8 text-sm text-white/30">No products yet. Create your first one.</p>
        )}

        {!loading && products.length > 0 && (
          <div className="mt-6 space-y-2">
            {products.map(p => (
              <div key={p.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{p.title as string}</p>
                    <span className="rounded-md px-1.5 py-0.5 text-[10px]" style={{
                      background: p.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                      color: p.status === "active" ? "#34d399" : "rgba(255,255,255,0.3)",
                    }}>{(p.status as string).toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-white/25">{p.category as string} &middot; {p.product_type as string} &middot; ${((p.price_cents as number) / 100).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleStatus(p.id as string, p.status as string)} className="rounded-md px-3 py-1.5 text-xs text-white/40 hover:text-white" style={{ background: "rgba(255,255,255,0.05)" }}>
                    {p.status === "active" ? "Archive" : "Activate"}
                  </button>
                  <Link href={`/admin/products/${p.id}`} className="rounded-md px-3 py-1.5 text-xs text-white/40 hover:text-white" style={{ background: "rgba(255,255,255,0.05)" }}>
                    Edit
                  </Link>
                  <button onClick={() => deleteProduct(p.id as string)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
