import { NextResponse } from "next/server";
import { stripe, CREDIT_PACKS } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { packIndex } = await request.json();
  const pack = CREDIT_PACKS[packIndex as number];
  if (!pack) {
    return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 });
  }

  // Get or create Stripe customer
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = sub?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: `${pack.credits} DeNovo Credits` },
        unit_amount: pack.amountCents,
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?credits=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    metadata: {
      user_id: user.id,
      credits: pack.credits.toString(),
      type: "credit_purchase",
    },
  });

  return NextResponse.json({ url: session.url });
}
