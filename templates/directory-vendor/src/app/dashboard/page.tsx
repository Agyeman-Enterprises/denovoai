import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: listings } = await supabase
    .from("directory_listings")
    .select("id, name, status, category, view_count, is_featured, created_at")
    .eq("submitter_id", user!.id)
    .order("created_at", { ascending: false });

  const statusColor = (s: string) => {
    if (s === "active") return { bg: "rgba(16,185,129,0.15)", color: "#34d399" };
    if (s === "pending") return { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" };
    if (s === "rejected") return { bg: "rgba(239,68,68,0.15)", color: "#f87171" };
    return { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" };
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <Link href="/submit" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#8B5CF6" }}>
          Submit New
        </Link>
      </div>

      {(!listings || listings.length === 0) && (
        <div className="mt-8 text-center">
          <p className="text-sm text-white/30">You haven&apos;t submitted any {"{{LISTING_NOUN_PLURAL}}"} yet.</p>
          <Link href="/submit" className="mt-2 inline-block text-sm text-violet-400 hover:text-violet-300">Submit your first {"{{LISTING_NOUN}}"}</Link>
        </div>
      )}

      {listings && listings.length > 0 && (
        <div className="mt-6 space-y-2">
          {listings.map((l: Record<string, unknown>) => {
            const sc = statusColor(l.status as string);
            return (
              <div key={l.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{l.name as string}</p>
                    <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: sc.bg, color: sc.color }}>{(l.status as string).toUpperCase()}</span>
                    {l.is_featured && <span className="rounded-md px-1.5 py-0.5 text-[10px] text-amber-400" style={{ background: "rgba(251,191,36,0.1)" }}>Featured</span>}
                  </div>
                  <p className="text-xs text-white/25">{l.category as string} &middot; {l.view_count as number} views</p>
                </div>
                {l.status === "active" && (
                  <Link href={`/listing/${l.id}`} className="text-xs text-violet-400 hover:text-violet-300">View</Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
