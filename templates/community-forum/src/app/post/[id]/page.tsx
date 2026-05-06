"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();
  const [post, setPost] = useState<Record<string, unknown> | null>(null);
  const [replies, setReplies] = useState<Record<string, unknown>[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reacted, setReacted] = useState(false);
  const [reactionCount, setReactionCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);

      const postRes = await fetch(`/api/posts/${id}`);
      if (postRes.ok) {
        const postData = await postRes.json();
        setPost(postData.post);
        setReactionCount((postData.post.reaction_count as number) || 0);
      }

      const repliesRes = await fetch(`/api/posts/${id}/replies`);
      if (repliesRes.ok) {
        const repliesData = await repliesRes.json();
        setReplies(repliesData.replies || []);
      }

      setLoading(false);
    }
    load();
  }, [id, supabase]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSubmitting(true);

    const res = await fetch(`/api/posts/${id}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyBody }),
    });

    if (res.ok) {
      const data = await res.json();
      setReplies(prev => [...prev, data.reply]);
      setReplyBody("");
    }
    setSubmitting(false);
  };

  const handleReact = async () => {
    const res = await fetch(`/api/posts/${id}/react`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setReacted(data.action === "added");
      setReactionCount(prev => data.action === "added" ? prev + 1 : prev - 1);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center"><p className="text-white/40">Loading...</p></div>;
  if (!post) return <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center"><p className="text-white/40">{"{{POST_NOUN}}"} not found.</p></div>;

  const profile = post.profiles as Record<string, unknown> | null;

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/feed" className="text-sm text-white/40 hover:text-white/70">Feed</Link>
          <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/70">Dashboard</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link href="/feed" className="text-xs text-white/30 hover:text-white/50 mb-4 inline-block">&larr; Back to feed</Link>

        <article className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3 mb-4">
            <Link href={`/profile/${post.author_id}`} className="flex items-center gap-2 hover:opacity-80">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "{{PRIMARY_COLOR}}", opacity: 0.7 }}>
                {profile?.display_name ? (profile.display_name as string).charAt(0).toUpperCase() : "?"}
              </div>
              <span className="text-sm text-white/60">{(profile?.display_name as string) || "Anonymous"}</span>
            </Link>
            <span className="text-[10px] text-white/20">&middot;</span>
            <span className="text-[10px] text-white/20">{new Date(post.created_at as string).toLocaleDateString()}</span>
            {(post.category as string) && <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] text-white/30" style={{ background: "rgba(255,255,255,0.05)" }}>{post.category as string}</span>}
          </div>

          <h1 className="text-xl font-bold mb-4">{post.title as string}</h1>
          <div className="text-sm text-white/60 whitespace-pre-wrap">{post.body as string}</div>

          <div className="mt-6 flex items-center gap-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <button onClick={handleReact} disabled={!currentUser} className={`flex items-center gap-1.5 text-xs transition-colors ${reacted ? "text-red-400" : "text-white/30 hover:text-white/50"} disabled:opacity-30`}>
              <span>{reacted ? "\u2764" : "\u2661"}</span>
              <span>{reactionCount}</span>
            </button>
            <span className="text-xs text-white/20">{replies.length} {replies.length === 1 ? "reply" : "replies"}</span>
          </div>
        </article>

        <section className="mt-8">
          <h2 className="text-lg font-bold mb-4">Replies</h2>

          <div className="space-y-3 mb-6">
            {replies.length === 0 ? (
              <p className="text-xs text-white/25">No replies yet. Be the first to respond.</p>
            ) : (
              replies.map((r: Record<string, unknown>) => {
                const rp = r.profiles as Record<string, unknown> | null;
                return (
                  <div key={r.id as string} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Link href={`/profile/${r.author_id}`} className="flex items-center gap-1.5 hover:opacity-80">
                        <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "{{PRIMARY_COLOR}}", opacity: 0.5 }}>
                          {rp?.display_name ? (rp.display_name as string).charAt(0).toUpperCase() : "?"}
                        </div>
                        <span className="text-xs text-white/40">{(rp?.display_name as string) || "Anonymous"}</span>
                      </Link>
                      <span className="text-[10px] text-white/15">{new Date(r.created_at as string).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-white/50 whitespace-pre-wrap">{r.body as string}</p>
                  </div>
                );
              })
            )}
          </div>

          {currentUser ? (
            <form onSubmit={handleReply} className="space-y-3">
              <textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder="Write a reply..."
                rows={3}
                required
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              <button type="submit" disabled={submitting} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: "{{PRIMARY_COLOR}}" }}>
                {submitting ? "Posting..." : "Post Reply"}
              </button>
            </form>
          ) : (
            <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs text-white/30"><Link href="/auth/login" className="text-violet-400 hover:text-violet-300">Sign in</Link> to reply</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
