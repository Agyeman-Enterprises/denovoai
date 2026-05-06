import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("directory_listings")
    .select("*, profiles(display_name)")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!listing) notFound();

  // Increment view count (fire-and-forget)
  supabase.from("directory_listings").update({ view_count: (listing.view_count || 0) + 1 }).eq("id", id).then(() => {});

  const tags = (listing.tags as string[]) || [];
  const meta = (listing.metadata as Record<string, unknown>) || {};

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <div className="flex items-center gap-4">
          <Link href="/browse" className="text-sm text-white/40 hover:text-white/70">Browse</Link>
          <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70">Sign In</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-start gap-5">
          {listing.logo_url ? (
            <Image src={listing.logo_url} alt="" width={64} height={64} className="h-16 w-16 rounded-xl object-cover shrink-0" unoptimized />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-violet-600/20 flex items-center justify-center text-xl font-bold text-violet-400 shrink-0">{listing.name.charAt(0)}</div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{listing.name}</h1>
              {listing.is_featured ? <span className="rounded-md px-2 py-0.5 text-xs text-amber-400" style={{ background: "rgba(251,191,36,0.1)" }}>Featured</span> : null}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-white/40">
              <span>{listing.category}</span>
              {listing.location && <><span>·</span><span>{listing.location}</span></>}
            </div>
          </div>
        </div>

        {listing.description && (
          <div className="mt-8">
            <p className="text-white/60 whitespace-pre-wrap">{listing.description}</p>
          </div>
        )}

        {tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t} className="rounded-md px-2 py-1 text-xs" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>{t}</span>
            ))}
          </div>
        )}

        {Object.keys(meta).length > 0 && (
          <div className="mt-8 rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="text-sm font-semibold text-white/60 mb-3">Details</h2>
            <div className="space-y-2">
              {Object.entries(meta).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-white/40">{k}</span>
                  <span className="text-white/70">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {listing.website_url && (
            <a href={listing.website_url} target="_blank" rel="noopener noreferrer" className="rounded-lg px-6 py-3 text-sm font-semibold text-white" style={{ background: "#8B5CF6" }}>
              Visit Website
            </a>
          )}
          <Link href="/browse" className="rounded-lg px-6 py-3 text-sm text-white/40" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            Back to Directory
          </Link>
        </div>

        <p className="mt-6 text-xs text-white/20">{listing.view_count} views</p>
      </div>
    </div>
  );
}
