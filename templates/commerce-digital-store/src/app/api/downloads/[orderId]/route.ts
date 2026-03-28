import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, customer_id")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .single();

  if (!order || (order.status !== "paid" && order.status !== "fulfilled")) {
    return NextResponse.json({ error: "Order not found or not paid" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("products(download_url, product_type)")
    .eq("order_id", orderId);

  const downloadUrls = (items || [])
    .map((i: Record<string, unknown>) => {
      const product = i.products as Record<string, unknown> | null;
      if (product?.product_type === "digital" && product?.download_url) {
        return product.download_url as string;
      }
      return null;
    })
    .filter(Boolean);

  if (downloadUrls.length === 0) {
    return NextResponse.json({ error: "No digital downloads in this order" }, { status: 404 });
  }

  // For single download, redirect. For multiple, return list.
  if (downloadUrls.length === 1) {
    return NextResponse.redirect(downloadUrls[0] as string);
  }

  return NextResponse.json({ downloads: downloadUrls });
}
