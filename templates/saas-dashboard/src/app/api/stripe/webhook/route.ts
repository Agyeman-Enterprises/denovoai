import { stripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_LIMITS: Record<string, number> = {
  free: parseInt("{{FREE_LIMIT}}") || 1,
  pro: parseInt("{{PRO_LIMIT}}") || 10,
  business: 999999,
};

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
    const userId = meta?.supabase_user_id;
    const planId = meta?.plan_id || "pro";

    if (userId && session.mode === "subscription") {
      const periodEnd = session.subscription
        ? await stripe.subscriptions.retrieve(session.subscription as string).then(s => s.items.data[0]?.current_period_end)
        : null;

      await supabase.from("subscriptions").update({
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plan_id: planId,
        status: "active",
        usage_limit: PLAN_LIMITS[planId] || PLAN_LIMITS.pro,
        usage_count: 0,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const periodEnd = sub.items.data[0]?.current_period_end;
    await supabase.from("subscriptions").update({
      status: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "cancelled",
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("stripe_subscription_id", sub.id);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await supabase.from("subscriptions").update({
      plan_id: "free",
      status: "cancelled",
      usage_limit: PLAN_LIMITS.free,
      updated_at: new Date().toISOString(),
    }).eq("stripe_subscription_id", sub.id);
  }

  return NextResponse.json({ received: true });
}
