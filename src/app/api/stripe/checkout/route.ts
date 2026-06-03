import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { sql, subscriptions, profiles } from "@/lib/db";
import { requireUserId, UnauthorizedError, unauthorizedResponse } from "@/lib/session";
import { getPriceIdForPlan } from "@/lib/plans";

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse();
    throw e;
  }

  const { planId, annual } = await request.json();

  const priceId = getPriceIdForPlan(planId, annual);
  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan or price not configured" }, { status: 400 });
  }

  const sub = await subscriptions.getByUser(userId);
  let customerId = sub?.stripe_customer_id ?? undefined;

  if (!customerId) {
    const profile = await profiles.get(userId);
    const customer = await stripe.customers.create({
      email: profile?.email ?? undefined,
      metadata: { ae_user_id: userId },
    });
    customerId = customer.id;
    await sql`UPDATE subscriptions SET stripe_customer_id = ${customerId}, updated_at = now() WHERE user_id = ${userId}`;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { user_id: userId, plan_id: planId },
  });

  return NextResponse.json({ url: session.url });
}
