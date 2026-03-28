import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: seller } = await supabase.from("profiles").select("*").eq("id", id).single();
  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (!seller) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <p className="text-white/40">{"{{SELLER_NOUN}}"} not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/browse" className="text-xs text-white/25 hover:text-white/40">&larr; Browse</Link>
        <h1 className="mt-4 text-2xl font-bold">{seller.display_name || "{{SELLER_NOUN}}"}</h1>
        <p className="mt-1 text-sm text-white/40">{seller.bio || ""}</p>
        <h2 className="mt-8 text-lg font-semibold">{"{{LISTING_NOUN_PLURAL}}"}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(listings || []).map((l: Record<string, unknown>) => (
            <Link key={l.id as string} href={`/listing/${l.id}`}>
              <div className="rounded-xl p-4 transition-all hover:border-violet-500/30" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="font-medium">{l.title as string}</p>
                <p className="text-sm" style={{ color: "#8B5CF6" }}>${((l.price_cents as number) / 100).toFixed(0)}</p>
              </div>
            </Link>
          ))}
          {(!listings || listings.length === 0) && <p className="text-sm text-white/25">No listings yet.</p>}
        </div>
      </div>
    </div>
  );
}
