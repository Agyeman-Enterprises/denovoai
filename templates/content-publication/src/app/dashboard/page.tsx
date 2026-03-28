import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, plan, status, current_period_end")
    .eq("user_id", user!.id)
    .in("status", ["active", "trialing"])
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold">Reading History</h1>

      <div className="mt-6 rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-xs text-white/40">Current Plan</p>
        {sub ? (
          <div className="mt-2">
            <p className="text-lg font-bold text-violet-400">{(sub as Record<string, unknown>).plan as string} — {(sub as Record<string, unknown>).status as string}</p>
            {!!((sub as Record<string, unknown>).current_period_end) ? (
              <p className="text-xs text-white/25 mt-1">
                Renews {new Date((sub as Record<string, unknown>).current_period_end as string).toLocaleDateString()}
              </p>
            ) : null}
            <Link href="/dashboard/billing" className="mt-3 inline-block text-sm text-violet-400 hover:text-violet-300">Manage Billing</Link>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-lg font-bold text-white/50">Free</p>
            <p className="text-xs text-white/25 mt-1">Upgrade to access premium {"{{CONTENT_NOUN_PLURAL}}"}.</p>
            <Link href="/pricing" className="mt-3 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#8B5CF6" }}>
              Upgrade
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-white/60 mb-4">Recent Reading</h2>
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-sm text-white/30">Reading history will appear here as you explore {"{{CONTENT_NOUN_PLURAL}}"}.</p>
          <Link href="/browse" className="mt-2 inline-block text-sm text-violet-400 hover:text-violet-300">Start reading</Link>
        </div>
      </div>
    </div>
  );
}
