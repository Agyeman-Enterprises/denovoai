import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: item } = await supabase.from("items").select("*").eq("id", id).eq("user_id", user.id).single();

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-white/40">{"{{PRIMARY_ENTITY}}"} not found.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-xs text-violet-400">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/dashboard" className="text-xs text-white/25 hover:text-white/40">&larr; Back</Link>
      <h1 className="mt-4 text-2xl font-bold">{item.title}</h1>
      <span className={`mt-2 inline-block text-xs ${item.status === "active" ? "text-green-400" : "text-white/30"}`}>{item.status}</span>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-sm font-semibold text-white/60 mb-3">Input</h3>
          <pre className="text-xs text-white/30 overflow-auto max-h-48">{JSON.stringify(item.input_data, null, 2)}</pre>
        </div>
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-sm font-semibold text-white/60 mb-3">Output</h3>
          {item.output_data && Object.keys(item.output_data as Record<string, unknown>).length > 0 ? (
            <pre className="text-xs text-white/30 overflow-auto max-h-48">{JSON.stringify(item.output_data, null, 2)}</pre>
          ) : (
            <p className="text-xs text-white/25">No output yet. Generate to see results.</p>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-white/20">
        Created {new Date(item.created_at).toLocaleString()} &middot; Updated {new Date(item.updated_at).toLocaleString()}
      </div>
    </div>
  );
}
