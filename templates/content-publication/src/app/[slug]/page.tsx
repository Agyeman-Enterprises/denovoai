import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ContentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("content_items")
    .select("id, title, slug, excerpt, body, category, read_time_minutes, is_pro_only, published_at, status")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!item) notFound();

  const content = item as Record<string, unknown>;
  const isProOnly = !!(content.is_pro_only);

  // Check subscription if pro-only
  let hasAccess = !isProOnly;
  if (isProOnly) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id, status, plan")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .in("plan", ["pro", "annual"])
        .single();
      if (sub) hasAccess = true;
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/browse" className="text-sm text-white/40 hover:text-white/70">Browse</Link>
          <Link href="/pricing" className="text-sm text-white/40 hover:text-white/70">Pricing</Link>
          <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70">Sign In</Link>
        </div>
      </nav>

      <article className="mx-auto max-w-2xl px-6 py-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-white/30">{content.category as string}</span>
          {isProOnly ? (
            <span className="rounded-md px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}>PRO</span>
          ) : null}
          {!!(content.read_time_minutes) ? <span className="text-xs text-white/20">{content.read_time_minutes as number} min read</span> : null}
        </div>

        <h1 className="text-3xl font-bold sm:text-4xl">{content.title as string}</h1>

        {!!(content.published_at) ? (
          <p className="mt-3 text-sm text-white/25">
            Published {new Date(content.published_at as string).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        ) : null}

        {!!(content.excerpt) ? (
          <p className="mt-6 text-lg text-white/50 leading-relaxed">{content.excerpt as string}</p>
        ) : null}

        {hasAccess ? (
          <div className="mt-8 prose prose-invert max-w-none">
            <div className="text-white/70 leading-relaxed whitespace-pre-wrap">{content.body as string}</div>
          </div>
        ) : (
          <div className="relative mt-8">
            {/* Blurred preview */}
            <div className="text-white/70 leading-relaxed line-clamp-6" style={{ filter: "blur(4px)", userSelect: "none" }}>
              {content.body as string}
            </div>

            {/* Paywall overlay */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(transparent 0%, #0A0A0F 60%)" }}>
              <div className="text-center mt-16">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(139,92,246,0.15)" }}>
                  <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold">This is premium content</h3>
                <p className="mt-2 text-sm text-white/40">Subscribe to unlock all {"{{CONTENT_NOUN_PLURAL}}"}.</p>
                <Link href="/pricing" className="mt-4 inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white" style={{ background: "#8B5CF6" }}>
                  View Plans
                </Link>
              </div>
            </div>
          </div>
        )}
      </article>

      <footer className="px-6 py-8 text-center text-xs text-white/20" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {"{{APP_NAME}}"} &mdash; {"{{APP_TAGLINE}}"}
      </footer>
    </div>
  );
}
