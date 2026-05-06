import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { count: totalPosts } = await supabase.from("posts").select("*", { count: "exact", head: true });
  const { count: totalMembers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: flaggedPosts } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "flagged");

  const { data: flaggedItems } = await supabase
    .from("posts")
    .select("id, title, category, status, created_at, author_id, profiles(display_name)")
    .in("status", ["flagged", "reported"])
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"} Admin</Link>
        <div className="flex items-center gap-4">
          <Link href="/feed" className="text-sm text-white/40 hover:text-white/70">Feed</Link>
          <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/70">Dashboard</Link>
          <form action="/auth/signout" method="POST"><button type="submit" className="text-xs text-white/20 hover:text-white/40">Sign Out</button></form>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold">Moderation Queue</h1>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total Posts", value: totalPosts ?? 0 },
            { label: "Members", value: totalMembers ?? 0 },
            { label: "Flagged", value: flaggedPosts ?? 0 },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs text-white/40">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-white/60 mb-4">Flagged {"{{POST_NOUN_PLURAL}}"}</h2>

          <div className="space-y-1">
            {(flaggedItems || []).map((item: Record<string, unknown>) => {
              const authorProfile = item.profiles as Record<string, unknown> | null;
              return (
                <div key={item.id as string} className="flex items-center justify-between rounded-lg p-3 text-sm" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div>
                    <Link href={`/post/${item.id}`} className="text-white/70 hover:text-violet-400">{item.title as string}</Link>
                    <span className="ml-3 text-xs text-white/25">by {(authorProfile?.display_name as string) || "Anonymous"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-md px-1.5 py-0.5 text-[10px]" style={{
                      background: "rgba(234,179,8,0.15)",
                      color: "#facc15",
                    }}>{(item.status as string).toUpperCase()}</span>
                    <span className="text-xs text-white/20">{new Date(item.created_at as string).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
            {(!flaggedItems || flaggedItems.length === 0) && <p className="text-xs text-white/25">No flagged {"{{POST_NOUN_PLURAL}}"}. All clear.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
