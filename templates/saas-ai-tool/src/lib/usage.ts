import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function checkAndIncrementUsage(userId: string): Promise<{ allowed: boolean; count: number; limit: number; plan: string }> {
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("usage_count, usage_limit, plan_id")
    .eq("user_id", userId)
    .single();

  if (!sub) throw new Error("No subscription found");

  if (sub.usage_count >= sub.usage_limit) {
    return { allowed: false, count: sub.usage_count, limit: sub.usage_limit, plan: sub.plan_id };
  }

  await supabaseAdmin
    .from("subscriptions")
    .update({ usage_count: sub.usage_count + 1, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  return { allowed: true, count: sub.usage_count + 1, limit: sub.usage_limit, plan: sub.plan_id };
}

export async function getUsage(userId: string): Promise<{ count: number; limit: number; plan: string }> {
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("usage_count, usage_limit, plan_id")
    .eq("user_id", userId)
    .single();

  if (!sub) return { count: 0, limit: 0, plan: "free" };

  return { count: sub.usage_count, limit: sub.usage_limit, plan: sub.plan_id };
}
