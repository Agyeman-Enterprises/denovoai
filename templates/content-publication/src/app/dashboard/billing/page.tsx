"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function BillingPage() {
  const [sub, setSub] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("subscriptions")
        .select("id, plan, status, current_period_end, stripe_customer_id")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "past_due", "canceled"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
          setSub(data);
          setLoading(false);
        });
    });
  }, [supabase]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Billing</h1>

      {loading ? (
        <p className="mt-8 text-sm text-white/30">Loading...</p>
      ) : sub ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs text-white/40">Current Plan</p>
            <p className="mt-1 text-xl font-bold text-violet-400">{sub.plan as string}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-md px-1.5 py-0.5 text-[10px]" style={{
                background: sub.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                color: sub.status === "active" ? "#34d399" : "rgba(255,255,255,0.3)",
              }}>{(sub.status as string).toUpperCase()}</span>
            </div>
            {!!(sub.current_period_end) ? (
              <p className="mt-2 text-xs text-white/25">
                Current period ends {new Date(sub.current_period_end as string).toLocaleDateString()}
              </p>
            ) : null}
          </div>

          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "#8B5CF6" }}
          >
            {portalLoading ? "..." : "Manage Subscription"}
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-sm text-white/40">You are on the free plan.</p>
          <Link href="/pricing" className="mt-4 inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white" style={{ background: "#8B5CF6" }}>
            Upgrade
          </Link>
        </div>
      )}
    </div>
  );
}
