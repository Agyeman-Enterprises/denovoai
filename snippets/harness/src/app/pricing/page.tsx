"use client";
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const PLANS = [
  { id: "free", name: "Free", price: 0, features: ["Basic features", "Community support"], cta: "Get Started" },
  { id: "pro", name: "Pro", price: 29, features: ["Full features", "Priority support", "Advanced analytics"], cta: "Upgrade to Pro", highlight: true },
  { id: "business", name: "Business", price: 99, features: ["All features", "Priority support", "Custom integrations", "Dedicated account manager"], cta: "Upgrade to Business" },
];

export default function PricingPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") {
      router.push("/dashboard");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const envKey = planId === "pro" ? "STRIPE_PRO_MONTHLY_PRICE_ID" : "STRIPE_BUSINESS_MONTHLY_PRICE_ID";
    // Price ID comes from the server — we pass the plan and the server resolves it
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId: planId === "pro" ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
        mode: "subscription",
      }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    if (data.error) alert(data.error);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#06060f] px-4 py-16">
      <h1 className="text-3xl font-bold text-white">Choose your plan</h1>
      <p className="mt-3 text-sm text-white/40">Start free. Upgrade when you need to.</p>

      <div className="mt-12 grid gap-4 sm:grid-cols-3 max-w-3xl w-full">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-2xl p-6"
            style={plan.highlight
              ? { background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.25)" }
              : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {plan.highlight && (
              <span className="mb-3 inline-block w-fit rounded-full px-3 py-1 text-[10px] font-semibold" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>
                Most Popular
              </span>
            )}
            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            <p className="mt-2">
              <span className="text-3xl font-bold text-white">${plan.price}</span>
              {plan.price > 0 && <span className="text-sm text-white/30">/mo</span>}
            </p>
            <ul className="mt-5 flex-1 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-white/40">
                  <span style={{ color: "#8B5CF6" }}>&#10003;</span>{f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.id)}
              className="mt-5 w-full rounded-xl py-3 text-sm font-medium transition-all"
              style={plan.highlight
                ? { background: "linear-gradient(135deg, #8B5CF6, #7c3aed)", color: "#fff" }
                : { border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <button onClick={() => router.push("/")} className="mt-8 text-xs text-white/20 hover:text-white/40">Back to home</button>
    </div>
  );
}
