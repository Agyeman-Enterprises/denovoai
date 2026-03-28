import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).eq("client_id", user.id).single();
  const { data: deliverables } = await supabase.from("deliverables").select("*").eq("project_id", id).order("created_at", { ascending: false });

  if (!project) return <p className="text-white/40">{"{{SERVICE_NOUN}}"} not found.</p>;

  return (
    <div>
      <Link href="/portal" className="text-xs text-white/25 hover:text-white/40">&larr; Back</Link>
      <h1 className="mt-4 text-2xl font-bold">{project.title}</h1>
      <p className="mt-1 text-sm text-white/40">{project.description}</p>
      <div className="mt-4 flex gap-4 text-sm">
        <span className="text-white/30">Status: <strong className="text-white/70">{project.status}</strong></span>
        {project.due_date && <span className="text-white/30">Due: {new Date(project.due_date).toLocaleDateString()}</span>}
      </div>

      <h2 className="mt-8 text-lg font-semibold">{"{{DELIVERABLE_NOUN}}"}s</h2>
      <div className="mt-4 space-y-2">
        {(!deliverables || deliverables.length === 0) ? (
          <p className="text-sm text-white/25">No {"{{DELIVERABLE_NOUN}}"}s yet.</p>
        ) : (
          deliverables.map((d: Record<string, unknown>) => (
            <div key={d.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p className="text-sm font-medium">{d.title as string}</p>
                <p className="text-xs text-white/25">{d.status as string}</p>
              </div>
              {typeof d.file_url === "string" && (
                <a href={d.file_url as string} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300">Download</a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
