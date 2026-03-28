import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: pending } = await supabase
    .from("directory_listings")
    .select("id, name, description, category, website_url, created_at, profiles(display_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { count: totalActive } = await supabase.from("directory_listings").select("*", { count: "exact", head: true }).eq("status", "active");
  const { count: totalPending } = await supabase.from("directory_listings").select("*", { count: "exact", head: true }).eq("status", "pending");

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"} Admin</Link>
        <div className="flex items-center gap-4">
          <Link href="/admin/listings" className="text-sm text-white/40 hover:text-white/70">All Listings</Link>
          <Link href="/" className="text-sm text-white/40 hover:text-white/70">View Site</Link>
          <form action="/auth/signout" method="POST"><button type="submit" className="text-xs text-white/20 hover:text-white/40">Sign Out</button></form>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold">Approval Queue</h1>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs text-white/40">Active Listings</p>
            <p className="mt-1 text-2xl font-bold">{totalActive ?? 0}</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs text-white/40">Pending Review</p>
            <p className="mt-1 text-2xl font-bold text-amber-400">{totalPending ?? 0}</p>
          </div>
        </div>

        <h2 className="mt-8 text-sm font-semibold text-white/60 mb-3">Pending Submissions</h2>
        {(!pending || pending.length === 0) && <p className="text-xs text-white/25">No pending submissions.</p>}

        <div className="space-y-3">
          {(pending || []).map((l: Record<string, unknown>) => (
            <div key={l.id as string} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{l.name as string}</h3>
                  <p className="text-xs text-white/30">{l.category as string} &middot; Submitted by {(l.profiles as Record<string, unknown>)?.display_name as string || "Unknown"}</p>
                  {!!(l.description) ? <p className="mt-2 text-sm text-white/50">{l.description as string}</p> : null}
                  {!!(l.website_url) ? <a href={l.website_url as string} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-violet-400">{l.website_url as string}</a> : null}
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <form action={`/api/admin/approve`} method="POST">
                    <input type="hidden" name="id" value={l.id as string} />
                    <input type="hidden" name="action" value="approve" />
                    <button type="submit" className="rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ background: "#059669" }}>Approve</button>
                  </form>
                  <form action={`/api/admin/approve`} method="POST">
                    <input type="hidden" name="id" value={l.id as string} />
                    <input type="hidden" name="action" value="reject" />
                    <button type="submit" className="rounded-lg px-4 py-2 text-xs font-semibold text-red-400" style={{ border: "1px solid rgba(239,68,68,0.3)" }}>Reject</button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
