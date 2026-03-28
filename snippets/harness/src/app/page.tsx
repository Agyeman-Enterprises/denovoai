import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#06060f] px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#8B5CF6" }}>
          <span className="text-lg font-bold text-white">$</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Stripe Simple Snippet</h1>
        <p className="mt-3 text-sm text-white/40">Subscriptions + one-time payments reference implementation.</p>
        <p className="mt-1 text-xs text-white/25">Stripe Checkout hosted + webhook + billing portal</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/pricing" className="inline-flex h-12 items-center justify-center rounded-xl px-8 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #8B5CF6, #7c3aed)" }}>
            View Pricing
          </Link>
          <Link href="/auth/login" className="inline-flex h-12 items-center justify-center rounded-xl px-8 text-sm font-medium text-white/60" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            Sign In
          </Link>
        </div>

        <p className="mt-6 text-xs text-white/20">
          <Link href="/dashboard" className="hover:text-white/40">Dashboard</Link>
          {" \u00b7 "}
          <Link href="/api/health" className="hover:text-white/40">Health Check</Link>
        </p>
      </div>
    </div>
  );
}
