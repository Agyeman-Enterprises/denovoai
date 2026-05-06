"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";

const FEATURES = [
  "Unlimited {{POST_NOUN_PLURAL}}",
  "Priority support",
  "Custom profile badge",
  "Advanced analytics",
  "Early access to new features",
];

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: "pro" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/feed" className="text-sm text-white/40 hover:text-white/70">Feed</Link>
          <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/70">Dashboard</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-3xl font-bold mb-2">Upgrade to Pro</h1>
        <p className="text-sm text-white/40 mb-8">Unlock everything {"{{APP_NAME}}"} has to offer.</p>

        <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="mb-6">
            <span className="text-4xl font-bold">{"{{PRO_PRICE}}"}</span>
            <span className="text-sm text-white/40 ml-1">/month</span>
          </div>

          <ul className="space-y-3 text-left mb-8">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                <span className="text-green-400">&#10003;</span>
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "{{PRIMARY_COLOR}}" }}
          >
            {loading ? "Redirecting..." : "Subscribe Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
