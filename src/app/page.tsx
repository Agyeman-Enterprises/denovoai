"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useEffect, useRef, useState } from "react";

/* ── helpers ──────────────────────────────────── */
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
    <div ref={ref} className={className} style={{
      opacity: v ? 1 : 0,
      transform: v ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>{children}</div>
  );
}

/* ── constants ────────────────────────────────── */
const CATEGORIES = ["SaaS Platforms","Marketing Sites","Mobile Apps","E-Commerce","Internal Tools","AI Products","Design Systems","API Platforms"];
const PROCESS = [
  { n:"01", title:"Brief the Studio", body:"Tell us what you're building. A conversation is enough — no decks needed." },
  { n:"02", title:"Design & Engineer", body:"We design every screen and write production-ready code from the same source." },
  { n:"03", title:"Ship to the World", body:"We handle Vercel deploy, domain, SSL, and hand you a live URL + clean codebase." },
];
const FEATURES = [
  "Full UI & UX design",
  "React / Next.js codebase",
  "Auth, DB, API layers",
  "Git handoff + docs",
  "Vercel hosting setup",
  "Domain & SSL",
  "CI/CD pipeline",
  "Ongoing maintenance",
];
const TESTIMONIALS = [
  { quote: "AE shipped our entire product — design, code, and Vercel deploy — in three weeks. The codebase is actually clean.", name: "Sarah K.", role: "Founder, Shopify" },
  { quote: "Well struggled to find a team that could design AND engineer. AE just did it. No handoff. No drama.", name: "Marcus L.", role: "CPO, Founder" },
  { quote: "The design quality rivals any Figma agency, and the code actually runs in production first combo.", name: "Priya H.", role: "Head of Product, Artilo" },
];

const orange = "#F5530A";
const bg = "#08080D";
const cardBg = "#0F0F18";
const border = "rgba(255,255,255,0.07)";
const muted = "rgba(255,255,255,0.35)";
const dimmed = "rgba(255,255,255,0.18)";

