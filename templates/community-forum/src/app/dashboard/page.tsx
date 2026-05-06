import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, category, status, created_at")
    .eq("author_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My {"{{POST_NOUN_PLURAL}}"}</h1>
        <Link href="/post/new" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "{{PRIMARY_COLOR}}" }}>
          New {"{{POST_NOUN}}"}
        </Link>
      </div>

      <div className="space-y-2">
        {(!posts || posts.length === 0) ? (
          <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm text-white/30">You haven&apos;t created any {"{{POST_NOUN_PLURAL}}"} yet.</p>
            <Link href="/post/new" className="mt-2 inline-block text-sm text-violet-400 hover:text-violet-300">Create your first {"{{POST_NOUN}}"}</Link>
          </div>
        ) : (
          posts.map((p: Record<string, unknown>) => (
            <div key={p.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <Link href={`/post/${p.id}`} className="text-sm font-medium hover:text-violet-400">{p.title as string}</Link>
                <div className="mt-1 flex items-center gap-2">
                  {(p.category as string) && <span className="text-[10px] text-white/30">{p.category as string}</span>}
                  <span className="text-[10px] text-white/20">{new Date(p.created_at as string).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/post/${p.id}`} className="rounded-md px-2 py-1 text-xs text-white/30 hover:text-white/60" style={{ background: "rgba(255,255,255,0.05)" }}>
                  View
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
