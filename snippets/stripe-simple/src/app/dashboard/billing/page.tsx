"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [sub, setSub] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data } = await supabase
        .from("subscriptions")
        .select("plan_id, status, current_period_end, cancel_at_period_end, stripe_customer_id")
        .eq("user_id", user.id)
        .single();

      setSub(data);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  const handlePortal = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#06060f]"><p className="text-white/40">Loading...</p></div>;

  const planId = (sub?.plan_id as string) || "free";
  const planName = planId === "pro" ? "Pro" : planId === "business" ? "Business" : "Free";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#06060f] px-4">
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h1 className="text-2xl font-bold text-white">Billing</h1>

        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Plan</span>
            <span className="text-white font-semibold">{planName}</span>
          </div>
          <div className="flex justify-between text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
            <span className="text-white/40">Status</span>
            <span className={`font-medium ${(sub?.status as string) === "active" ? "text-green-400" : "text-yellow-400"}`}>{(sub?.status as string) || "free"}</span>
          </div>
          {typeof sub?.current_period_end === "string" && (
            <div className="flex justify-between text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
              <span className="text-white/40">Current period ends</span>
              <span className="text-white/60">{new Date(sub.current_period_end).toLocaleDateString()}</span>
            </div>
          )}
          {Boolean(sub?.cancel_at_period_end) && (
            <p className="text-xs text-yellow-400 mt-2">Your subscription will cancel at the end of the current period.</p>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-2">
          {typeof sub?.stripe_customer_id === "string" && (
            <button onClick={handlePortal} className="w-full rounded-xl py-3 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #8B5CF6, #7c3aed)" }}>
              Manage Billing
            </button>
          )}
          <button onClick={() => router.push("/pricing")} className="w-full rounded-xl py-3 text-sm font-medium text-white/60" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            {planId === "free" ? "Upgrade" : "Change Plan"}
          </button>
          <button onClick={() => router.push("/dashboard")} className="text-xs text-white/25 hover:text-white/40 mt-2">Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}
