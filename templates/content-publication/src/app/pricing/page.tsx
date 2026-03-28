"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "0",
    period: "",
    description: "Access free {{CONTENT_NOUN_PLURAL}} only",
    features: ["Free {{CONTENT_NOUN_PLURAL}}", "RSS feed access", "Community access"],
    cta: "Get Started",
    plan_id: null,
    highlighted: false,
  },
  {
    name: "Pro Monthly",
    price: "{{PRO_PRICE}}",
    period: "/mo",
    description: "Full access to all {{CONTENT_NOUN_PLURAL}}",
    features: ["All free features", "Premium {{CONTENT_NOUN_PLURAL}}", "Early access", "No ads"],
    cta: "Subscribe",
    plan_id: "pro",
    highlighted: true,
  },
  {
    name: "Annual",
    price: "{{PRO_PRICE_ANNUAL}}",
    period: "/yr",
    description: "Best value — save with yearly billing",
    features: ["All Pro features", "Priority support", "Exclusive bonus content", "Annual discount"],
    cta: "Subscribe",
    plan_id: "annual",
    highlighted: false,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/browse" className="text-sm text-white/40 hover:text-white/70">Browse</Link>
          <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70">Sign In</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold sm:text-4xl">Choose Your Plan</h1>
          <p className="mt-3 text-lg text-white/40">Unlock all {"{{CONTENT_NOUN_PLURAL}}"} with a subscription.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className="rounded-2xl p-6 flex flex-col"
              style={{
                background: plan.highlighted ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.03)",
                border: plan.highlighted ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {plan.highlighted ? (
                <span className="self-start rounded-md px-2 py-0.5 text-[10px] font-semibold mb-3" style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                  MOST POPULAR
                </span>
              ) : null}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">${plan.price}</span>
                {!!(plan.period) ? <span className="text-sm text-white/30">{plan.period}</span> : null}
              </div>
              <p className="mt-2 text-sm text-white/40">{plan.description}</p>
              <ul className="mt-4 space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/50">
                    <svg className="h-4 w-4 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {plan.plan_id ? (
                  <button
                    onClick={() => handleSubscribe(plan.plan_id as string)}
                    disabled={loading === plan.plan_id}
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: plan.highlighted ? "#8B5CF6" : "rgba(255,255,255,0.1)" }}
                  >
                    {loading === plan.plan_id ? "..." : plan.cta}
                  </button>
                ) : (
                  <Link href="/auth/login" className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-white/70" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                    {plan.cta}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
