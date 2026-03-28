import { createClient } from "@/lib/supabase/server";

export default async function PortalDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold">Your {"{{SERVICE_NOUN_PLURAL}}"}</h1>
      <div className="mt-6 space-y-3">
        {(!projects || projects.length === 0) ? (
          <p className="text-sm text-white/25">No {"{{SERVICE_NOUN_PLURAL}}"} yet.</p>
        ) : (
          projects.map((p: Record<string, unknown>) => (
            <a key={p.id as string} href={`/portal/projects/${p.id}`}>
              <div className="flex items-center justify-between rounded-xl p-4 transition-all hover:border-indigo-500/30" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <p className="text-sm font-medium">{p.title as string}</p>
                  <p className="text-xs text-white/25">{p.status as string}</p>
                </div>
                {typeof p.due_date === "string" && <span className="text-xs text-white/20">Due {new Date(p.due_date as string).toLocaleDateString()}</span>}
              </div>
            </a>
          ))
        )}
      </div>
      <form action="/auth/signout" method="POST" className="mt-8">
        <button type="submit" className="text-xs text-white/25 hover:text-white/40">Sign Out</button>
      </form>
    </div>
  );
}
