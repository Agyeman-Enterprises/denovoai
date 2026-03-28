import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId } = await request.json();
  const { data: listing } = await supabase
    .from("listings")
    .select("*, profiles(stripe_account_id)")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const feePercent = parseInt(process.env.STRIPE_PLATFORM_FEE_PERCENT || "10");
  const platformFeeCents = Math.round(listing.price_cents * (feePercent / 100));

  const sessionConfig: Record<string, unknown> = {
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: listing.currency || "usd",
        product_data: { name: listing.title },
        unit_amount: listing.price_cents,
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/listing/${listingId}`,
    metadata: { buyer_id: user.id, listing_id: listingId, seller_id: listing.seller_id },
  };

  if (listing.profiles?.stripe_account_id) {
    sessionConfig.payment_intent_data = {
      application_fee_amount: platformFeeCents,
      transfer_data: { destination: listing.profiles.stripe_account_id },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionConfig as Parameters<typeof stripe.checkout.sessions.create>[0]);
  return NextResponse.json({ url: session.url });
}
