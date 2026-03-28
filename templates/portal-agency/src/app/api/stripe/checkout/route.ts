import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invoiceId } = await request.json();
  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", invoiceId).eq("client_id", user.id).single();
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: `Invoice ${invoiceId.slice(0, 8)}` },
        unit_amount: invoice.amount_cents,
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/invoices?paid=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/invoices`,
    metadata: { invoice_id: invoiceId, client_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
