import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));

  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (seller?.stripe_account_id) {
    const account = await stripe.accounts.retrieve(seller.stripe_account_id);
    await supabase
      .from("seller_profiles")
      .update({
        stripe_onboarded: account.details_submitted,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  }

  return NextResponse.redirect(new URL("/dashboard/earnings", request.url));
}
