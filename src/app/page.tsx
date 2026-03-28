"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useEffect, useRef, useState } from "react";

/* ── Scroll animation ──────────────────────────── */
function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.1) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return v;
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const v = useInView(ref);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: v ? 1 : 0,
        transform: v ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Terminal demo ─────────────────────────────── */
const DEMO = [
  { who: "you", text: "I want a marketplace where event photographers sell services to venues." },
  { who: "ai", text: "Understood. Preparing the product for review." },
  { who: "ai", text: "Proposed product:" },
  { who: "card", text: "ShootSpace\nService marketplace\nPlatform fee model\nBookings, reviews, messaging" },
  { who: "ai", text: "Proceed?" },
  { who: "you", text: "Launch it." },
  { who: "step", text: "Structure confirmed" },
  { who: "step", text: "Build complete" },
  { who: "step", text: "Launch complete" },
  { who: "done", text: "ShootSpace is live." },
];

function Terminal() {
  const [lines, setLines] = useState<typeof DEMO>([]);
  const ref = useRef<HTMLDivElement>(null);
  const vis = useInView(ref, 0.3);
  const ran = useRef(false);

  useEffect(() => {
    if (!vis || ran.current) return;
    ran.current = true;
    let i = 0;
    const t = setInterval(() => {
      if (i >= DEMO.length) { clearInterval(t); return; }
      const line = DEMO[i]; i++;
      if (line) setLines(p => [...p, line]);
    }, 850);
    return () => clearInterval(t);
  }, [vis]);

  return (
    <div ref={ref} className="relative mx-auto" style={{ maxWidth: 680 }}>
      <div className="absolute -inset-8 rounded-3xl opacity-60" style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.12), transparent 70%)" }} />
      <div className="relative overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(180deg, #0d0d1f 0%, #080814 100%)", boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset" }}>
        {/* Chrome */}
        <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
          <div className="h-3 w-3 rounded-full" style={{ background: "#ffbd2e" }} />
          <div className="h-3 w-3 rounded-full" style={{ background: "#28c840" }} />
          <span className="ml-4 font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>DeNovo Studio</span>
        </div>
        {/* Content */}
        <div className="px-6 py-5 font-mono text-[13px] leading-relaxed" style={{ minHeight: 340 }}>
          <div className="space-y-2.5">
            {lines.map((l, i) => (
              <div key={i} style={{ animation: "fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both" }}>
                {l.who === "you" && <p><span style={{ color: "#8B5CF6" }}>You</span>{" "}<span style={{ color: "rgba(255,255,255,0.8)" }}>{l.text}</span></p>}
                {l.who === "ai" && <p><span style={{ color: "#a78bfa" }}>DeNovo</span>{" "}<span style={{ color: "rgba(255,255,255,0.55)" }}>{l.text}</span></p>}
                {l.who === "card" && (
                  <div className="ml-5 my-2 rounded-lg px-4 py-3 whitespace-pre-line" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{l.text}</div>
                )}
                {l.who === "step" && <p className="ml-5" style={{ color: "rgba(255,255,255,0.25)" }}>{l.text}</p>}
                {l.who === "done" && <p className="mt-2 font-semibold" style={{ color: "#34d399" }}>{l.text}</p>}
              </div>
            ))}
            {lines.length > 0 && lines.length < DEMO.length && <span className="inline-block h-4 w-1.5 animate-pulse" style={{ background: "#8B5CF6" }} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Pricing ───────────────────────────────────── */
const BUILD = [
  { name: "Starter", price: 99, credits: "3 app builds/month", over: "$59/app", feats: ["Source code delivery", "Email support"] },
  { name: "Builder", price: 249, credits: "10 app builds/month", over: "$69/app", feats: ["Source code delivery", "Priority support"], best: true },
  { name: "Studio", price: 499, credits: "25 app builds/month", over: "$79/app", feats: ["Source code delivery", "Priority support"] },
  { name: "Agency", price: 999, credits: "60 app builds/month", over: "$99/app", feats: ["Source code delivery", "White-label output", "Dedicated support"] },
];
const LAUNCH = [
  { name: "Launch 1", price: 149, credits: "1 hosted app", over: "$129/app/mo", feats: ["Managed hosting", "Monitoring", "Backups", "Operational support"] },
  { name: "Launch 5", price: 549, credits: "5 hosted apps", over: "$139/app/mo", feats: ["Managed hosting", "Monitoring", "Backups", "Operational support"], best: true },
  { name: "Launch 15", price: 1499, credits: "15 hosted apps", over: "$149/app/mo", feats: ["Managed hosting", "Monitoring", "Backups", "Operational support"] },
  { name: "Launch 40", price: 3499, credits: "40 hosted apps", over: "$169/app/mo", feats: ["Managed hosting", "Monitoring", "Backups", "Operational support"] },
];

const TEMPLATES = [
  ["Marketplace", "Bookings, services, listings, transactions"],
  ["SaaS Tool", "Dashboards, workflows, business utilities"],
  ["Client Portal", "Service delivery, approvals, account access"],
  ["Internal Tool", "Operations, admin, CRM, reporting"],
  ["Commerce", "Digital products, subscriptions, storefronts"],
  ["Community", "Membership, gated access, user networks"],
  ["Directory", "Discovery, lead generation, resource hubs"],
  ["Content Platform", "Publishing, newsletters, education products"],
] as const;

const FAQS = [
  ["Can I use Build and Launch together?", "Yes. Generate with Build, then add Launch for any app you want hosted and maintained."],
  ["What happens if I hit my limit?", "Additional builds or hosted apps are billed at the published overage rate."],
  ["Do unused allocations roll over?", "Monthly allocations reset each billing cycle. Annual plans receive annual allocation across the term."],
  ["Can I cancel?", "Monthly plans cancel with 30 days\u2019 notice. Annual plans are non-refundable."],
  ["Who owns the code?", "For Build plans, you own the delivered codebase."],
] as const;

/* ── Divider ───────────────────────────────────── */
function Divider() {
  return <div className="mx-auto" style={{ height: 1, maxWidth: "70%", background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.25), transparent)" }} />;
}

/* ── Section wrapper ───────────────────────────── */
function Section({ children, id, className = "" }: { children: React.ReactNode; id?: string; className?: string }) {
  return <section id={id} className={`px-6 sm:px-8 lg:px-12 py-24 sm:py-32 ${className}`}>{children}</section>;
}

/* ── Page ──────────────────────────────────────── */
export default function LandingPage() {
  const [annual, setAnnual] = useState(false);
  const [tab, setTab] = useState<"build" | "launch">("build");

  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden">

        {/* ═══ HERO ═══ */}
        <section className="relative px-6 sm:px-8 lg:px-12 pt-32 sm:pt-40 pb-20">
          {/* Background effects */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 -translate-x-1/2 -top-32 w-[900px] h-[900px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 60%)" }} />
            <div className="absolute right-0 top-20 w-[500px] h-[500px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%)" }} />
            <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                The AI App Factory
              </span>
            </Reveal>
            <Reveal delay={120}>
              <h1 className="mt-8 text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[1.05] tracking-tight">
                From idea to<br />
                <span style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #a78bfa 40%, #60a5fa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>deployed business.</span>
              </h1>
            </Reveal>
            <Reveal delay={240}>
              <p className="mt-7 text-lg sm:text-xl leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                DeNovo turns a plain-English brief into production software.<br className="hidden sm:block" />
                Take the code, or let us run the product for you.
              </p>
            </Reveal>
            <Reveal delay={360}>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/login" className="cta-glow inline-flex h-13 items-center gap-2 rounded-xl px-8 text-base font-semibold text-white" style={{ background: "linear-gradient(135deg, #8B5CF6, #7c3aed)", boxShadow: "0 0 20px rgba(139,92,246,0.2)" }}>
                  Start Building
                </Link>
                <button onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex h-13 items-center gap-2 rounded-xl px-8 text-base font-medium transition-all" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                  See How It Works
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══ TERMINAL ═══ */}
        <div className="px-6 sm:px-8 pb-16 sm:pb-24">
          <Reveal><Terminal /></Reveal>
        </div>

        {/* ═══ SUPPORT ROW ═══ */}
        <div className="px-6 sm:px-8 pb-20">
          <div className="mx-auto max-w-3xl grid grid-cols-3 gap-6 text-center">
            {["Plain-English input", "Production-ready output", "Optional managed hosting"].map((t, i) => (
              <Reveal key={t} delay={i * 100}>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>{t}</p>
              </Reveal>
            ))}
          </div>
        </div>

        <Divider />

        {/* ═══ PROBLEM ═══ */}
        <Section>
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <h2 className="text-3xl sm:text-5xl font-bold leading-tight">
                Most tools generate output.<br />
                <span style={{ color: "rgba(255,255,255,0.3)" }}>DeNovo delivers product.</span>
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-8 text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                Code alone is not the asset. A usable, launch-ready application is.
              </p>
              <p className="mt-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
                DeNovo is built for founders, operators, and agencies who want a faster path from concept to working software without turning every build into a custom engineering project.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-8 text-sm font-semibold" style={{ color: "#8B5CF6" }}>DeNovo charges for software shipped, not prompts consumed.</p>
            </Reveal>
          </div>
        </Section>

        <Divider />

        {/* ═══ WHAT YOU GET ═══ */}
        <Section>
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(139,92,246,0.7)" }}>What You Get</p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold">A clearer path from concept to launch</h2>
            </Reveal>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                ["Production application", "A complete application with the core systems required to launch."],
                ["Review before build", "You confirm the product structure, features, and business model before work begins."],
                ["Flexible handoff", "Take the codebase in-house, or keep the product under managed operation."],
              ].map(([t, d], i) => (
                <Reveal key={i} delay={i * 120}>
                  <div className="card-glow rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="mb-4 h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)" }}>
                      <div className="h-2 w-2 rounded-full" style={{ background: "#8B5CF6" }} />
                    </div>
                    <h3 className="text-lg font-semibold">{t}</h3>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        <Divider />

        {/* ═══ HOW IT WORKS ═══ */}
        <Section id="how">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(139,92,246,0.7)" }}>The Process</p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold">Three steps to a working product</h2>
            </Reveal>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                ["01", "Describe", "Tell DeNovo what you want to build in plain English."],
                ["02", "Review", "Confirm the proposed structure, core features, and commercial model before build begins."],
                ["03", "Build or Launch", "Receive the codebase, or let DeNovo host and operate the product for you."],
              ].map(([n, t, d], i) => (
                <Reveal key={n} delay={i * 140}>
                  <div className="card-glow rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-5xl font-bold" style={{ background: "linear-gradient(180deg, rgba(139,92,246,0.35) 0%, rgba(139,92,246,0.08) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</span>
                    <h3 className="mt-5 text-xl font-semibold">{t}</h3>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        <Divider />

        {/* ═══ BUILD VS LAUNCH ═══ */}
        <Section>
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(139,92,246,0.7)" }}>Two Products</p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold">Take the code. Or let us run it.</h2>
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {/* Build */}
              <Reveal>
                <div className="card-glow rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 className="text-xl font-bold">DeNovo Build</h3>
                  <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Generate and take the code.</p>
                  <ul className="mt-6 space-y-2.5">
                    {["Full application codebase", "Core product systems included", "Source code delivery", "Ownership of delivered code"].map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                        <span style={{ color: "#8B5CF6" }}>&#10003;</span>{f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Best for: developers, agencies, technical founders</p>
                  <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Starting at <span className="text-white font-semibold">$99/month</span></p>
                  <Link href="/auth/login" className="cta-glow mt-5 block rounded-xl py-3 text-center text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #8B5CF6, #7c3aed)" }}>Start Building</Link>
                </div>
              </Reveal>
              {/* Launch */}
              <Reveal delay={150}>
                <div className="rounded-2xl p-8" style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.2)", boxShadow: "0 0 40px rgba(139,92,246,0.05)" }}>
                  <h3 className="text-xl font-bold">DeNovo Launch</h3>
                  <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>We host and run it for you.</p>
                  <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Everything in Build, plus:</p>
                  <ul className="mt-3 space-y-2.5">
                    {["Managed hosting", "Maintenance", "Monitoring", "Backups", "Operational support"].map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                        <span style={{ color: "#8B5CF6" }}>&#10003;</span>{f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Best for: non-technical founders, operators, lean teams</p>
                  <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Starting at <span className="text-white font-semibold">$149/month per app</span></p>
                  <Link href="/auth/login" className="cta-glow mt-5 block rounded-xl py-3 text-center text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #8B5CF6, #7c3aed)" }}>Launch Your Business</Link>
                </div>
              </Reveal>
            </div>
          </div>
        </Section>

        <Divider />

        {/* ═══ PRICING ═══ */}
        <Section id="pricing">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-center" style={{ color: "rgba(139,92,246,0.7)" }}>Pricing</p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-center">Simple pricing for software that ships</h2>
              <p className="mt-4 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Choose Build if you want the code. Choose Launch if you want the product hosted and operated for you.</p>
            </Reveal>

            {/* Tabs */}
            <Reveal delay={100}>
              <div className="mt-10 flex items-center justify-center gap-1 rounded-xl p-1 max-w-xs mx-auto" style={{ background: "rgba(255,255,255,0.04)" }}>
                {(["build", "launch"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} className="flex-1 rounded-lg px-5 py-2.5 text-sm font-medium capitalize transition-all" style={tab === t ? { background: "rgba(255,255,255,0.08)", color: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" } : { color: "rgba(255,255,255,0.35)" }}>{t}</button>
                ))}
              </div>
            </Reveal>

            {/* Toggle */}
            <Reveal delay={150}>
              <div className="mt-6 flex items-center justify-center gap-3">
                <span className="text-sm" style={{ color: annual ? "rgba(255,255,255,0.35)" : "#fff", fontWeight: annual ? 400 : 500 }}>Monthly</span>
                <button onClick={() => setAnnual(!annual)} className="relative h-6 w-11 rounded-full transition-colors" style={{ background: annual ? "#8B5CF6" : "rgba(255,255,255,0.12)" }}>
                  <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform" style={{ transform: annual ? "translateX(20px)" : "none" }} />
                </button>
                <span className="text-sm" style={{ color: annual ? "#fff" : "rgba(255,255,255,0.35)", fontWeight: annual ? 500 : 400 }}>Annual <span style={{ color: "#8B5CF6", fontSize: 11 }}>(saves 20%)</span></span>
              </div>
            </Reveal>

            {/* Cards */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(tab === "build" ? BUILD : LAUNCH).map((p, i) => {
                const price = annual ? Math.round(p.price * 0.8) : p.price;
                return (
                  <Reveal key={p.name} delay={i * 80}>
                    <div className="card-glow flex flex-col rounded-2xl p-6" style={p.best ? { background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.25)" } : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {p.best && <span className="mb-3 inline-block w-fit rounded-full px-3 py-1 text-[10px] font-semibold" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>Best Value</span>}
                      <h3 className="text-lg font-semibold">{p.name}</h3>
                      <p className="mt-3"><span className="text-3xl font-bold">${price.toLocaleString()}</span><span className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>/mo</span></p>
                      <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{p.credits}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>{p.over}</p>
                      <ul className="mt-5 flex-1 space-y-2">
                        {p.feats.map(f => <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}><span style={{ color: "#8B5CF6" }}>&#10003;</span>{f}</li>)}
                      </ul>
                      <Link href="/auth/login" className="mt-5 block rounded-xl py-2.5 text-center text-sm font-medium transition-all" style={p.best ? { background: "linear-gradient(135deg, #8B5CF6, #7c3aed)", color: "#fff" } : { border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>Get Started</Link>
                    </div>
                  </Reveal>
                );
              })}
            </div>
            <Reveal>
              <p className="mt-8 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                {tab === "build" ? "All Build plans include: Full source code ownership \u00b7 Core product systems \u00b7 Clear, predictable billing" : "All Launch plans include: Managed hosting \u00b7 Monitoring \u00b7 Backups \u00b7 Operational support"}
              </p>
            </Reveal>
          </div>
        </Section>

        {/* ═══ FAQ ═══ */}
        <div className="px-6 sm:px-8 pb-24">
          <div className="mx-auto max-w-2xl">
            <Reveal><h3 className="text-xl font-bold text-center mb-8">Pricing FAQ</h3></Reveal>
            <div className="space-y-3">
              {FAQS.map(([q, a], i) => (
                <Reveal key={i} delay={i * 60}>
                  <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-sm font-medium">{q}</p>
                    <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>{a}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        {/* ═══ WHO IT'S FOR ═══ */}
        <Section>
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(139,92,246,0.7)" }}>Who It&apos;s For</p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold">Built for people who ship</h2>
            </Reveal>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                ["Solo Founder", "You have the idea and need a working product without a long development cycle.", "DeNovo Build from $99/month"],
                ["Operator", "You are launching multiple products, offers, or revenue lines and need a repeatable system.", "DeNovo Build from $249/month"],
                ["Agency", "You deliver software for clients and need faster turnaround with clearer margins.", "DeNovo Build from $999/month\nDeNovo Launch from $549/month"],
              ].map(([t, d, p], i) => (
                <Reveal key={i} delay={i * 120}>
                  <div className="card-glow rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h3 className="text-lg font-semibold">{t}</h3>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{d}</p>
                    <p className="mt-5 text-xs font-medium whitespace-pre-line" style={{ color: "#8B5CF6" }}>{p}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        <Divider />

        {/* ═══ TEMPLATES ═══ */}
        <Section id="templates">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(139,92,246,0.7)" }}>Common Business Models</p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold">Templates for the business models that matter.</h2>
            </Reveal>
            <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TEMPLATES.map(([t, d], i) => (
                <Reveal key={i} delay={i * 60}>
                  <div className="card-glow rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h3 className="font-semibold text-sm">{t}</h3>
                    <p className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal><p className="mt-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Additional configurations available inside the platform.</p></Reveal>
          </div>
        </Section>

        <Divider />

        {/* ═══ TRUST ═══ */}
        <Section>
          <div className="mx-auto max-w-5xl">
            <Reveal><p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(139,92,246,0.7)" }}>Why Buyers Choose DeNovo</p></Reveal>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Clear commercial model", "No token budgeting. No abstract credit math. Build and hosting are priced in terms buyers can understand."],
                ["Production-oriented output", "DeNovo is designed to produce working software intended for real use."],
                ["Flexible handoff", "Take the codebase and run it yourself, or keep the product under managed hosting."],
                ["Built for repeatable launch", "Designed for teams that need to move from concept to usable product with less delivery drag."],
              ].map(([t, d], i) => (
                <Reveal key={i} delay={i * 100}>
                  <div>
                    <h3 className="text-sm font-semibold">{t}</h3>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>

        <Divider />

        {/* ═══ FINAL CTA ═══ */}
        <section className="relative px-6 sm:px-8 py-32 sm:py-40">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[700px] h-[500px] opacity-40" style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.1), transparent 60%)" }} />
          </div>
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <h2 className="text-3xl sm:text-5xl font-bold leading-tight">
                Build the product.<br />
                <span style={{ color: "rgba(255,255,255,0.3)" }}>Keep the momentum.</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-7" style={{ color: "rgba(255,255,255,0.35)" }}>
                Describe what you want to launch. Review the structure.<br />
                Take the code, or let DeNovo run it for you.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <Link href="/auth/login" className="cta-glow mt-10 inline-flex h-14 items-center rounded-xl px-10 text-lg font-semibold text-white" style={{ background: "linear-gradient(135deg, #8B5CF6, #7c3aed)", boxShadow: "0 0 30px rgba(139,92,246,0.25)" }}>
                Start Building
              </Link>
            </Reveal>
            <Reveal delay={300}>
              <p className="mt-8 text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>Build plans include source code delivery. Launch plans include managed hosting.</p>
            </Reveal>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="px-6 sm:px-8 py-14" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-10 sm:grid-cols-4 text-sm">
              {[
                { h: "Product", links: [["Build", "/auth/login"], ["Launch", "/auth/login"], ["Templates", "#templates"], ["Pricing", "#pricing"]] },
                { h: "Company", links: [["About"], ["Blog"], ["Changelog"]] },
                { h: "Legal", links: [["Privacy"], ["Terms"], ["Security"]] },
                { h: "Support", links: [["Docs"], ["Contact"], ["Status"]] },
              ].map(col => (
                <div key={col.h}>
                  <p className="font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{col.h}</p>
                  <div className="mt-3 space-y-2">
                    {col.links.map(([label, href]) => href ? (
                      <Link key={label} href={href} className="block text-xs transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}>{label}</Link>
                    ) : (
                      <span key={label} className="block text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>{label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 flex items-center justify-between pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#8B5CF6" }}>
                  <span className="text-[10px] font-bold text-white">D</span>
                </div>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>DeNovo AI — From description to deployed business.</span>
              </div>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.1)" }}>&copy; {new Date().getFullYear()}</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
