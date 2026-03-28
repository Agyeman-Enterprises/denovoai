"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/upload/FileUpload";
import { FileList } from "@/components/upload/FileList";

export default function UploadsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [files, setFiles] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { data } = await supabase
      .from("file_uploads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setFiles(data || []);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUpload = () => { loadFiles(); };

  const handleDelete = async (path: string, bucket: string) => {
    await fetch("/api/upload/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, bucket }),
    });
    loadFiles();
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#06060f]"><p className="text-white/40">Loading...</p></div>;

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#06060f] px-4 py-12">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-white">Uploads</h1>
        <div className="mt-6">
          <FileUpload onUpload={handleUpload} />
        </div>
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-white/60 mb-3">Your Files</h2>
          <FileList files={files as never[]} onDelete={handleDelete} />
        </div>
        <button onClick={() => router.push("/dashboard")} className="mt-6 text-xs text-white/25 hover:text-white/40">Back to Dashboard</button>
      </div>
    </div>
  );
}
