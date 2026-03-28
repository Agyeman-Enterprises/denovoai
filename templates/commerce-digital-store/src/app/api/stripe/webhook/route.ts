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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata as Record<string, string> | undefined;

    if (meta?.items_json) {
      const items = JSON.parse(meta.items_json) as { productId: string; quantity: number }[];
      const totalCents = parseInt(meta.total_cents || "0");
      const db = getAdminClient();

      const { data: order } = await db.from("orders").insert({
        customer_id: meta.customer_id || null,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        status: "paid",
        amount_cents: totalCents,
        currency: session.currency || "usd",
        email: session.customer_email || session.customer_details?.email,
      }).select("id").single();

      if (order) {
        const productIds = items.map(i => i.productId);
        const { data: products } = await db
          .from("products")
          .select("id, price_cents")
          .in("id", productIds);

        const priceMap = new Map((products || []).map(p => [p.id, p.price_cents]));

        const orderItems = items.map(i => ({
          order_id: order.id,
          product_id: i.productId,
          quantity: i.quantity,
          price_cents: priceMap.get(i.productId) || 0,
        }));

        await db.from("order_items").insert(orderItems);
      }
    }
  }

  return NextResponse.json({ received: true });
}
