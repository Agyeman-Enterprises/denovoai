import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id, status, current_period_end, cancel_at_period_end")
    .eq("user_id", user!.id)
    .single();

  const planName = sub?.plan_id === "pro" ? "Pro" : sub?.plan_id === "business" ? "Business" : "Free";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#06060f] px-4">
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">{user!.email}</p>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
            <span className="text-white/40">Plan</span>
            <span className="text-white font-medium">{planName}</span>
          </div>
          <div className="flex justify-between text-sm" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
            <span className="text-white/40">Status</span>
            <span className={`font-medium ${sub?.status === "active" ? "text-green-400" : "text-yellow-400"}`}>{sub?.status || "free"}</span>
          </div>
          {sub?.current_period_end && (
            <div className="flex justify-between text-sm" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
              <span className="text-white/40">Renews</span>
              <span className="text-white/60">{new Date(sub.current_period_end).toLocaleDateString()}</span>
            </div>
          )}
          {sub?.cancel_at_period_end && (
            <p className="text-xs text-yellow-400">Subscription will cancel at period end.</p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {planName === "Free" && (
            <Link href="/pricing" className="block rounded-xl py-3 text-center text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #8B5CF6, #7c3aed)" }}>
              Upgrade
            </Link>
          )}
          <Link href="/dashboard/billing" className="block rounded-xl py-3 text-center text-sm font-medium text-white/60" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            Manage Billing
          </Link>
          <form action="/auth/signout" method="POST">
            <button type="submit" className="w-full rounded-xl py-3 text-sm font-medium text-white/40 transition-all hover:text-white/60" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
