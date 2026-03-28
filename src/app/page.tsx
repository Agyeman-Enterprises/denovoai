"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { TEMPLATE_INFO } from "@/types/denovo";
import type { TemplateType } from "@/types/database";
import { useEffect, useRef, useState } from "react";

const STEPS = [
  { num: "01", title: "Describe", desc: "Tell DeNovo what you want to build in plain English. Our AI understands context, not keywords." },
  { num: "02", title: "Review", desc: "See exactly what will be built — template, features, database schema. Edit anything before committing." },
  { num: "03", title: "Deploy", desc: "One click. Your app is live on its own domain with auth, payments, and a database — fully yours." },
];

const TYPING_LINES = [
  { type: "user", text: "I want a marketplace for African fashion designers to sell their work" },
  { type: "ai", text: "Got it — AfriThread, a fashion marketplace." },
  { type: "ai", text: "Template: Marketplace | Sellers: Designers | Buyers: Shoppers" },
  { type: "ai", text: "Features: File upload, Reviews, Messaging, Stripe Connect" },
  { type: "status", text: "Assembling..." },
  { type: "status", text: "Template cloned ............ done" },
  { type: "status", text: "Tokens applied (47 files) .. done" },
  { type: "status", text: "Snippets injected .......... done" },
  { type: "status", text: "Schema generated ........... done" },
  { type: "done", text: "AfriThread is live at afrithread.denovoai.co" },
];

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

