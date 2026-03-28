import { stripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return NextResponse.json({ error: "Invalid signature" }, { status: 400 }); }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata as Record<string, string> | undefined;
    if (meta?.invoice_id) {
      await supabase.from("invoices").update({
        status: "paid",
        stripe_payment_intent_id: session.payment_intent as string,
        updated_at: new Date().toISOString(),
      }).eq("id", meta.invoice_id);
    }
  }

  return NextResponse.json({ received: true });
}
