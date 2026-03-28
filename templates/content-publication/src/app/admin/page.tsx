import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { count: totalContent } = await supabase.from("content_items").select("*", { count: "exact", head: true });
  const { count: publishedContent } = await supabase.from("content_items").select("*", { count: "exact", head: true }).eq("status", "published");
  const { count: totalSubscribers } = await supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active");

  const { data: recentItems } = await supabase
    .from("content_items")
    .select("id, title, slug, status, category, published_at, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"} Admin</Link>
        <div className="flex items-center gap-4">
          <Link href="/admin/content" className="text-sm text-white/40 hover:text-white/70">Content</Link>
          <Link href="/admin/content/new" className="text-sm text-white/40 hover:text-white/70">New</Link>
          <Link href="/" className="text-sm text-white/40 hover:text-white/70">View Site</Link>
          <form action="/auth/signout" method="POST"><button type="submit" className="text-xs text-white/20 hover:text-white/40">Sign Out</button></form>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold">Content Dashboard</h1>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total Content", value: totalContent ?? 0 },
            { label: "Published", value: publishedContent ?? 0 },
            { label: "Active Subscribers", value: totalSubscribers ?? 0 },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs text-white/40">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/60">Recent {"{{CONTENT_NOUN_PLURAL}}"}</h2>
          <Link href="/admin/content" className="text-xs text-violet-400 hover:text-violet-300">View All</Link>
        </div>

        <div className="mt-3 space-y-1">
          {(recentItems || []).map((item: Record<string, unknown>) => (
            <div key={item.id as string} className="flex items-center justify-between rounded-lg p-3 text-sm" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div>
                <span className="text-white/70">{item.title as string}</span>
                <span className="ml-3 text-xs text-white/25">{item.category as string}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-md px-1.5 py-0.5 text-[10px]" style={{
                  background: item.status === "published" ? "rgba(16,185,129,0.15)" : item.status === "draft" ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.05)",
                  color: item.status === "published" ? "#34d399" : item.status === "draft" ? "#facc15" : "rgba(255,255,255,0.3)",
                }}>{(item.status as string).toUpperCase()}</span>
                {!!(item.published_at) ? (
                  <span className="text-xs text-white/20">{new Date(item.published_at as string).toLocaleDateString()}</span>
                ) : null}
              </div>
            </div>
          ))}
          {(!recentItems || recentItems.length === 0) ? <p className="text-xs text-white/25">No content yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
