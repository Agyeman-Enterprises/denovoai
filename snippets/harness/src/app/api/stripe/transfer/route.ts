import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check admin role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { orderId } = await request.json();

  const { data: order } = await supabase
    .from("marketplace_orders")
    .select("*, seller_profiles!inner(stripe_account_id)")
    .eq("id", orderId)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const transfer = await stripe.transfers.create({
    amount: order.seller_payout_cents,
    currency: order.currency || "usd",
    destination: order.seller_profiles.stripe_account_id,
    metadata: { order_id: orderId },
  });

  await supabase
    .from("marketplace_orders")
    .update({ stripe_transfer_id: transfer.id, status: "transferred", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  return NextResponse.json({ transferId: transfer.id });
}
