"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function EarningsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [seller, setSeller] = useState<Record<string, unknown> | null>(null);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: sellerData } = await supabase
        .from("seller_profiles")
        .select("stripe_onboarded, stripe_charges_enabled, stripe_payouts_enabled")
        .eq("id", user.id)
        .single();

      setSeller(sellerData);

      const { data: orderData } = await supabase
        .from("marketplace_orders")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setOrders(orderData || []);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#06060f]"><p className="text-white/40">Loading...</p></div>;

  const totalEarnings = orders.reduce((sum, o) => sum + ((o.seller_payout_cents as number) || 0), 0);
  const paidOrders = orders.filter(o => o.status === "transferred" || o.status === "paid");

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#06060f] px-4 py-12">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-white">Earnings</h1>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs text-white/40">Total Earned</p>
            <p className="mt-1 text-2xl font-bold text-white">${(totalEarnings / 100).toFixed(2)}</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs text-white/40">Orders</p>
            <p className="mt-1 text-2xl font-bold text-white">{paidOrders.length}</p>
          </div>
        </div>

        {!seller?.stripe_onboarded && (
          <button onClick={() => router.push("/onboarding/seller")} className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #8B5CF6, #7c3aed)" }}>
            Complete Stripe Setup
          </button>
        )}

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-white/60 mb-3">Recent Orders</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-white/25">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <p className="text-white/70">${((o.amount_cents as number) / 100).toFixed(2)}</p>
                    <p className="text-xs text-white/25">{new Date(o.created_at as string).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-medium ${(o.status as string) === "transferred" ? "text-green-400" : (o.status as string) === "paid" ? "text-blue-400" : "text-white/30"}`}>
                    {o.status as string}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => router.push("/dashboard")} className="mt-6 text-xs text-white/25 hover:text-white/40">Back to Dashboard</button>
      </div>
    </div>
  );
}
