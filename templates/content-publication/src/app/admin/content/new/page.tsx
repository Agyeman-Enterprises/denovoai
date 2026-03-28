"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = ["Newsletter", "Tutorial", "Deep Dive", "Case Study", "Interview", "Course"];
const STATUSES = ["draft", "published", "archived"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewContentPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    category: CATEGORIES[0],
    status: "draft",
    is_pro_only: false,
  });

  const handleTitleChange = (title: string) => {
    setForm(f => ({ ...f, title, slug: slugify(title) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt || null,
      body: form.body,
      category: form.category,
      status: form.status,
      is_pro_only: form.is_pro_only,
    };

    if (form.status === "published") {
      payload.published_at = new Date().toISOString();
    }

    const { error: err } = await supabase.from("content_items").insert(payload);

    if (err) {
      setError(err.message);
      setSaving(false);
    } else {
      router.push("/admin/content");
    }
  };

  const set = (key: string, val: string | boolean) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/admin/content" className="text-lg font-bold text-white">&larr; Content</Link>
      </nav>

      <div className="mx-auto max-w-lg px-6 py-12">
        <h1 className="text-2xl font-bold">New {"{{CONTENT_NOUN}}"}</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1">Title</label>
            <input value={form.title} onChange={e => handleTitleChange(e.target.value)} required className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Slug</label>
            <input value={form.slug} onChange={e => set("slug", e.target.value)} required className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Excerpt</label>
            <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)} rows={2} placeholder="Brief summary..." className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Body</label>
            <textarea value={form.body} onChange={e => set("body", e.target.value)} rows={12} required className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-1">Category</label>
              <select value={form.category} onChange={e => set("category", e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_pro_only"
              checked={form.is_pro_only}
              onChange={e => set("is_pro_only", e.target.checked)}
              className="h-4 w-4 rounded accent-violet-500"
            />
            <label htmlFor="is_pro_only" className="text-sm text-white/50">Pro-only content (requires subscription)</label>
          </div>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <button type="submit" disabled={saving} className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50" style={{ background: "#8B5CF6" }}>
            {saving ? "Creating..." : "Create Content"}
          </button>
        </form>
      </div>
    </div>
  );
}
