"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ onboarded: boolean; charges: boolean; payouts: boolean } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_onboarded")
        .eq("id", user.id)
        .single();

      if (profile) {
        setStatus({
          onboarded: profile.stripe_onboarded || false,
          charges: profile.stripe_onboarded || false,
          payouts: profile.stripe_onboarded || false,
        });
      }
    }
    load();
  }, [supabase, router]);

  const handleOnboard = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0F] px-4">
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h1 className="text-2xl font-bold text-white">Become a Seller</h1>
        <p className="mt-2 text-sm text-white/40">Connect your Stripe account to receive payments.</p>

        {status?.onboarded ? (
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-sm"><span className={status.charges ? "text-green-400" : "text-yellow-400"}>{status.charges ? "✓" : "○"}</span> Charges {status.charges ? "enabled" : "pending"}</div>
            <div className="flex items-center gap-2 text-sm"><span className={status.payouts ? "text-green-400" : "text-yellow-400"}>{status.payouts ? "✓" : "○"}</span> Payouts {status.payouts ? "enabled" : "pending"}</div>
            {status.charges && status.payouts && (
              <p className="mt-4 text-sm text-green-400 font-medium">Your account is fully set up!</p>
            )}
            <button onClick={() => router.push("/dashboard/earnings")} className="mt-4 w-full rounded-xl py-3 text-sm font-medium text-white" style={{ background: "linear-gradient(135deg, #8B5CF6, #7c3aed)" }}>
              View Earnings
            </button>
          </div>
        ) : (
          <button onClick={handleOnboard} disabled={loading} className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg, #8B5CF6, #7c3aed)" }}>
            {loading ? "Redirecting to Stripe..." : "Start Stripe Onboarding"}
          </button>
        )}

        <button onClick={() => router.push("/dashboard")} className="mt-4 block w-full text-center text-xs text-white/25 hover:text-white/40">Back to Dashboard</button>
      </div>
    </div>
  );
}
