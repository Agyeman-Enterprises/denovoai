export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { subscriptions, plans } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { BillingClient } from "@/components/billing-client";

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const sub = await subscriptions.getByUser(user.id);
  const plan = sub ? await plans.get(sub.plan_id) : null;

  return <BillingClient sub={sub} plan={plan} />;
}
