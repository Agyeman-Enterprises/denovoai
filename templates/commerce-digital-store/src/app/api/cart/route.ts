import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Server-side cart validation — validates client-side cart items against real prices
export async function POST(request: Request) {
  const { items } = await request.json() as {
    items: { productId: string; quantity: number }[];
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ valid: false, error: "Empty cart" }, { status: 400 });
  }

  const supabase = await createClient();
  const productIds = items.map(i => i.productId);

  const { data: products } = await supabase
    .from("products")
    .select("id, title, price_cents, stock_count, status")
    .in("id", productIds)
    .eq("status", "active");

  if (!products) {
    return NextResponse.json({ valid: false, error: "Failed to fetch products" }, { status: 500 });
  }

  const productMap = new Map(products.map(p => [p.id, p]));
  const validated = items.map(item => {
    const product = productMap.get(item.productId);
    if (!product) return { ...item, error: "Product not found or inactive" };
    if (product.stock_count !== null && product.stock_count < item.quantity) {
      return { ...item, error: `Only ${product.stock_count} in stock` };
    }
    return { productId: item.productId, quantity: item.quantity, priceCents: product.price_cents, title: product.title };
  });

  const hasErrors = validated.some((v: Record<string, unknown>) => v.error);

  return NextResponse.json({
    valid: !hasErrors,
    items: validated,
    totalCents: hasErrors ? 0 : validated.reduce((sum, v: Record<string, unknown>) => sum + (v.priceCents as number) * (v.quantity as number), 0),
  });
}