function TerminalDemo() {
  const [lines, setLines] = useState<typeof TYPING_LINES>([]);
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  const started = useRef(false);

  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    let i = 0;
    const interval = setInterval(() => {
      if (i >= TYPING_LINES.length) { clearInterval(interval); return; }
      setLines(prev => [...prev, TYPING_LINES[i]]);
      i++;
    }, 800);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <div ref={ref} className="relative mx-auto max-w-2xl">
      {/* Glow behind terminal */}
      <div className="absolute -inset-4 rounded-2xl bg-primary/10 blur-2xl" />
      <div className="relative rounded-xl border border-border bg-[#0d1023] shadow-2xl shadow-primary/5 overflow-hidden">
        {/* Chrome bar */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-500/60" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
          <div className="h-3 w-3 rounded-full bg-green-500/60" />
          <span className="ml-3 text-xs text-white/30 font-mono">DeNovo Studio</span>
        </div>
        {/* Terminal content */}
        <div className="p-5 font-mono text-sm min-h-[280px] space-y-1.5">
          {lines.map((line, i) => (
            <div
              key={i}
              className="animate-[fadeInUp_0.4s_ease-out]"
              style={{ animationFillMode: "both", animationDelay: "0ms" }}
            >
              {line.type === "user" && (
                <p><span className="text-primary">you &gt;</span> <span className="text-white/90">{line.text}</span></p>
              )}
              {line.type === "ai" && (
                <p><span className="text-violet-400">denovo &gt;</span> <span className="text-white/70">{line.text}</span></p>
              )}
              {line.type === "status" && (
                <p className="text-white/40">{line.text}</p>
              )}
              {line.type === "done" && (
                <p className="text-green-400 font-semibold mt-2">{line.text}</p>
              )}
            </div>
          ))}
          {lines.length < TYPING_LINES.length && lines.length > 0 && (
            <span className="inline-block h-4 w-2 bg-primary animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pt-28 pb-24 sm:px-6 lg:px-8">
          {/* Animated mesh gradient background */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-[-200px] h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/20 via-violet-500/10 to-transparent blur-[100px] animate-[pulse_8s_ease-in-out_infinite]" />
            <div className="absolute right-[-200px] top-[100px] h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-blue-500/10 via-transparent to-transparent blur-[80px] animate-[pulse_12s_ease-in-out_infinite_reverse]" />
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <FadeIn>
              <p className="inline-block rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-8">
                The AI App Factory
              </p>
            </FadeIn>
            <FadeIn delay={100}>
              <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl" style={{ textWrap: "balance" } as React.CSSProperties}>
                Describe an app.{" "}
                <span className="bg-gradient-to-r from-primary via-violet-400 to-blue-400 bg-clip-text text-transparent">
                  Get a deployed product.
                </span>
              </h1>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="mt-8 text-lg text-white/50 sm:text-xl max-w-2xl mx-auto leading-relaxed">
                DeNovo turns plain English into live web applications with auth,
                payments, and a database. Deployed in minutes, not months.
              </p>
            </FadeIn>
            <FadeIn delay={300}>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link
                  href="/studio"
                  className="group relative inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-base font-medium text-white transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]"
                >
                  Start Building Free
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/10 px-8 text-base font-medium text-white/70 transition-all hover:border-white/20 hover:text-white"
                >
                  View Pricing
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Terminal Demo */}
        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <FadeIn>
            <TerminalDemo />
          </FadeIn>
        </section>

        {/* How it works */}
        <section className="relative border-t border-white/5 px-4 py-28 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <FadeIn>
              <h2 className="text-center text-3xl font-bold sm:text-5xl">
                Three steps. One product.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-center text-white/40">
                From idea to deployed app in under five minutes.
              </p>
            </FadeIn>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <FadeIn key={step.num} delay={i * 150}>
                  <div className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-primary/30 hover:bg-white/[0.04]">
                    <span className="text-5xl font-bold bg-gradient-to-b from-primary/40 to-primary/10 bg-clip-text text-transparent">{step.num}</span>
                    <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                    <p className="mt-3 text-sm text-white/40 leading-relaxed">{step.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Templates */}
        <section className="relative border-t border-white/5 px-4 py-28 sm:px-6 lg:px-8">
          {/* Accent gradient */}
          <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
          <div className="mx-auto max-w-5xl relative">
            <FadeIn>
              <h2 className="text-center text-3xl font-bold sm:text-5xl">
                8 battle-tested templates
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-center text-white/40">
                Each template is a production-ready Next.js app. Auth, payments, admin panel — all built in.
              </p>
            </FadeIn>
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.entries(TEMPLATE_INFO) as [TemplateType, (typeof TEMPLATE_INFO)[TemplateType]][]).map(
                ([key, info], i) => (
                  <FadeIn key={key} delay={i * 80}>
                    <div className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-primary/30 hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(139,92,246,0.05)]">
                      <h3 className="font-semibold text-white/90">{info.label}</h3>
                      <p className="mt-1.5 text-xs text-white/30 leading-relaxed">{info.description}</p>
                    </div>
                  </FadeIn>
                )
              )}
            </div>
          </div>
        </section>

        {/* Social proof / stats */}
        <section className="border-t border-white/5 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-3 gap-8 text-center">
              {[
                { stat: "< 5 min", label: "Average build time" },
                { stat: "8", label: "Production templates" },
                { stat: "0", label: "Lines of code written" },
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 100}>
                  <div>
                    <p className="text-3xl font-bold sm:text-4xl bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{item.stat}</p>
                    <p className="mt-2 text-sm text-white/30">{item.label}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative border-t border-white/5 px-4 py-28 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 bottom-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
          </div>
          <div className="mx-auto max-w-2xl text-center">
            <FadeIn>
              <h2 className="text-3xl font-bold sm:text-5xl" style={{ textWrap: "balance" } as React.CSSProperties}>
                Your first app is free.
                <br />
                <span className="text-white/40">No credit card required.</span>
              </h2>
            </FadeIn>
            <FadeIn delay={100}>
              <p className="mt-6 text-white/40">
                Describe what you want. Review what we build. Deploy or download.
              </p>
            </FadeIn>
            <FadeIn delay={200}>
              <Link
                href="/studio"
                className="mt-10 inline-flex h-14 items-center gap-2 rounded-lg bg-primary px-10 text-lg font-medium text-white transition-all hover:bg-primary/90 hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]"
              >
                Start Building
              </Link>
            </FadeIn>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between text-sm text-white/20">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <span className="text-[10px] font-bold text-white">D</span>
              </div>
              <span>&copy; {new Date().getFullYear()} DeNovo</span>
            </div>
            <div className="flex gap-6">
              <Link href="/pricing" className="hover:text-white/50 transition-colors">Pricing</Link>
              <Link href="/studio" className="hover:text-white/50 transition-colors">Studio</Link>
            </div>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
