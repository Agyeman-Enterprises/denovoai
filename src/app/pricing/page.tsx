"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    credits: "1 app",
    features: ["1 app", "Download only", "Community templates"],
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 29,
    annualPrice: 290,
    credits: "5 apps/month",
    features: ["5 apps/month", "Auto-deploy", "All templates", "Email support"],
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 79,
    annualPrice: 790,
    credits: "15 apps/month",
    features: ["15 apps/month", "Priority deploy", "Custom snippets", "Priority support"],
  },
  {
    id: "agency",
    name: "Agency",
    monthlyPrice: 199,
    annualPrice: 1990,
    credits: "50 apps/month",
    features: ["50 apps/month", "White label", "API access", "Dedicated support"],
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") {
      window.location.href = "/studio";
      return;
    }
    const envKey = annual
      ? `STRIPE_${planId.toUpperCase()}_ANNUAL_PRICE_ID`
      : `STRIPE_${planId.toUpperCase()}_PRICE_ID`;
    // In production, priceId comes from env vars via API
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, annual }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <>
      <Navbar />
      <main className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold sm:text-4xl">Simple, transparent pricing</h1>
            <p className="mt-4 text-muted-foreground">
              Start free. Scale when you need to.
            </p>
          </div>

          {/* Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={cn("text-sm", !annual && "text-foreground font-medium")}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                annual ? "bg-primary" : "bg-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  annual && "translate-x-5"
                )}
              />
            </button>
            <span className={cn("text-sm", annual && "text-foreground font-medium")}>
              Annual <span className="text-primary text-xs">(2 months free)</span>
            </span>
          </div>

          {/* Plans */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const price = annual ? plan.annualPrice / 12 : plan.monthlyPrice;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "rounded-xl border p-6 flex flex-col",
                    plan.highlight ? "border-primary bg-primary/5" : "border-border bg-card"
                  )}
                >
                  {plan.highlight && (
                    <span className="mb-3 inline-block w-fit rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-2">
                    <span className="text-3xl font-bold">${Math.round(price)}</span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-sm text-muted-foreground">/mo</span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.credits}</p>
                  <ul className="mt-6 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-primary">&#10003;</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {plan.id === "free" ? "Start Free" : "Subscribe"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
