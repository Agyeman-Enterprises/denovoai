import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] px-6 py-16">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-bold">Simple pricing</h1>
        <p className="mt-3 text-sm text-white/40">Start free. Upgrade when you need more.</p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="font-semibold">Free</h3>
            <p className="mt-2 text-3xl font-bold">$0</p>
            <p className="mt-1 text-sm text-white/40">{"{{FREE_LIMIT}}"} {"{{PRIMARY_ENTITY_PLURAL}}"}/month</p>
            <ul className="mt-4 space-y-1.5 text-xs text-white/30">
              <li>&#10003; Basic features</li>
              <li>&#10003; Community support</li>
            </ul>
            <Link href="/auth/login" className="mt-4 block rounded-lg py-2 text-center text-sm font-medium" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Get Started</Link>
          </div>
          <div className="rounded-xl p-6" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.25)" }}>
            <span className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>POPULAR</span>
            <h3 className="font-semibold">Pro</h3>
            <p className="mt-2 text-3xl font-bold">${"{{PRO_PRICE}}"}<span className="text-sm text-white/30">/mo</span></p>
            <p className="mt-1 text-sm text-white/40">{"{{PRO_LIMIT}}"} {"{{PRIMARY_ENTITY_PLURAL}}"}/month</p>
            <ul className="mt-4 space-y-1.5 text-xs text-white/30">
              <li>&#10003; All features</li>
              <li>&#10003; Priority support</li>
              <li>&#10003; API access</li>
            </ul>
            <Link href="/auth/login" className="mt-4 block rounded-lg py-2 text-center text-sm font-semibold text-white" style={{ background: "#3B82F6" }}>Upgrade to Pro</Link>
          </div>
          <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="font-semibold">Business</h3>
            <p className="mt-2 text-3xl font-bold">Custom</p>
            <p className="mt-1 text-sm text-white/40">Unlimited {"{{PRIMARY_ENTITY_PLURAL}}"}</p>
            <ul className="mt-4 space-y-1.5 text-xs text-white/30">
              <li>&#10003; Everything in Pro</li>
              <li>&#10003; Dedicated support</li>
              <li>&#10003; Custom integrations</li>
            </ul>
            <Link href="/auth/login" className="mt-4 block rounded-lg py-2 text-center text-sm font-medium" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>Contact Us</Link>
          </div>
        </div>

        <Link href="/" className="mt-8 inline-block text-xs text-white/20 hover:text-white/40">Back to home</Link>
      </div>
    </div>
  );
}
