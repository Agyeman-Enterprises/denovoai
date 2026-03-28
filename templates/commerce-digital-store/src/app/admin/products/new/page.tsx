"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const PRODUCT_TYPES = ["digital", "physical", "subscription"];
const CATEGORIES = ["Templates", "Courses", "eBooks", "Music", "Design Assets", "Software"];

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    product_type: PRODUCT_TYPES[0],
    price: "",
    compare_at_price: "",
    download_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const priceCents = Math.round(parseFloat(form.price) * 100);
    if (isNaN(priceCents) || priceCents < 1) {
      setError("Price must be at least $0.01");
      setSaving(false);
      return;
    }

    const compareCents = form.compare_at_price ? Math.round(parseFloat(form.compare_at_price) * 100) : null;

    const { error: err } = await supabase.from("products").insert({
      title: form.title,
      description: form.description,
      category: form.category,
      product_type: form.product_type,
      price_cents: priceCents,
      compare_at_price_cents: compareCents,
      download_url: form.download_url || null,
      status: "active",
    });

    if (err) {
      setError(err.message);
      setSaving(false);
    } else {
      router.push("/admin/products");
    }
  };

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/admin/products" className="text-lg font-bold text-white">&larr; Products</Link>
      </nav>

      <div className="mx-auto max-w-lg px-6 py-12">
        <h1 className="text-2xl font-bold">New {"{{PRODUCT_NOUN}}"}</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1">Title</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} required className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-1">Category</label>
              <select value={form.category} onChange={e => set("category", e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Type</label>
              <select value={form.product_type} onChange={e => set("product_type", e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-1">Price ($)</label>
              <input type="number" step="0.01" min="0.01" value={form.price} onChange={e => set("price", e.target.value)} required className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Compare at ($)</label>
              <input type="number" step="0.01" min="0" value={form.compare_at_price} onChange={e => set("compare_at_price", e.target.value)} placeholder="Optional" className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
          </div>
          {form.product_type === "digital" && (
            <div>
              <label className="block text-xs text-white/40 mb-1">Download URL</label>
              <input value={form.download_url} onChange={e => set("download_url", e.target.value)} placeholder="https://..." className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="submit" disabled={saving} className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50" style={{ background: "#8B5CF6" }}>
            {saving ? "Creating..." : "Create Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
