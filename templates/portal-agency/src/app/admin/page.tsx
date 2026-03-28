import { createClient } from "@/lib/supabase/server";

export default async function AdminOverview() {
  const supabase = await createClient();

  const { count: clientCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "client");
  const { count: projectCount } = await supabase.from("projects").select("*", { count: "exact", head: true });
  const { count: activeCount } = await supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "active");

  return (
    <div>
      <h1 className="text-2xl font-bold">{"{{PROVIDER_NOUN}}"} Dashboard</h1>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/40">{"{{CLIENT_NOUN_PLURAL}}"}</p>
          <p className="mt-1 text-2xl font-bold">{clientCount ?? 0}</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/40">Total {"{{SERVICE_NOUN_PLURAL}}"}</p>
          <p className="mt-1 text-2xl font-bold">{projectCount ?? 0}</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/40">Active</p>
          <p className="mt-1 text-2xl font-bold">{activeCount ?? 0}</p>
        </div>
      </div>
      <form action="/auth/signout" method="POST" className="mt-8">
        <button type="submit" className="text-xs text-white/25 hover:text-white/40">Sign Out</button>
      </form>
    </div>
  );
}
