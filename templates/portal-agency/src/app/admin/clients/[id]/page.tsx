import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from("profiles").select("*").eq("id", id).single();
  const { data: projects } = await supabase.from("projects").select("*").eq("client_id", id).order("created_at", { ascending: false });

  if (!client) return <p className="text-white/40">{"{{CLIENT_NOUN}}"} not found.</p>;

  return (
    <div>
      <Link href="/admin/clients" className="text-xs text-white/25 hover:text-white/40">&larr; All {"{{CLIENT_NOUN_PLURAL}}"}</Link>
      <h1 className="mt-4 text-2xl font-bold">{client.display_name || "No name"}</h1>
      <p className="text-sm text-white/40">{client.company_name || ""}</p>

      <h2 className="mt-8 text-lg font-semibold">{"{{SERVICE_NOUN_PLURAL}}"}</h2>
      <div className="mt-4 space-y-2">
        {(projects || []).map((p: Record<string, unknown>) => (
          <Link key={p.id as string} href={`/admin/projects/${p.id}`}>
            <div className="flex justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm">{p.title as string}</p>
              <span className="text-xs text-white/30">{p.status as string}</span>
            </div>
          </Link>
        ))}
        {(!projects || projects.length === 0) && <p className="text-sm text-white/25">No {"{{SERVICE_NOUN_PLURAL}}"} yet.</p>}
      </div>
    </div>
  );
}
