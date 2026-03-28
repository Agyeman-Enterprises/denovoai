import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

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

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId) break;

      if (session.metadata?.type === "credit_purchase") {
        const credits = parseInt(session.metadata.credits || "0", 10);
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("credits_remaining")
          .eq("user_id", userId)
          .single();

        await supabase
          .from("subscriptions")
          .update({ credits_remaining: (sub?.credits_remaining || 0) + credits })
          .eq("user_id", userId);

        await supabase.from("credit_purchases").insert({
          user_id: userId,
          credits,
          amount_cents: session.amount_total || 0,
          stripe_payment_intent_id: session.payment_intent as string,
        });
      } else {
        // Subscription checkout
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;

        // Map price ID to plan
        const planMap: Record<string, { id: string; credits: number }> = {};
        const envPrices = [
          { env: "STRIPE_STARTER_PRICE_ID", id: "starter", credits: 5 },
          { env: "STRIPE_PRO_PRICE_ID", id: "pro", credits: 15 },
          { env: "STRIPE_AGENCY_PRICE_ID", id: "agency", credits: 50 },
          { env: "STRIPE_STARTER_ANNUAL_PRICE_ID", id: "starter", credits: 5 },
          { env: "STRIPE_PRO_ANNUAL_PRICE_ID", id: "pro", credits: 15 },
          { env: "STRIPE_AGENCY_ANNUAL_PRICE_ID", id: "agency", credits: 50 },
        ];
        for (const p of envPrices) {
          const val = process.env[p.env];
          if (val) planMap[val] = { id: p.id, credits: p.credits };
        }

        const plan = planMap[priceId] || { id: "starter", credits: 5 };

        await supabase
          .from("subscriptions")
          .update({
            plan_id: plan.id,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            status: "active",
            credits_remaining: plan.credits,
            current_period_end: new Date(subscription.items.data[0]?.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", subscription.id)
        .single();

      if (sub) {
        const periodEnd = subscription.items.data[0]?.current_period_end;
        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status === "active" ? "active" : subscription.status === "past_due" ? "past_due" : "cancelled",
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", sub.user_id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({
          plan_id: "free",
          status: "cancelled",
          credits_remaining: 0,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
