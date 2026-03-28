"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useEffect, useRef, useState } from "react";

/* ── Scroll fade-in ─────────────────────────────── */
function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return v;
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const v = useInView(ref);
  return (
    <div ref={ref} className={`transition-all duration-700 ${v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Terminal demo ──────────────────────────────── */
const DEMO_LINES = [
  { who: "you", text: "I want a marketplace where event photographers sell services to venues." },
  { who: "denovo", text: "Understood. Preparing the product for review." },
  { who: "denovo", text: "Proposed product:" },
  { who: "card", text: "ShootSpace\nService marketplace\nPlatform fee model\nBookings, reviews, messaging" },
  { who: "denovo", text: "Proceed?" },
  { who: "you", text: "Launch it." },
  { who: "status", text: "Structure confirmed" },
  { who: "status", text: "Build complete" },
  { who: "status", text: "Launch complete" },
  { who: "done", text: "ShootSpace is live." },
];

function TerminalDemo() {
  const [lines, setLines] = useState<typeof DEMO_LINES>([]);
  const ref = useRef<HTMLDivElement>(null);
  const vis = useInView(ref);
  const started = useRef(false);

  useEffect(() => {
    if (!vis || started.current) return;
    started.current = true;
    let i = 0;
    const t = setInterval(() => { if (i >= DEMO_LINES.length) { clearInterval(t); return; } setLines(p => [...p, DEMO_LINES[i]]); i++; }, 900);
    return () => clearInterval(t);
  }, [vis]);

  return (
    <div ref={ref} className="relative mx-auto max-w-2xl">
      <div className="absolute -inset-4 rounded-2xl bg-primary/10 blur-2xl" />
      <div className="relative rounded-xl border border-white/10 bg-[#0d1023] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-500/60" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
          <div className="h-3 w-3 rounded-full bg-green-500/60" />
          <span className="ml-3 text-xs text-white/30 font-mono">DeNovo Studio</span>
        </div>
        <div className="p-5 font-mono text-sm min-h-[300px] space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="animate-[fadeInUp_0.4s_ease-out]" style={{ animationFillMode: "both" }}>
              {l.who === "you" && <p><span className="text-primary">You</span> <span className="text-white/80">{l.text}</span></p>}
              {l.who === "denovo" && <p><span className="text-violet-400">DeNovo</span> <span className="text-white/60">{l.text}</span></p>}
              {l.who === "card" && (
                <div className="ml-4 my-1 rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-white/50 whitespace-pre-line text-xs">{l.text}</div>
              )}
              {l.who === "status" && <p className="text-white/30 ml-4">{l.text}</p>}
              {l.who === "done" && <p className="text-green-400 font-semibold mt-1">{l.text}</p>}
            </div>
          ))}
          {lines.length > 0 && lines.length < DEMO_LINES.length && <span className="inline-block h-4 w-2 bg-primary animate-pulse" />}
        </div>
      </div>
    </div>
  );
}

/* ── Pricing data ──────────────────────────────── */
const BUILD_PLANS = [
  { name: "Starter", monthly: 99, credits: "3 app builds/month", overage: "$59/additional app", features: ["Source code delivery", "Email support"] },
  { name: "Builder", monthly: 249, credits: "10 app builds/month", overage: "$69/additional app", features: ["Source code delivery", "Priority support"], best: true },
  { name: "Studio", monthly: 499, credits: "25 app builds/month", overage: "$79/additional app", features: ["Source code delivery", "Priority support"] },
  { name: "Agency", monthly: 999, credits: "60 app builds/month", overage: "$99/additional app", features: ["Source code delivery", "White-label output", "Dedicated support"] },
];
const LAUNCH_PLANS = [
  { name: "Launch 1", monthly: 149, credits: "1 hosted app", overage: "$129/additional app/mo", features: ["Managed hosting", "Monitoring", "Backups", "Operational support"] },
  { name: "Launch 5", monthly: 549, credits: "5 hosted apps", overage: "$139/additional app/mo", features: ["Managed hosting", "Monitoring", "Backups", "Operational support"], best: true },
  { name: "Launch 15", monthly: 1499, credits: "15 hosted apps", overage: "$149/additional app/mo", features: ["Managed hosting", "Monitoring", "Backups", "Operational support"] },
  { name: "Launch 40", monthly: 3499, credits: "40 hosted apps", overage: "$169/additional app/mo", features: ["Managed hosting", "Monitoring", "Backups", "Operational support"] },
];

const TEMPLATES = [
  { name: "Marketplace", desc: "Bookings, services, listings, transactions" },
  { name: "SaaS Tool", desc: "Dashboards, workflows, business utilities" },
  { name: "Client Portal", desc: "Service delivery, approvals, account access" },
  { name: "Internal Tool", desc: "Operations, admin, CRM, reporting" },
  { name: "Commerce", desc: "Digital products, subscriptions, storefronts" },
  { name: "Community", desc: "Membership, gated access, user networks" },
  { name: "Directory", desc: "Discovery, lead generation, resource hubs" },
  { name: "Content Platform", desc: "Publishing, newsletters, education products" },
];

const FAQS = [
  { q: "Can I use Build and Launch together?", a: "Yes. Generate with Build, then add Launch for any app you want hosted and maintained." },
  { q: "What happens if I hit my limit?", a: "Additional builds or hosted apps are billed at the published overage rate." },
  { q: "Do unused allocations roll over?", a: "Monthly allocations reset each billing cycle. Annual plans receive annual allocation across the term." },
  { q: "Can I cancel?", a: "Monthly plans cancel with 30 days' notice. Annual plans are non-refundable." },
  { q: "Who owns the code?", a: "For Build plans, you own the delivered codebase." },
];

/* ── cn helper ─────────────────────────────────── */
function cn(...c: (string | boolean | undefined)[]) { return c.filter(Boolean).join(" "); }

/* ── Page ──────────────────────────────────────── */
export default function LandingPage() {
  const [annual, setAnnual] = useState(false);
  const [pricingTab, setPricingTab] = useState<"build" | "launch">("build");

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <Navbar />
      <main>
        {/* ── HERO ─────────────────────────────── */}
        <section className="relative overflow-hidden px-4 pt-28 pb-24 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-[-200px] h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/20 via-violet-500/10 to-transparent blur-[100px] animate-[pulse_8s_ease-in-out_infinite]" />
            <div className="absolute right-[-200px] top-[100px] h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-blue-500/10 via-transparent to-transparent blur-[80px] animate-[pulse_12s_ease-in-out_infinite_reverse]" />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          </div>
          <div className="mx-auto max-w-4xl text-center">
            <FadeIn><p className="inline-block rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-8">The AI App Factory</p></FadeIn>
            <FadeIn delay={100}>
              <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl" style={{ textWrap: "balance" } as React.CSSProperties}>
                From idea to{" "}
                <span className="bg-gradient-to-r from-primary via-violet-400 to-blue-400 bg-clip-text text-transparent">deployed business.</span>
              </h1>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="mt-8 text-lg text-white/50 sm:text-xl max-w-2xl mx-auto leading-relaxed">
                DeNovo turns a plain-English brief into production software.<br className="hidden sm:block" />
                Take the code, or let us run the product for you.
              </p>
            </FadeIn>
            <FadeIn delay={300}>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link href="/auth/login" className="group inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-base font-medium text-white transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]">Start Building</Link>
                <button onClick={() => scrollTo("how")} className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/10 px-8 text-base font-medium text-white/70 transition-all hover:border-white/20 hover:text-white">See How It Works</button>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── TERMINAL DEMO ────────────────────── */}
        <section className="px-4 pb-24 sm:px-6 lg:px-8"><FadeIn><TerminalDemo /></FadeIn></section>

        {/* ── SUPPORT ROW ──────────────────────── */}
        <section className="border-t border-white/5 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl grid grid-cols-3 gap-8 text-center">
            {["Plain-English input", "Production-ready output", "Optional managed hosting"].map((t, i) => (
              <FadeIn key={i} delay={i * 100}><p className="text-sm font-medium text-white/50">{t}</p></FadeIn>
            ))}
          </div>
        </section>

        {/* ── PROBLEM ──────────────────────────── */}
        <section className="border-t border-white/5 px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <FadeIn><h2 className="text-3xl font-bold sm:text-5xl">Most tools generate output.<br /><span className="text-white/40">DeNovo delivers product.</span></h2></FadeIn>
            <FadeIn delay={100}>
              <p className="mt-8 text-white/40 leading-relaxed text-lg">
                Code alone is not the asset. A usable, launch-ready application is.
              </p>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="mt-4 text-white/40 leading-relaxed">
                DeNovo is built for founders, operators, and agencies who want a faster path from concept to working software without turning every build into a custom engineering project.
              </p>
            </FadeIn>
            <FadeIn delay={300}>
              <p className="mt-6 text-sm font-medium text-primary">DeNovo charges for software shipped, not prompts consumed.</p>
            </FadeIn>
          </div>
        </section>

        {/* ── WHAT YOU GET ─────────────────────── */}
        <section className="border-t border-white/5 px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <p className="text-xs font-medium tracking-widest text-primary/70 uppercase">What You Get</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A clearer path from concept to launch</h2>
            </FadeIn>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { title: "Production application", desc: "A complete application with the core systems required to launch." },
                { title: "Review before build", desc: "You confirm the product structure, features, and business model before work begins." },
                { title: "Flexible handoff", desc: "Take the codebase in-house, or keep the product under managed operation." },
              ].map((c, i) => (
                <FadeIn key={i} delay={i * 120}>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-primary/20 hover:bg-white/[0.04]">
                    <h3 className="text-lg font-semibold">{c.title}</h3>
                    <p className="mt-3 text-sm text-white/40 leading-relaxed">{c.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────── */}
        <section id="how" className="border-t border-white/5 px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <p className="text-xs font-medium tracking-widest text-primary/70 uppercase">The Process</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Three steps to a working product</h2>
            </FadeIn>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {[
                { n: "01", title: "Describe", desc: "Tell DeNovo what you want to build in plain English." },
                { n: "02", title: "Review", desc: "Confirm the proposed structure, core features, and commercial model before build begins." },
                { n: "03", title: "Build or Launch", desc: "Receive the codebase, or let DeNovo host and operate the product for you." },
              ].map((s, i) => (
                <FadeIn key={s.n} delay={i * 150}>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-primary/20">
                    <span className="text-5xl font-bold bg-gradient-to-b from-primary/40 to-primary/10 bg-clip-text text-transparent">{s.n}</span>
                    <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
                    <p className="mt-3 text-sm text-white/40 leading-relaxed">{s.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── BUILD VS LAUNCH ──────────────────── */}
        <section className="border-t border-white/5 px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <p className="text-xs font-medium tracking-widest text-primary/70 uppercase">Two Products</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Take the code. Or let us run it.</h2>
            </FadeIn>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <FadeIn delay={0}>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
                  <h3 className="text-xl font-bold">DeNovo Build</h3>
                  <p className="mt-1 text-sm text-white/40">Generate and take the code.</p>
                  <ul className="mt-6 space-y-2 text-sm text-white/50">
                    {["Full application codebase", "Core product systems included", "Source code delivery", "Ownership of delivered code"].map(f => (
                      <li key={f} className="flex items-center gap-2"><span className="text-primary">&#10003;</span>{f}</li>
                    ))}
                  </ul>
                  <p className="mt-6 text-xs text-white/30">Best for: developers, agencies, technical founders</p>
                  <p className="mt-2 text-sm text-white/50">Starting at <span className="text-white font-semibold">$99/month</span></p>
                  <Link href="/auth/login" className="mt-4 block rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-white hover:bg-primary/90 transition-colors">Start Building</Link>
                </div>
              </FadeIn>
              <FadeIn delay={150}>
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8">
                  <h3 className="text-xl font-bold">DeNovo Launch</h3>
                  <p className="mt-1 text-sm text-white/40">We host and run it for you.</p>
                  <p className="mt-4 text-xs text-white/30">Everything in Build, plus:</p>
                  <ul className="mt-3 space-y-2 text-sm text-white/50">
                    {["Managed hosting", "Maintenance", "Monitoring", "Backups", "Operational support"].map(f => (
                      <li key={f} className="flex items-center gap-2"><span className="text-primary">&#10003;</span>{f}</li>
                    ))}
                  </ul>
                  <p className="mt-6 text-xs text-white/30">Best for: non-technical founders, operators, lean teams</p>
                  <p className="mt-2 text-sm text-white/50">Starting at <span className="text-white font-semibold">$149/month per app</span></p>
                  <Link href="/auth/login" className="mt-4 block rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-white hover:bg-primary/90 transition-colors">Launch Your Business</Link>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────── */}
        <section id="pricing" className="border-t border-white/5 px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <p className="text-xs font-medium tracking-widest text-primary/70 uppercase text-center">Pricing</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl text-center">Simple pricing for software that ships</h2>
              <p className="mt-4 text-center text-white/40">Choose Build if you want the code. Choose Launch if you want the product hosted and operated for you.</p>
            </FadeIn>

            {/* Tabs */}
            <div className="mt-10 flex items-center justify-center gap-1 rounded-xl bg-white/[0.03] p-1 max-w-sm mx-auto">
              {(["build", "launch"] as const).map(t => (
                <button key={t} onClick={() => setPricingTab(t)} className={cn("flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize", pricingTab === t ? "bg-background text-foreground shadow" : "text-white/40 hover:text-white/60")}>{t}</button>
              ))}
            </div>

            {/* Toggle */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className={cn("text-sm", !annual && "text-white font-medium")}>Monthly</span>
              <button onClick={() => setAnnual(!annual)} className={cn("relative h-6 w-11 rounded-full transition-colors", annual ? "bg-primary" : "bg-white/10")}>
                <span className={cn("absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform", annual && "translate-x-5")} />
              </button>
              <span className={cn("text-sm", annual && "text-white font-medium")}>Annual <span className="text-primary text-xs">(saves 20%)</span></span>
            </div>

            {/* Cards */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(pricingTab === "build" ? BUILD_PLANS : LAUNCH_PLANS).map((p, i) => {
                const price = annual ? Math.round(p.monthly * 0.8) : p.monthly;
                return (
                  <FadeIn key={p.name} delay={i * 80}>
                    <div className={cn("rounded-xl border p-6 flex flex-col", p.best ? "border-primary bg-primary/5" : "border-white/5 bg-white/[0.02]")}>
                      {p.best && <span className="mb-3 inline-block w-fit rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">Best Value</span>}
                      <h3 className="text-lg font-semibold">{p.name}</h3>
                      <p className="mt-2"><span className="text-3xl font-bold">${price.toLocaleString()}</span><span className="text-sm text-white/30">/mo</span></p>
                      <p className="mt-1 text-sm text-white/40">{p.credits}</p>
                      <p className="mt-0.5 text-xs text-white/25">{p.overage}</p>
                      <ul className="mt-5 flex-1 space-y-1.5">
                        {p.features.map(f => <li key={f} className="flex items-center gap-2 text-xs text-white/40"><span className="text-primary">&#10003;</span>{f}</li>)}
                      </ul>
                      <Link href="/auth/login" className={cn("mt-5 block rounded-lg py-2 text-center text-sm font-medium transition-colors", p.best ? "bg-primary text-white hover:bg-primary/90" : "border border-white/10 text-white/60 hover:border-white/20 hover:text-white")}>Get Started</Link>
                    </div>
                  </FadeIn>
                );
              })}
            </div>

            <FadeIn>
              <p className="mt-6 text-center text-xs text-white/25">
                {pricingTab === "build"
                  ? "All Build plans include: Full source code ownership · Core product systems · Clear, predictable billing"
                  : "All Launch plans include: Managed hosting · Monitoring · Backups · Operational support"}
              </p>
            </FadeIn>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────── */}
        <section className="border-t border-white/5 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <FadeIn><h3 className="text-xl font-bold text-center mb-8">Pricing FAQ</h3></FadeIn>
            <div className="space-y-4">
              {FAQS.map((f, i) => (
                <FadeIn key={i} delay={i * 60}>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                    <p className="text-sm font-medium">{f.q}</p>
                    <p className="mt-2 text-sm text-white/40">{f.a}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHO IT'S FOR ─────────────────────── */}
        <section className="border-t border-white/5 px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <p className="text-xs font-medium tracking-widest text-primary/70 uppercase">Who It&apos;s For</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Built for people who ship</h2>
            </FadeIn>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { title: "Solo Founder", desc: "You have the idea and need a working product without a long development cycle.", price: "DeNovo Build from $99/month" },
                { title: "Operator", desc: "You are launching multiple products, offers, or revenue lines and need a repeatable system.", price: "DeNovo Build from $249/month" },
                { title: "Agency", desc: "You deliver software for clients and need faster turnaround with clearer margins.", price: "DeNovo Build from $999/month\nDeNovo Launch from $549/month" },
              ].map((p, i) => (
                <FadeIn key={i} delay={i * 120}>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 hover:border-primary/20 transition-all">
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    <p className="mt-3 text-sm text-white/40 leading-relaxed">{p.desc}</p>
                    <p className="mt-4 text-xs text-primary whitespace-pre-line">{p.price}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── TEMPLATES ────────────────────────── */}
        <section className="border-t border-white/5 px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <p className="text-xs font-medium tracking-widest text-primary/70 uppercase">Common Business Models</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Templates for the business models that matter.</h2>
            </FadeIn>
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TEMPLATES.map((t, i) => (
                <FadeIn key={i} delay={i * 60}>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:border-primary/20 hover:bg-white/[0.04] transition-all">
                    <h3 className="font-semibold text-white/90">{t.name}</h3>
                    <p className="mt-1.5 text-xs text-white/30">{t.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
            <FadeIn><p className="mt-6 text-center text-xs text-white/25">Additional configurations available inside the platform.</p></FadeIn>
          </div>
        </section>

        {/* ── TRUST ────────────────────────────── */}
        <section className="border-t border-white/5 px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <p className="text-xs font-medium tracking-widest text-primary/70 uppercase">Why Buyers Choose DeNovo</p>
            </FadeIn>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Clear commercial model", desc: "No token budgeting. No abstract credit math. Build and hosting are priced in terms buyers can understand." },
                { title: "Production-oriented output", desc: "DeNovo is designed to produce working software intended for real use." },
                { title: "Flexible handoff", desc: "Take the codebase and run it yourself, or keep the product under managed hosting." },
                { title: "Built for repeatable launch", desc: "Designed for teams that need to move from concept to usable product with less delivery drag." },
              ].map((c, i) => (
                <FadeIn key={i} delay={i * 100}>
                  <div>
                    <h3 className="font-semibold text-sm">{c.title}</h3>
                    <p className="mt-2 text-xs text-white/30 leading-relaxed">{c.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────── */}
        <section className="relative border-t border-white/5 px-4 py-28 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10"><div className="absolute left-1/2 bottom-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" /></div>
          <div className="mx-auto max-w-2xl text-center">
            <FadeIn><h2 className="text-3xl font-bold sm:text-5xl" style={{ textWrap: "balance" } as React.CSSProperties}>Build the product.<br /><span className="text-white/40">Keep the momentum.</span></h2></FadeIn>
            <FadeIn delay={100}>
              <p className="mt-6 text-white/40">Describe what you want to launch. Review the structure.<br />Take the code, or let DeNovo run it for you.</p>
            </FadeIn>
            <FadeIn delay={200}>
              <Link href="/auth/login" className="mt-10 inline-flex h-14 items-center gap-2 rounded-lg bg-primary px-10 text-lg font-medium text-white transition-all hover:bg-primary/90 hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]">Start Building</Link>
            </FadeIn>
            <FadeIn delay={300}><p className="mt-6 text-xs text-white/20">Build plans include source code delivery. Launch plans include managed hosting.</p></FadeIn>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────── */}
        <footer className="border-t border-white/5 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 sm:grid-cols-4 text-sm">
              <div>
                <p className="font-medium text-white/50 mb-3">Product</p>
                <div className="space-y-2 text-white/25">
                  <Link href="/auth/login" className="block hover:text-white/40">Build</Link>
                  <Link href="/auth/login" className="block hover:text-white/40">Launch</Link>
                  <button onClick={() => scrollTo("templates")} className="block hover:text-white/40">Templates</button>
                  <button onClick={() => scrollTo("pricing")} className="block hover:text-white/40">Pricing</button>
                </div>
              </div>
              <div>
                <p className="font-medium text-white/50 mb-3">Company</p>
                <div className="space-y-2 text-white/25">
                  <span className="block">About</span>
                  <span className="block">Blog</span>
                  <span className="block">Changelog</span>
                </div>
              </div>
              <div>
                <p className="font-medium text-white/50 mb-3">Legal</p>
                <div className="space-y-2 text-white/25">
                  <span className="block">Privacy</span>
                  <span className="block">Terms</span>
                  <span className="block">Security</span>
                </div>
              </div>
              <div>
                <p className="font-medium text-white/50 mb-3">Support</p>
                <div className="space-y-2 text-white/25">
                  <span className="block">Docs</span>
                  <span className="block">Contact</span>
                  <span className="block">Status</span>
                </div>
              </div>
            </div>
            <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary"><span className="text-[10px] font-bold text-white">D</span></div>
                <span className="text-xs text-white/20">DeNovo AI — From description to deployed business.</span>
              </div>
              <span className="text-xs text-white/15">&copy; {new Date().getFullYear()}</span>
            </div>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
