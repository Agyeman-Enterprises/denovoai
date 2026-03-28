import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_account_id) {
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    await supabase
      .from("profiles")
      .update({
        stripe_onboarded: account.details_submitted,
      })
      .eq("id", user.id);
  }

  return NextResponse.redirect(new URL("/dashboard/earnings", request.url));
}
