import { createClient } from "@/lib/supabase/server";

export default async function AdminOverview() {
  const supabase = await createClient();

  const [{ count: userCount }, { count: activeSubs }, { data: recentUsers }, { data: recentLogs }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("profiles").select("id, display_name, role, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("audit_logs").select("id, action, entity_type, created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Total Users" value={userCount ?? 0} />
        <Stat label="Active Subscriptions" value={activeSubs ?? 0} />
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-white/60 mb-3">Recent Users</h2>
          <div className="space-y-1">
            {(recentUsers || []).map((u: Record<string, unknown>) => (
              <div key={u.id as string} className="flex items-center justify-between rounded-lg p-3 text-sm" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-white/70">{(u.display_name as string) || "—"}</span>
                <span className="text-xs text-white/25">{u.role as string}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white/60 mb-3">Recent Activity</h2>
          <div className="space-y-1">
            {(recentLogs || []).map((l: Record<string, unknown>) => (
              <div key={l.id as string} className="flex items-center justify-between rounded-lg p-3 text-sm" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-white/70">{l.action as string}</span>
                <span className="text-xs text-white/25">{new Date(l.created_at as string).toLocaleDateString()}</span>
              </div>
            ))}
            {(!recentLogs || recentLogs.length === 0) && <p className="text-xs text-white/25">No activity yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
