import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/feed" className="text-sm text-white/40 hover:text-white/70">Feed</Link>
          <Link href="/members" className="text-sm text-white/70 font-medium">{"{{MEMBER_NOUN_PLURAL}}"}</Link>
          <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/70">Dashboard</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">{"{{MEMBER_NOUN_PLURAL}}"}</h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(members || []).length === 0 ? (
            <div className="col-span-full rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-sm text-white/25">No {"{{MEMBER_NOUN_PLURAL}}"} yet.</p>
            </div>
          ) : (
            (members || []).map((m: Record<string, unknown>) => (
              <Link key={m.id as string} href={`/profile/${m.id}`} className="group rounded-xl p-5 transition-all hover:ring-1 hover:ring-violet-500/30" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "{{PRIMARY_COLOR}}", opacity: 0.7 }}>
                    {(m.display_name as string)?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{(m.display_name as string) || "Anonymous"}</h3>
                  </div>
                </div>
                {(m.bio as string) && <p className="text-xs text-white/30 line-clamp-2">{m.bio as string}</p>}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
