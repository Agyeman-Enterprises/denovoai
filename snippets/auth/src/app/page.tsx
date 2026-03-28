import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#06060f] px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "#8B5CF6" }}>
          <span className="text-lg font-bold text-white">D</span>
        </div>
        <h1 className="text-3xl font-bold text-white">DeNovo Auth Snippet</h1>
        <p className="mt-3 text-sm text-white/40">Production-grade Supabase auth reference implementation.</p>
        <p className="mt-1 text-xs text-white/25">Magic link + Google OAuth + Email/Password</p>

        <Link
          href="/auth/login"
          className="mt-8 inline-flex h-12 items-center rounded-xl px-8 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #7c3aed)" }}
        >
          Sign In
        </Link>

        <p className="mt-6 text-xs text-white/20">
          <Link href="/dashboard" className="hover:text-white/40">Go to Dashboard</Link>
          {" \u00b7 "}
          <Link href="/api/health" className="hover:text-white/40">Health Check</Link>
        </p>
      </div>
    </div>
  );
}
