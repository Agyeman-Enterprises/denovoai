import { stripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

  const db = getAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata as Record<string, string> | undefined;

    if (meta?.user_id && meta?.plan_id) {
      const subscription = session.subscription as string;
      const customerId = session.customer as string;

      const sub = await stripe.subscriptions.retrieve(subscription) as unknown as Record<string, unknown>;

      await db.from("subscriptions").upsert({
        user_id: meta.user_id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription,
        plan_id: meta.plan_id,
        status: "active",
        current_period_end: new Date((sub.current_period_end as number) * 1000).toISOString(),
      }, { onConflict: "user_id" });
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as unknown as Record<string, unknown>;
    const customerId = sub.customer as string;

    await db
      .from("subscriptions")
      .update({
        status: sub.status as string,
        current_period_end: new Date((sub.current_period_end as number) * 1000).toISOString(),
      })
      .eq("stripe_customer_id", customerId);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as unknown as Record<string, unknown>;
    const customerId = sub.customer as string;

    await db
      .from("subscriptions")
      .update({ status: "canceled" })
      .eq("stripe_customer_id", customerId);
  }

  return NextResponse.json({ received: true });
}
