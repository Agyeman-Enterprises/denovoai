"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = ["Design", "Development", "Marketing", "Writing", "Consulting", "Finance"];

export default function SubmitPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "", category: CATEGORIES[0], website_url: "", location: "", tags: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth/login"; return; }

    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);

    const { error: err } = await supabase.from("directory_listings").insert({
      submitter_id: user.id,
      name: form.name,
      description: form.description,
      category: form.category,
      website_url: form.website_url || null,
      location: form.location || null,
      tags,
      status: "pending",
    });

    if (err) { setError(err.message); setSaving(false); }
    else router.push("/dashboard");
  };

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <Link href="/browse" className="text-sm text-white/40 hover:text-white/70">Browse</Link>
      </nav>

      <div className="mx-auto max-w-lg px-6 py-12">
        <h1 className="text-2xl font-bold">Submit a {"{{LISTING_NOUN}}"}</h1>
        <p className="mt-2 text-sm text-white/40">Your submission will be reviewed before appearing in the directory.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1">Name</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} required className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
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
              <label className="block text-xs text-white/40 mb-1">Location</label>
              <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. San Francisco" className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Website URL</label>
            <input value={form.website_url} onChange={e => set("website_url", e.target.value)} placeholder="https://..." className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="e.g. react, nextjs, tailwind" className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="submit" disabled={saving} className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50" style={{ background: "#8B5CF6" }}>
            {saving ? "Submitting..." : "Submit for Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
