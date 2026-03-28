import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-white/40 hover:text-white/70">Pricing</Link>
          <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70">Sign In</Link>
          <Link href="/auth/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#7C3AED" }}>
            {"{{CTA_PRIMARY}}"}
          </Link>
        </div>
      </nav>

      <section className="px-6 py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold sm:text-6xl">
          {"{{ACTION_VERB}}"} {"{{PRIMARY_ENTITY_PLURAL}}"} in seconds.
        </h1>
        <p className="mt-4 text-lg text-white/40">{"{{APP_TAGLINE}}"}</p>
        <Link href="/auth/login" className="mt-8 inline-block rounded-lg px-8 py-3 font-semibold text-white" style={{ background: "#7C3AED" }}>
          Start Free &mdash; {"{{FREE_LIMIT}}"} {"{{PRIMARY_ENTITY_PLURAL}}"} free every month
        </Link>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl grid gap-6 md:grid-cols-3">
          {[
            ["Fast", `${"{{ACTION_VERB}}"} a ${"{{PRIMARY_ENTITY}}"} in under 60 seconds.`],
            ["Simple", "No setup. No learning curve."],
            ["Yours", "Export, download, share \u2014 you own the output."],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-white/40">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="mx-auto max-w-4xl pt-16 text-center">
          <h2 className="text-2xl font-bold">Simple pricing</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-semibold">Free</h3>
              <p className="mt-2 text-3xl font-bold">$0</p>
              <p className="mt-1 text-sm text-white/40">{"{{FREE_LIMIT}}"} {"{{PRIMARY_ENTITY_PLURAL}}"}/month</p>
              <Link href="/auth/login" className="mt-4 block rounded-lg py-2 text-center text-sm font-medium" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Get Started</Link>
            </div>
            <div className="rounded-xl p-6" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.25)" }}>
              <span className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(124,58,237,0.15)", color: "#60a5fa" }}>POPULAR</span>
              <h3 className="font-semibold">Pro</h3>
              <p className="mt-2 text-3xl font-bold">${"{{PRO_PRICE}}"}<span className="text-sm text-white/30">/mo</span></p>
              <p className="mt-1 text-sm text-white/40">{"{{PRO_LIMIT}}"} {"{{PRIMARY_ENTITY_PLURAL}}"}/month</p>
              <Link href="/auth/login" className="mt-4 block rounded-lg py-2 text-center text-sm font-semibold text-white" style={{ background: "#7C3AED" }}>Upgrade to Pro</Link>
            </div>
            <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-semibold">Business</h3>
              <p className="mt-2 text-3xl font-bold">Custom</p>
              <p className="mt-1 text-sm text-white/40">Unlimited</p>
              <Link href="/auth/login" className="mt-4 block rounded-lg py-2 text-center text-sm font-medium" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-white/20" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {"{{APP_NAME}}"} &mdash; {"{{APP_TAGLINE}}"}
      </footer>
    </div>
  );
}
