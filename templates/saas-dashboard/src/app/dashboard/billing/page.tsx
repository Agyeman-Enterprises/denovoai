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
      const { data } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single();
      setSub(data);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  const handleUpgrade = async (planId: string) => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const handlePortal = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (loading) return <p className="text-white/40">Loading...</p>;

  const planId = (sub?.plan_id as string) || "free";
  const planName = planId === "pro" ? "Pro" : planId === "business" ? "Business" : "Free";

  return (
    <div>
      <h1 className="text-2xl font-bold">Billing</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/40">Plan</p>
          <p className="mt-1 text-2xl font-bold">{planName}</p>
          <p className="mt-1 text-sm text-white/30">
            {sub?.status === "active" ? "Active" : (sub?.status as string) || "Free"}
          </p>
          {typeof sub?.current_period_end === "string" && (
            <p className="mt-1 text-xs text-white/20">Renews {new Date(sub.current_period_end).toLocaleDateString()}</p>
          )}
        </div>
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/40">Usage This Month</p>
          <p className="mt-1 text-2xl font-bold">{sub?.usage_count as number || 0} / {sub?.usage_limit as number || 0}</p>
          <p className="mt-1 text-sm text-white/30">{"{{PRIMARY_ENTITY_PLURAL}}"}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {planId === "free" && (
          <button onClick={() => handleUpgrade("pro")} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#3B82F6" }}>
            Upgrade to Pro (${"{{PRO_PRICE}}"}/mo)
          </button>
        )}
        {typeof sub?.stripe_customer_id === "string" && (
          <button onClick={handlePortal} className="rounded-lg px-4 py-2 text-sm font-medium text-white/60" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            Manage Billing
          </button>
        )}
      </div>
    </div>
  );
}
