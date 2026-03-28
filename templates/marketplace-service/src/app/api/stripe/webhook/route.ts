import { stripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata as Record<string, string> | undefined;

    if (meta?.listing_id) {
      const { data: listing } = await supabase
        .from("listings")
        .select("price_cents, seller_id")
        .eq("id", meta.listing_id)
        .single();

      if (listing) {
        const feePercent = parseInt(process.env.STRIPE_PLATFORM_FEE_PERCENT || "10");
        const fee = Math.round(listing.price_cents * (feePercent / 100));

        await supabase.from("orders").insert({
          listing_id: meta.listing_id,
          buyer_id: meta.buyer_id,
          seller_id: listing.seller_id,
          amount_cents: listing.price_cents,
          platform_fee_cents: fee,
          seller_payout_cents: listing.price_cents - fee,
          stripe_payment_intent_id: session.payment_intent as string,
          status: "paid",
        });
      }
    }
  }

  if (event.type === "account.updated") {
    const account = event.data.object as unknown as Record<string, unknown>;
    const metadata = account.metadata as Record<string, string> | undefined;
    if (metadata?.supabase_user_id) {
      await supabase
        .from("profiles")
        .update({
          stripe_onboarded: account.details_submitted as boolean,
        })
        .eq("id", metadata.supabase_user_id);
    }
  }

  return NextResponse.json({ received: true });
}
