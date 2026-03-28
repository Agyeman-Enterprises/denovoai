"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CREDIT_PACKS } from "@/lib/stripe";
import type { Database } from "@/types/database";

type SubRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type PlanRow = Database["public"]["Tables"]["plans"]["Row"];

export default function BillingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [sub, setSub] = useState<SubRow | null>(null);
  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (subData) {
        setSub(subData);
        const { data: planData } = await supabase
          .from("plans")
          .select("*")
          .eq("id", subData.plan_id)
          .single();
        setPlan(planData);
      }
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  const handlePortal = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const handleBuyCredits = async (packIndex: number) => {
    const res = await fetch("/api/stripe/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packIndex }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (loading) return <><Navbar /><div className="flex flex-1 items-center justify-center"><p className="text-muted-foreground">Loading...</p></div></>;

  return (
    <>
      <Navbar />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold">Billing</h1>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardTitle>Current Plan</CardTitle>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-2xl font-bold capitalize">{plan?.name || "Free"}</span>
                <Badge variant={sub?.status === "active" ? "success" : "warning"}>
                  {sub?.status || "active"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan?.monthly_credits || 1} apps/month
              </p>
              {sub?.current_period_end && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Renews {new Date(sub.current_period_end).toLocaleDateString()}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                {sub?.plan_id !== "free" && (
                  <Button variant="outline" size="sm" onClick={handlePortal}>
                    Manage Subscription
                  </Button>
                )}
                <Button size="sm" onClick={() => router.push("/pricing")}>
                  {sub?.plan_id === "free" ? "Upgrade" : "Change Plan"}
                </Button>
              </div>
            </Card>

            <Card>
              <CardTitle>Credits</CardTitle>
              <p className="mt-3 text-3xl font-bold">{sub?.credits_remaining ?? 1}</p>
              <p className="mt-1 text-sm text-muted-foreground">credits remaining</p>
            </Card>
          </div>

          {/* Credit top-ups */}
          <Card className="mt-6">
            <CardTitle>Buy More Credits</CardTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {CREDIT_PACKS.map((pack, i) => (
                <button
                  key={i}
                  onClick={() => handleBuyCredits(i)}
                  className="rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/50"
                >
                  <p className="text-xl font-bold">{pack.credits} credits</p>
                  <p className="text-sm text-muted-foreground">${(pack.amountCents / 100).toFixed(0)}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