/* ── Product mockup ───────────────────────────── */
function ProductMockup() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 560 }}>
      {/* Glow */}
      <div style={{ position: "absolute", inset: "-20%", borderRadius: "50%", background: "radial-gradient(circle, rgba(245,83,10,0.12) 0%, transparent 65%)", filter: "blur(40px)", pointerEvents: "none" }} />
      {/* Window chrome */}
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${border}`, background: "linear-gradient(160deg, #141420 0%, #0a0a15 100%)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
        {/* Titlebar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: `1px solid ${border}` }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
          <div style={{ flex: 1, marginLeft: 8, height: 20, borderRadius: 6, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>studio.agyemanenterprises.com</span>
          </div>
        </div>
        {/* App content */}
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Status badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,83,10,0.12)", border: "1px solid rgba(245,83,10,0.25)", borderRadius: 20, padding: "5px 12px", alignSelf: "flex-start" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: orange }} />
            <span style={{ fontSize: 11, color: orange, fontWeight: 600 }}>Project deployed — awaiting approval</span>
          </div>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[["$24,780","Revenue"],["1,428","Users"],["890","Sessions"],].map(([v,l]) => (
              <div key={l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px", border: `1px solid ${border}` }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{v}</p>
                <p style={{ fontSize: 11, color: muted, margin: "2px 0 0" }}>{l}</p>
              </div>
            ))}
          </div>
          {/* Mini chart placeholder */}
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, border: `1px solid ${border}`, padding: 16, height: 100, position: "relative", overflow: "hidden" }}>
            <svg width="100%" height="100%" viewBox="0 0 400 80" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={orange} stopOpacity="0.3"/>
                  <stop offset="100%" stopColor={orange} stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0,60 C40,55 80,45 120,40 C160,35 180,50 220,30 C260,10 300,20 340,15 C370,12 385,18 400,10 L400,80 L0,80 Z" fill="url(#cg)"/>
              <path d="M0,60 C40,55 80,45 120,40 C160,35 180,50 220,30 C260,10 300,20 340,15 C370,12 385,18 400,10" fill="none" stroke={orange} strokeWidth="2"/>
            </svg>
          </div>
          {/* Activity items */}
          {[["ShootSpace","Live in production"],["Atlas CRM","Build complete"],].map(([name, status]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: `1px solid ${border}` }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{name}</span>
              <span style={{ fontSize: 11, color: status === "Live in production" ? "#34d399" : muted }}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────── */
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main style={{ background: bg, color: "#fff" }}>

        {/* ═══ HERO ═══ */}
        <section style={{ padding: "clamp(64px,10vw,120px) clamp(24px,6vw,80px) clamp(64px,8vw,100px)", maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px,6vw,80px)", alignItems: "center" }}>
          <div>
            <Reveal>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,83,10,0.08)", border: "1px solid rgba(245,83,10,0.2)", borderRadius: 20, padding: "5px 14px", marginBottom: 28 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: orange }} />
                <span style={{ fontSize: 11, color: orange, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Full-stack. One team. Zero handoff.</span>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <h1 style={{ fontSize: "clamp(3rem,6vw,5.5rem)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.04em", margin: "0 0 24px" }}>
                Design.<br />
                <em style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", color: orange, fontWeight: 700 }}>Engineer.</em><br />
                Deploy.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p style={{ fontSize: "clamp(0.95rem,1.4vw,1.1rem)", color: muted, lineHeight: 1.7, maxWidth: 400, marginBottom: 36 }}>
                From brand identity and UX to production code and live hosting — AE Design Studio ships the whole product.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 52 }}>
                <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: orange, color: "#fff", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: `0 0 32px rgba(245,83,10,0.3)` }}>
                  Start your project
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2.5 7.5h10M9 4l3.5 3.5L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
                <button onClick={() => document.getElementById("process")?.scrollIntoView({ behavior: "smooth" })} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", border: `1px solid ${border}`, color: muted, padding: "14px 24px", borderRadius: 10, fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 7l1.5 1.5L9 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  See how it works
                </button>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div style={{ display: "flex", gap: 36 }}>
                {[["200+","Products shipped"],["48h","Avg first design"],["100%","Code ownership"]].map(([n,l]) => (
                  <div key={l}>
                    <p style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>{n}</p>
                    <p style={{ fontSize: 11, color: dimmed, margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <ProductMockup />
          </Reveal>
        </section>

        {/* ═══ MARQUEE ═══ */}
        <div style={{ borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, padding: "16px 0", overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 56, whiteSpace: "nowrap", animation: "marquee 24s linear infinite" }}>
            {[...Array(4)].flatMap(() => CATEGORIES).map((t, i) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 600, color: dimmed, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t}</span>
            ))}
          </div>
          <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-25%)}}`}</style>
        </div>

        {/* ═══ PROCESS ═══ */}
        <section id="process" style={{ padding: "clamp(80px,10vw,140px) clamp(24px,6vw,80px)", maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24, marginBottom: "clamp(48px,6vw,72px)" }}>
              <div>
                <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: orange, fontWeight: 600, marginBottom: 14 }}>The Process</p>
                <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
                  Three steps. <em style={{ fontFamily: "var(--font-playfair)", color: orange, fontStyle: "italic" }}>One studio.</em>
                </h2>
              </div>
              <p style={{ fontSize: 14, color: muted, maxWidth: 300, lineHeight: 1.65 }}>No agency bloat. Just a tight loop from concept to code.</p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
            {PROCESS.map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div style={{ padding: "clamp(28px,3vw,44px)", border: `1px solid ${border}`, borderRight: i < 2 ? "none" : `1px solid ${border}`, background: cardBg, position: "relative" }}>
                  {/* Connector dot */}
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: i === 1 ? orange : "rgba(255,255,255,0.06)", border: `1px solid ${i === 1 ? orange : border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: i === 1 ? "#fff" : dimmed }}>{s.n}</span>
                  </div>
                  <h3 style={{ fontSize: "clamp(1rem,1.5vw,1.2rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: muted, lineHeight: 1.7, margin: 0 }}>{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══ WHAT WE BUILD ═══ */}
        <section id="work" style={{ padding: "0 clamp(24px,6vw,80px) clamp(80px,10vw,140px)", maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>
              If it runs in a browser,
            </h2>
            <h2 style={{ fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "clamp(36px,5vw,56px)" }}>
              <em style={{ fontFamily: "var(--font-playfair)", color: orange, fontStyle: "italic" }}>we build it.</em>
              <span style={{ fontSize: 14, fontWeight: 500, color: muted, marginLeft: 20, fontFamily: "var(--font-geist-sans)", fontStyle: "normal", verticalAlign: "middle" }}>
                Apps, platforms, storefronts, tools — whatever shape your idea takes, we design and engineer it end-to-end.
              </span>
            </h2>
          </Reveal>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[...CATEGORIES, "+ your idea"].map((t, i) => (
              <Reveal key={t} delay={i * 40}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 100,
                  border: `1px solid ${t === "+ your idea" ? orange : border}`,
                  background: t === "+ your idea" ? `rgba(245,83,10,0.1)` : "rgba(255,255,255,0.03)",
                  fontSize: 13, fontWeight: 600,
                  color: t === "+ your idea" ? orange : "rgba(255,255,255,0.6)",
                }}>
                  {t}
                </span>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══ PACKAGES ═══ */}
        <section style={{ padding: "0 clamp(24px,6vw,80px) clamp(80px,10vw,140px)", maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: orange, fontWeight: 600, marginBottom: 14 }}>Our Packages</p>
            <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "clamp(40px,5vw,60px)" }}>
              Two tiers. <em style={{ fontFamily: "var(--font-playfair)", color: orange, fontStyle: "italic" }}>One studio.</em>
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>
            {/* Feature labels col */}
            <div style={{ background: cardBg }}>
              <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${border}` }}>
                <p style={{ fontSize: 12, color: dimmed, margin: 0 }}>What&apos;s included</p>
              </div>
              {FEATURES.map((f, i) => (
                <div key={f} style={{ padding: "14px 28px", borderBottom: i < FEATURES.length - 1 ? `1px solid ${border}` : "none" }}>
                  <p style={{ fontSize: 13, color: muted, margin: 0 }}>{f}</p>
                </div>
              ))}
              <div style={{ padding: "20px 28px", borderTop: `1px solid ${border}` }} />
            </div>
            {/* Build col */}
            <div style={{ borderLeft: `1px solid ${border}`, background: cardBg }}>
              <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${border}` }}>
                <p style={{ fontSize: 11, color: dimmed, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>Tier 01</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>Build</p>
                <p style={{ fontSize: 12, color: muted, margin: "2px 0 0" }}>You own the codebase</p>
              </div>
              {FEATURES.map((f, i) => (
                <div key={f} style={{ padding: "14px 28px", borderBottom: i < FEATURES.length - 1 ? `1px solid ${border}` : "none", display: "flex", alignItems: "center" }}>
                  {i < 4 ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="rgba(245,83,10,0.15)"/><path d="M5 8l2.5 2.5L11 5.5" stroke={orange} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <span style={{ fontSize: 16, color: dimmed }}>—</span>
                  )}
                </div>
              ))}
              <div style={{ padding: "20px 28px", borderTop: `1px solid ${border}` }}>
                <Link href="/auth/login" style={{ display: "block", textAlign: "center", padding: "11px 0", borderRadius: 8, border: `1px solid ${border}`, color: muted, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Get a Build quote</Link>
              </div>
            </div>
            {/* Launch col */}
            <div style={{ borderLeft: `1px solid ${border}`, background: orange }}>
              <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>Tier 02</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>Launch</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>We run it for you</p>
              </div>
              {FEATURES.map((f, i) => (
                <div key={f} style={{ padding: "14px 28px", borderBottom: i < FEATURES.length - 1 ? "1px solid rgba(255,255,255,0.12)" : "none", display: "flex", alignItems: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="rgba(255,255,255,0.2)"/><path d="M5 8l2.5 2.5L11 5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              ))}
              <div style={{ padding: "20px 28px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                <Link href="/auth/login" style={{ display: "block", textAlign: "center", padding: "11px 0", borderRadius: 8, background: "#fff", color: orange, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Get a Launch quote</Link>
              </div>
            </div>
          </div>
          {/* Enterprise row */}
          <Reveal>
            <div style={{ marginTop: 2, border: `1px solid ${border}`, borderRadius: 12, padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: cardBg }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Enterprise & Agency</span>
                <span style={{ fontSize: 13, color: muted, marginLeft: 16 }}>Multiple products, dedicated team, white-label output</span>
              </div>
              <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: orange, textDecoration: "none" }}>
                Contact us
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ═══ CTA + TESTIMONIALS ═══ */}
        <section style={{ padding: "0 clamp(24px,6vw,80px) clamp(80px,10vw,140px)", maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px,5vw,64px)", alignItems: "start" }}>
          <Reveal>
            <div style={{ background: "linear-gradient(135deg, #141420 0%, #0e0e1a 100%)", border: `1px solid ${border}`, borderRadius: 20, padding: "clamp(32px,4vw,52px)" }}>
              <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: orange, fontWeight: 600, marginBottom: 20 }}>Ready</p>
              <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16 }}>
                Your next product starts with{" "}
                <em style={{ fontFamily: "var(--font-playfair)", color: orange, fontStyle: "italic" }}>a conversation.</em>
              </h2>
              <p style={{ fontSize: 14, color: muted, lineHeight: 1.7, marginBottom: 32 }}>
                Tell us what you want to build. We&apos;ll tell you how we&apos;ll make it great — and ship it faster than you think.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: orange, color: "#fff", padding: "13px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: `0 0 24px rgba(245,83,10,0.25)` }}>
                  Start your project ↗
                </Link>
                <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${border}`, color: muted, padding: "13px 24px", borderRadius: 10, fontWeight: 500, fontSize: 14, textDecoration: "none" }}>
                  Book a 20-min call
                </Link>
              </div>
            </div>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "20px 24px" }}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: "0 0 16px", fontStyle: "italic" }}>&ldquo;{t.quote}&rdquo;</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${orange}, #ff8c6a)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{t.name[0]}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>{t.name}</p>
                      <p style={{ fontSize: 11, color: dimmed, margin: 0 }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer style={{ borderTop: `1px solid ${border}`, padding: "clamp(36px,4vw,52px) clamp(24px,6vw,80px)" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>AE</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Design Studio</span>
              </div>
              <p style={{ fontSize: 12, color: dimmed, maxWidth: 220, lineHeight: 1.6 }}>Agyeman Enterprises &copy; {new Date().getFullYear()}</p>
            </div>
            <div style={{ display: "flex", gap: "clamp(28px,5vw,64px)", flexWrap: "wrap" }}>
              {[
                { h: "Product", links: [["Work","/#work"],["Process","/#process"],["Pricing","/pricing"],["Studio","/auth/login"]] },
                { h: "Legal", links: [["Privacy","/privacy"],["Terms","/terms"],["Security","/security"],["Acceptable Use","/acceptable-use"]] },
                { h: "Company", links: [["About",""],["Contact",""],["Status",""]] },
              ].map(col => (
                <div key={col.h}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: dimmed, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>{col.h}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {col.links.map(([label, href]) => href ? (
                      <Link key={label} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>{label}</Link>
                    ) : (
                      <span key={label} style={{ fontSize: 13, color: "rgba(255,255,255,0.15)" }}>{label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
