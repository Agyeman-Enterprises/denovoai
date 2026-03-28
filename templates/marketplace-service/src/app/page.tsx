import Link from "next/link";

const CATEGORIES = ["Design", "Development", "Marketing", "Writing", "Video", "Photography"];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/browse" className="text-sm text-white/40 hover:text-white/70">Browse</Link>
          <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70">Sign In</Link>
          <Link href="/auth/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#8B5CF6" }}>
            {"{{CTA_PRIMARY}}"}
          </Link>
        </div>
      </nav>

      <section className="px-6 py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold sm:text-6xl">
          Find the right {"{{SELLER_NOUN}}"} for your next project.
        </h1>
        <p className="mt-4 text-lg text-white/40">
          Browse {"{{LISTING_NOUN_PLURAL}}"} from verified {"{{SELLER_NOUN_PLURAL}}"}.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/browse" className="rounded-lg px-6 py-3 font-semibold text-white" style={{ background: "#8B5CF6" }}>
            Browse {"{{LISTING_NOUN_PLURAL}}"}
          </Link>
          <Link href="/onboarding/seller" className="rounded-lg px-6 py-3 font-medium text-white/60" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            {"{{CTA_SECONDARY}}"}
          </Link>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-bold mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <Link key={c} href={`/browse?category=${c}`} className="rounded-lg px-4 py-2 text-sm transition-colors hover:border-violet-500/30" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-white/20" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {"{{APP_NAME}}"} &mdash; {"{{APP_TAGLINE}}"}
      </footer>
    </div>
  );
}
