import { NextResponse } from "next/server";
import { stripe, CREDIT_PACKS } from "@/lib/stripe";
import { sql, subscriptions, profiles } from "@/lib/db";
import { requireUserId, UnauthorizedError, unauthorizedResponse } from "@/lib/session";

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse();
    throw e;
  }

  const { packIndex } = await request.json();
  const pack = CREDIT_PACKS[packIndex as number];
  if (!pack) {
    return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 });
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
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: `${pack.credits} AE Design Studio Credits` },
        unit_amount: pack.amountCents,
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?credits=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    metadata: {
      user_id: userId,
      credits: pack.credits.toString(),
      type: "credit_purchase",
    },
  });

  return NextResponse.json({ url: session.url });
}
