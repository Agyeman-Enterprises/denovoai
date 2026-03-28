import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await request.json();

  const priceEnvMap: Record<string, string> = {
    pro: "STRIPE_PRO_MONTHLY_PRICE_ID",
    business: "STRIPE_BUSINESS_MONTHLY_PRICE_ID",
  };

  const priceId = process.env[priceEnvMap[planId] || ""];
  if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

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
    await supabase.from("subscriptions").update({ stripe_customer_id: customerId }).eq("user_id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { supabase_user_id: user.id, plan_id: planId },
  });

  return NextResponse.json({ url: session.url });
}
