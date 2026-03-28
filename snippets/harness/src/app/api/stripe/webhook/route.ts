import { stripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

// Service role client — bypasses RLS for webhook updates
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const obj = event.data.object as unknown as Record<string, unknown>;
  const userId = (obj.metadata as Record<string, string> | undefined)?.supabase_user_id;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && userId) {
        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: "active",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }
      if (session.mode === "payment" && userId) {
        await supabase.from("purchases").insert({
          user_id: userId,
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_customer_id: session.customer as string,
          product_id: (session.metadata as Record<string, string>)?.product_id ?? "unknown",
          amount_cents: session.amount_total || 0,
          status: "succeeded",
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const periodEnd = sub.items.data[0]?.current_period_end;
      await supabase
        .from("subscriptions")
        .update({
          status: sub.status,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as unknown as Record<string, unknown>;
      const subId = invoice.subscription as string | undefined;
      if (subId) {
        await supabase
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subId);
      }
      break;
    }

    // Stripe Connect — seller account status updates
    case "account.updated": {
      const account = event.data.object as unknown as Record<string, unknown>;
      const metadata = account.metadata as Record<string, string> | undefined;
      const sellerUserId = metadata?.supabase_user_id;
      if (sellerUserId) {
        await supabase
          .from("seller_profiles")
          .update({
            stripe_onboarded: account.details_submitted as boolean,
            stripe_charges_enabled: account.charges_enabled as boolean,
            stripe_payouts_enabled: account.payouts_enabled as boolean,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sellerUserId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
