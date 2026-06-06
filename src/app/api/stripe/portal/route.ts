import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { subscriptions } from "@/lib/db";
import { requireUserId, UnauthorizedError, unauthorizedResponse } from "@/lib/session";

export async function POST() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse();
    throw e;
  }

  const sub = await subscriptions.getByUser(userId);
  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
