import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { TEMPLATE_INFO } from "@/types/denovo";
import type { TemplateType } from "@/types/database";

const STEPS = [
  { num: "01", title: "Describe", desc: "Tell DeNovo what you want to build in plain English. Our AI understands context, not just keywords." },
  { num: "02", title: "Review", desc: "See exactly what will be built — template, features, database schema. Edit anything before committing." },
  { num: "03", title: "Deploy", desc: "One click. Your app is live on its own domain with auth, payments, and a database — fully yours." },
];

const PLAN_PREVIEW = [
  { name: "Free", price: "$0", credits: "1 app", cta: "Start Free" },
  { name: "Starter", price: "$29", credits: "5 apps/mo", cta: "Get Started", highlight: true },
  { name: "Pro", price: "$79", credits: "15 apps/mo", cta: "Go Pro" },
  { name: "Agency", price: "$199", credits: "50 apps/mo", cta: "Contact Us" },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pt-24 pb-20 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
          </div>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Describe an app.{" "}
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Get a deployed product.
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
              DeNovo turns plain English descriptions into live web applications
              with auth, payments, and a database — deployed in minutes, not months.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/studio"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-white transition-colors hover:bg-primary/90"
              >
                Start Building Free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-border px-6 text-base font-medium transition-colors hover:bg-secondary"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold sm:text-4xl">How it works</h2>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.num} className="relative rounded-xl border border-border bg-card p-6">
                  <span className="text-4xl font-bold text-primary/30">{step.num}</span>
                  <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Templates */}
        <section className="border-t border-border px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold sm:text-4xl">8 battle-tested templates</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Each template is a production-ready Next.js app with auth, payments, and admin panel built in.
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.entries(TEMPLATE_INFO) as [TemplateType, (typeof TEMPLATE_INFO)[TemplateType]][]).map(
                ([key, info]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
                  >
                    <h3 className="font-semibold">{info.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{info.description}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Pricing preview */}
        <section className="border-t border-border px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold sm:text-4xl">Simple pricing</h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PLAN_PREVIEW.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl border p-6 ${
                    plan.highlight
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-bold">
                    {plan.price}
                    {plan.price !== "$0" && <span className="text-sm text-muted-foreground">/mo</span>}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.credits}</p>
                  <Link
                    href={plan.name === "Free" ? "/studio" : "/pricing"}
                    className={`mt-4 block rounded-lg py-2 text-center text-sm font-medium transition-colors ${
                      plan.highlight
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "border border-border hover:bg-secondary"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Your first app is free. No credit card.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Describe what you want. Review what we build. Deploy or download.
            </p>
            <Link
              href="/studio"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-base font-medium text-white transition-colors hover:bg-primary/90"
            >
              Start Building
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between text-sm text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} DeNovo</span>
            <div className="flex gap-4">
              <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
