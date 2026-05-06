"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const CATEGORIES: string[] = ["{{CATEGORIES_ARRAY}}"];

export default function NewPostPage() {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0] || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("You must be signed in."); setLoading(false); return; }

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, category }),
    });

    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Failed to create post");
      setLoading(false);
      return;
    }

    window.location.href = `/post/${result.post.id}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/feed" className="text-sm text-white/40 hover:text-white/70">Feed</Link>
          <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/70">Dashboard</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">New {"{{POST_NOUN}}"}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/40 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder={`Your ${"{{POST_NOUN}}"} title`}
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          <div>
            <label className="block text-sm text-white/40 mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/40 mb-1">Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              required
              rows={8}
              placeholder="Write your post..."
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "{{PRIMARY_COLOR}}" }}
          >
            {loading ? "Publishing..." : `Publish ${"{{POST_NOUN}}"}`}
          </button>
        </form>
      </div>
    </div>
  );
}
