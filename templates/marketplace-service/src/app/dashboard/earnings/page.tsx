"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EarningsPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setOrders(data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <p className="text-white/40">Loading...</p>;

  const totalEarnings = orders.reduce((sum, o) => sum + ((o.seller_payout_cents as number) || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold">Earnings</h1>
      <div className="mt-6 rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="text-xs text-white/40">Total Earned</p>
        <p className="mt-1 text-3xl font-bold">${(totalEarnings / 100).toFixed(2)}</p>
      </div>
      <h2 className="mt-8 text-sm font-semibold text-white/60 mb-3">Recent Payouts</h2>
      <div className="space-y-2">
        {orders.length === 0 ? (
          <p className="text-sm text-white/25">No orders yet.</p>
        ) : (
          orders.map(o => (
            <div key={o.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <p className="text-sm">${((o.seller_payout_cents as number) / 100).toFixed(2)}</p>
                <p className="text-xs text-white/25">{new Date(o.created_at as string).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs ${(o.status as string) === "complete" ? "text-green-400" : "text-white/30"}`}>{o.status as string}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
