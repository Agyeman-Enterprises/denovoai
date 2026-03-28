"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("orders")
      .select("id, status, amount_cents, email, created_at")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [supabase]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/admin" className="text-lg font-bold text-white">{"{{APP_NAME}}"} Admin</Link>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-white/40 hover:text-white/70">Dashboard</Link>
          <Link href="/admin/products" className="text-sm text-white/40 hover:text-white/70">Products</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold">Orders</h1>

        {loading && <p className="mt-8 text-sm text-white/30">Loading...</p>}

        {!loading && orders.length === 0 && <p className="mt-8 text-sm text-white/30">No orders yet.</p>}

        {!loading && orders.length > 0 && (
          <div className="mt-6 space-y-2">
            {orders.map(o => (
              <div key={o.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <p className="text-sm font-medium">#{(o.id as string).slice(0, 8)}</p>
                  <p className="text-xs text-white/25">{o.email as string} &middot; {new Date(o.created_at as string).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-violet-400">${((o.amount_cents as number) / 100).toFixed(2)}</span>
                  <select
                    value={o.status as string}
                    onChange={e => updateStatus(o.id as string, e.target.value)}
                    className="rounded-md px-2 py-1 text-xs text-white"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="refunded">Refunded</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
