import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("*, profiles(display_name, avatar_url)")
    .eq("id", id)
    .single();

  if (!listing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <p className="text-white/40">{"{{LISTING_NOUN}}"} not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/browse" className="text-xs text-white/25 hover:text-white/40">&larr; Back to browse</Link>
        <h1 className="mt-4 text-3xl font-bold">{listing.title}</h1>
        <p className="mt-2 text-white/40">{listing.description}</p>
        <div className="mt-6 flex items-center gap-4">
          <span className="text-2xl font-bold" style={{ color: "#8B5CF6" }}>
            ${(listing.price_cents / 100).toFixed(0)}
          </span>
          <span className="text-sm text-white/20">{listing.category}</span>
        </div>
        <div className="mt-4">
          <Link href={`/seller/${listing.seller_id}`} className="text-sm text-white/50 hover:text-white/70">
            By {listing.profiles?.display_name || "Unknown"}
          </Link>
        </div>
        <Link
          href="/auth/login"
          className="mt-8 inline-block rounded-xl px-8 py-3 font-semibold text-white"
          style={{ background: "#8B5CF6" }}
        >
          Book this {"{{LISTING_NOUN}}"}
        </Link>
      </div>
    </div>
  );
}
