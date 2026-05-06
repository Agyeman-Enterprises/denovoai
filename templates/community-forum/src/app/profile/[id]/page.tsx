import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, created_at")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, category, created_at")
    .eq("author_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/feed" className="text-sm text-white/40 hover:text-white/70">Feed</Link>
          <Link href="/members" className="text-sm text-white/40 hover:text-white/70">{"{{MEMBER_NOUN_PLURAL}}"}</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link href="/members" className="text-xs text-white/30 hover:text-white/50 mb-4 inline-block">&larr; All {"{{MEMBER_NOUN_PLURAL}}"}</Link>

        <div className="rounded-xl p-6 mb-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: "{{PRIMARY_COLOR}}", opacity: 0.7 }}>
              {(profile.display_name as string)?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="text-xl font-bold">{(profile.display_name as string) || "Anonymous"}</h1>
              <p className="text-xs text-white/30">Joined {new Date(profile.created_at as string).toLocaleDateString()}</p>
            </div>
          </div>
          {profile.bio && <p className="mt-4 text-sm text-white/50">{profile.bio as string}</p>}
        </div>

        <h2 className="text-lg font-bold mb-4">{"{{POST_NOUN_PLURAL}}"} by {(profile.display_name as string) || "this member"}</h2>
        <div className="space-y-2">
          {(posts || []).length === 0 ? (
            <p className="text-xs text-white/25">No {"{{POST_NOUN_PLURAL}}"} yet.</p>
          ) : (
            (posts || []).map((p: Record<string, unknown>) => (
              <Link key={p.id as string} href={`/post/${p.id}`} className="block rounded-xl p-4 transition-all hover:ring-1 hover:ring-violet-500/30" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-medium">{p.title as string}</h3>
                <div className="mt-1 flex items-center gap-2">
                  {(p.category as string) && <span className="text-[10px] text-white/30">{p.category as string}</span>}
                  <span className="text-[10px] text-white/20">{new Date(p.created_at as string).toLocaleDateString()}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
