import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { items } = await request.json() as {
    items: { productId: string; quantity: number }[];
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Server-side price validation — never trust client prices
  const productIds = items.map(i => i.productId);
  const { data: products } = await supabase
    .from("products")
    .select("id, title, price_cents, currency, stock_count, status")
    .in("id", productIds)
    .eq("status", "active");

  if (!products || products.length !== items.length) {
    return NextResponse.json({ error: "Some products are unavailable" }, { status: 400 });
  }

  const productMap = new Map(products.map(p => [p.id, p]));

  const lineItems = items.map(item => {
    const product = productMap.get(item.productId)!;
    return {
      price_data: {
        currency: product.currency || "usd",
        product_data: { name: product.title },
        unit_amount: product.price_cents,
      },
      quantity: item.quantity,
    };
  });

  const totalCents = items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + product.price_cents * item.quantity;
  }, 0);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
    metadata: {
      customer_id: user?.id || "",
      items_json: JSON.stringify(items),
      total_cents: totalCents.toString(),
    },
    ...(user?.email ? { customer_email: user.email } : {}),
  });

  return NextResponse.json({ url: session.url });
}
