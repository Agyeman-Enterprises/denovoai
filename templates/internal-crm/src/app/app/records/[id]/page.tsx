import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: record } = await supabase.from("records").select("*, profiles(display_name)").eq("id", id).single();
  const { data: related } = await supabase.from("related_records").select("*").eq("record_id", id).order("created_at", { ascending: false });
  const { data: activity } = await supabase.from("activity_log").select("*, profiles(display_name)").eq("record_id", id).order("created_at", { ascending: false }).limit(20);

  if (!record) return <p className="text-white/40">{"{{PRIMARY_ENTITY}}"} not found.</p>;

  return (
    <div>
      <Link href="/app/records" className="text-xs text-white/25 hover:text-white/40">&larr; All {"{{PRIMARY_ENTITY_PLURAL}}"}</Link>
      <h1 className="mt-4 text-2xl font-bold">{record.title}</h1>
      <div className="mt-2 flex gap-4 text-sm text-white/30">
        <span>Status: <strong className="text-white/70">{record.status}</strong></span>
        <span>Priority: <strong className={`${record.priority === "high" || record.priority === "urgent" ? "text-red-400" : "text-white/70"}`}>{record.priority}</strong></span>
      </div>

      {record.data && Object.keys(record.data as Record<string, unknown>).length > 0 && (
        <div className="mt-6 rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-sm font-semibold text-white/60 mb-3">Details</h3>
          <pre className="text-xs text-white/30 overflow-auto max-h-32">{JSON.stringify(record.data, null, 2)}</pre>
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold text-white/60 mb-3">Related {"{{SECONDARY_ENTITY_PLURAL}}"}</h2>
      <div className="space-y-1">
        {(related || []).map((r: Record<string, unknown>) => (
          <div key={r.id as string} className="flex justify-between rounded-lg p-3 text-sm" style={{ background: "rgba(255,255,255,0.02)" }}>
            <span className="text-white/70">{r.title as string}</span>
            <span className="text-xs text-white/25">{r.status as string}</span>
          </div>
        ))}
        {(!related || related.length === 0) && <p className="text-xs text-white/25">None yet.</p>}
      </div>

      <h2 className="mt-8 text-sm font-semibold text-white/60 mb-3">Activity</h2>
      <div className="space-y-1">
        {(activity || []).map((a: Record<string, unknown>) => (
          <div key={a.id as string} className="flex justify-between rounded-lg p-3 text-sm" style={{ background: "rgba(255,255,255,0.02)" }}>
            <span className="text-white/70">{a.action as string}</span>
            <span className="text-xs text-white/25">{new Date(a.created_at as string).toLocaleString()}</span>
          </div>
        ))}
        {(!activity || activity.length === 0) && <p className="text-xs text-white/25">No activity yet.</p>}
      </div>
    </div>
  );
}
