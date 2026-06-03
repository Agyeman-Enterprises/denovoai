"use client";

import { useRouter } from "next/navigation";
import { CREDIT_PACKS } from "@/lib/stripe";
import Link from "next/link";
import type { Subscription, Plan } from "@/types/db";

const orange = "#F5530A";
const bg = "#08080D";
const cardBg = "#0F0F18";
const border = "rgba(255,255,255,0.07)";
const muted = "rgba(255,255,255,0.4)";

const PLANS = [
  { name: "Starter", price: "Free", note: "Get started", features: ["1 project/month", "Source code delivery", "Community support"], cta: "Current plan", current: true },
  { name: "Pro", price: "Custom", note: "Talk to us", features: ["Unlimited projects", "Priority builds", "Dedicated support", "Custom integrations"], cta: "Get a quote", featured: true },
  { name: "Enterprise", price: "Custom", note: "Custom scope", features: ["Everything in Pro", "White-label output", "SLA + dedicated team", "Custom contracts"], cta: "Contact us" },
];

export function BillingClient({ sub, plan }: { sub: Subscription | null; plan: Plan | null }) {
  const router = useRouter();

  const handlePortal = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.assign(data.url);
  };

  const handleBuyCredits = async (packIndex: number) => {
    const res = await fetch("/api/stripe/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packIndex }) });
    const data = await res.json();
    if (data.url) window.location.assign(data.url);
  };

  return (
    <div style={{ minHeight: "100svh", background: bg, color: "#fff" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(20px,4vw,48px)", height: 56, borderBottom: `1px solid ${border}`, background: "rgba(8,8,13,0.9)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>AE</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>AE Studio</span>
          </Link>
          <nav style={{ display: "flex", gap: 4 }}>
            {[["Dashboard", "/dashboard"], ["Billing", "/dashboard/billing"]].map(([l, h]) => (
              <Link key={l} href={h} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 13, color: h === "/dashboard/billing" ? "#fff" : muted, textDecoration: "none", background: h === "/dashboard/billing" ? "rgba(255,255,255,0.05)" : "transparent" }}>{l}</Link>
            ))}
          </nav>
        </div>
        <Link href="/studio" style={{ background: orange, color: "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>New Project</Link>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(32px,5vw,52px) clamp(20px,4vw,48px)" }}>
        <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6 }}>Billing & Plan</h1>
        <p style={{ fontSize: 13, color: muted, marginBottom: 40 }}>Manage your subscription and payment history</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "24px 26px" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, fontWeight: 600, marginBottom: 12 }}>Current Plan</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <span style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.03em" }}>{plan?.name || "Starter"}</span>
              <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: "rgba(52,211,153,0.12)", color: "#34d399" }}>Active</span>
            </div>
            <p style={{ fontSize: 13, color: muted, margin: "0 0 20px" }}>{plan?.monthly_credits || 1} project{(plan?.monthly_credits || 1) > 1 ? "s" : ""}/month</p>
            <div style={{ display: "flex", gap: 10 }}>
              {sub?.plan_id && (
                <button onClick={handlePortal} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: muted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Manage</button>
              )}
              <button onClick={() => router.push("/pricing")} style={{ padding: "8px 16px", borderRadius: 8, background: orange, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {sub?.plan_id ? "Upgrade" : "Upgrade Plan"}
              </button>
            </div>
          </div>
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "24px 26px" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, fontWeight: 600, marginBottom: 12 }}>Credits Remaining</p>
            <p style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.04em", margin: "0 0 4px", color: sub?.credits_remaining ? "#fff" : "rgba(255,255,255,0.3)" }}>{sub?.credits_remaining ?? 1}</p>
            <p style={{ fontSize: 13, color: muted, margin: 0 }}>build credits this period</p>
          </div>
        </div>

        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 20 }}>Plans</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 40 }}>
          {PLANS.map((p, i) => (
            <div key={i} style={{ border: `1px solid ${p.featured ? orange : border}`, borderRadius: 14, padding: "24px 22px", background: p.featured ? "rgba(245,83,10,0.03)" : cardBg, position: "relative" }}>
              {p.current && <span style={{ position: "absolute", top: 16, right: 16, fontSize: 10, background: "rgba(52,211,153,0.12)", color: "#34d399", padding: "3px 10px", borderRadius: 100, fontWeight: 600 }}>Current</span>}
              {p.featured && <span style={{ position: "absolute", top: 16, right: 16, fontSize: 10, background: `rgba(245,83,10,0.15)`, color: orange, padding: "3px 10px", borderRadius: 100, fontWeight: 600 }}>Popular</span>}
              <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{p.name}</p>
              <p style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.03em", color: p.featured ? orange : "#fff", marginBottom: 4 }}>{p.price}</p>
              <p style={{ fontSize: 12, color: muted, marginBottom: 20 }}>{p.note}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                {p.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: muted }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke={p.featured ? orange : "#34d399"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button style={{ width: "100%", padding: "9px 0", borderRadius: 8, border: p.featured ? "none" : `1px solid ${border}`, background: p.featured ? orange : "transparent", color: p.featured ? "#fff" : muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        {CREDIT_PACKS && CREDIT_PACKS.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>Buy More Credits</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 40 }}>
              {CREDIT_PACKS.map((pack, i) => (
                <button key={i} onClick={() => handleBuyCredits(i)} style={{ textAlign: "left", padding: "18px 20px", borderRadius: 12, border: `1px solid ${border}`, background: cardBg, cursor: "pointer", transition: "border-color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(245,83,10,0.3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = border)}>
                  <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{pack.credits} credits</p>
                  <p style={{ fontSize: 14, color: orange, margin: 0, fontWeight: 600 }}>${(pack.amountCents / 100).toFixed(0)}</p>
                </button>
              ))}
            </div>
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "24px 26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Payment Method</p>
              <button style={{ fontSize: 13, color: orange, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>+ Add</button>
            </div>
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: "0 auto 12px", display: "block" }}><rect width="40" height="40" rx="10" fill="rgba(255,255,255,0.03)" /><rect x="8" y="13" width="24" height="14" rx="3" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" /><path d="M8 18h24" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" /></svg>
              <p style={{ fontSize: 13, color: muted, margin: 0 }}>No payment method added</p>
            </div>
          </div>
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "24px 26px" }}>
            <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 20px" }}>Invoice History</p>
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: "0 auto 12px", display: "block" }}><rect width="40" height="40" rx="10" fill="rgba(255,255,255,0.03)" /><path d="M13 12h14M13 17h14M13 22h9" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <p style={{ fontSize: 13, color: muted, margin: 0 }}>No invoices yet</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
