"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminContentPage() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("content_items")
      .select("id, title, slug, status, category, is_pro_only, is_featured, read_time_minutes, published_at, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [supabase]);

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "published" ? "draft" : "published";
    const update: Record<string, unknown> = { status: next };
    if (next === "published") update.published_at = new Date().toISOString();
    await supabase.from("content_items").update(update).eq("id", id);
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: next, ...(next === "published" ? { published_at: new Date().toISOString() } : {}) } : item));
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this content?")) return;
    await supabase.from("content_items").delete().eq("id", id);
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/admin" className="text-lg font-bold text-white">{"{{APP_NAME}}"} Admin</Link>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-white/40 hover:text-white/70">Dashboard</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">All {"{{CONTENT_NOUN_PLURAL}}"}</h1>
          <Link href="/admin/content/new" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#8B5CF6" }}>
            New {"{{CONTENT_NOUN}}"}
          </Link>
        </div>

        {loading ? <p className="mt-8 text-sm text-white/30">Loading...</p> : null}

        {!loading && items.length === 0 ? (
          <p className="mt-8 text-sm text-white/30">No content yet. Create your first {"{{CONTENT_NOUN}}"}.</p>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="mt-6 space-y-2">
            {items.map(item => (
              <div key={item.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{item.title as string}</p>
                    <span className="rounded-md px-1.5 py-0.5 text-[10px]" style={{
                      background: item.status === "published" ? "rgba(16,185,129,0.15)" : item.status === "draft" ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.05)",
                      color: item.status === "published" ? "#34d399" : item.status === "draft" ? "#facc15" : "rgba(255,255,255,0.3)",
                    }}>{(item.status as string).toUpperCase()}</span>
                    {!!(item.is_pro_only) ? (
                      <span className="rounded-md px-1.5 py-0.5 text-[10px]" style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}>PRO</span>
                    ) : null}
                    {!!(item.is_featured) ? (
                      <span className="rounded-md px-1.5 py-0.5 text-[10px]" style={{ background: "rgba(234,179,8,0.15)", color: "#facc15" }}>FEATURED</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-white/25">
                    {item.category as string}
                    {!!(item.read_time_minutes) ? <> &middot; {item.read_time_minutes as number} min</> : null}
                    {!!(item.published_at) ? <> &middot; {new Date(item.published_at as string).toLocaleDateString()}</> : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleStatus(item.id as string, item.status as string)} className="rounded-md px-3 py-1.5 text-xs text-white/40 hover:text-white" style={{ background: "rgba(255,255,255,0.05)" }}>
                    {item.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => deleteItem(item.id as string)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
