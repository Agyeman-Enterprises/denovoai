import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { count: totalRecords } = await supabase.from("records").select("*", { count: "exact", head: true }).eq("is_archived", false);
  const { data: recentActivity } = await supabase.from("activity_log").select("*, profiles(display_name)").order("created_at", { ascending: false }).limit(10);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/40">Total {"{{PRIMARY_ENTITY_PLURAL}}"}</p>
          <p className="mt-1 text-2xl font-bold">{totalRecords ?? 0}</p>
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-white/60 mb-3">Recent Activity</h2>
      <div className="space-y-1">
        {(recentActivity || []).map((a: Record<string, unknown>) => (
          <div key={a.id as string} className="flex justify-between rounded-lg p-3 text-sm" style={{ background: "rgba(255,255,255,0.02)" }}>
            <span className="text-white/70">{a.action as string}</span>
            <span className="text-xs text-white/25">{new Date(a.created_at as string).toLocaleString()}</span>
          </div>
        ))}
        {(!recentActivity || recentActivity.length === 0) && <p className="text-xs text-white/25">No activity yet.</p>}
      </div>
    </div>
  );
}
