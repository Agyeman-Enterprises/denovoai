import { createClient } from "@/lib/supabase/server";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase.from("profiles").select("*").eq("id", id).single();
  const { data: sub } = await supabase.from("subscriptions").select("plan_id, status").eq("user_id", id).single();
  const { data: logs } = await supabase.from("audit_logs").select("*").eq("entity_id", id).order("created_at", { ascending: false }).limit(20);

  if (!user) return <p className="text-white/40">User not found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">{(user.display_name as string) || "No name"}</h1>
      <p className="text-xs text-white/25 font-mono mt-1">{id}</p>

      <div className="mt-6 space-y-3">
        <Row label="Role" value={user.role as string} />
        <Row label="Plan" value={sub?.plan_id || "free"} />
        <Row label="Sub Status" value={sub?.status || "none"} />
        <Row label="Joined" value={new Date(user.created_at as string).toLocaleDateString()} />
      </div>

      <h2 className="text-sm font-semibold text-white/60 mt-8 mb-3">Activity Log</h2>
      <div className="space-y-1">
        {(logs || []).map((l: Record<string, unknown>) => (
          <div key={l.id as string} className="flex justify-between rounded-lg p-3 text-sm" style={{ background: "rgba(255,255,255,0.02)" }}>
            <span className="text-white/70">{l.action as string}</span>
            <span className="text-xs text-white/25">{new Date(l.created_at as string).toLocaleString()}</span>
          </div>
        ))}
        {(!logs || logs.length === 0) && <p className="text-xs text-white/25">No activity for this user.</p>}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
      <span className="text-white/40">{label}</span>
      <span className="text-white/80">{value}</span>
    </div>
  );
}
