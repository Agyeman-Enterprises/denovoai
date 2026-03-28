"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FilesPage() {
  const supabase = createClient();
  const [files, setFiles] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: projects } = await supabase.from("projects").select("id").eq("client_id", user.id);
      if (!projects?.length) return;
      const ids = projects.map(p => p.id);
      const { data } = await supabase.from("deliverables").select("*").in("project_id", ids).order("created_at", { ascending: false });
      setFiles(data || []);
    }
    load();
  }, [supabase]);

  return (
    <div>
      <h1 className="text-2xl font-bold">All Files</h1>
      <div className="mt-6 space-y-2">
        {files.length === 0 ? (
          <p className="text-sm text-white/25">No files yet.</p>
        ) : (
          files.map(f => (
            <div key={f.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm">{f.title as string}</p>
              {typeof f.file_url === "string" && <a href={f.file_url as string} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400">Download</a>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
