import { createServiceClient } from '@/lib/supabase/server'

function currentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Record usage for a feature this period. */
export async function trackUsage(userId: string, feature: string, quantity = 1): Promise<void> {
  const admin = createServiceClient()
  await admin.from('usage_records').insert({ user_id: userId, feature, quantity, period: currentPeriod() })
}

/** Get total usage for a user/feature in the current period. */
export async function getUsage(userId: string, feature: string): Promise<number> {
  const admin = createServiceClient()
  const { data } = await admin
    .from('usage_records')
    .select('quantity')
    .eq('user_id', userId)
    .eq('feature', feature)
    .eq('period', currentPeriod())
  return (data ?? []).reduce((sum, r) => sum + r.quantity, 0)
}

/**
 * Check if a user is within their plan limit.
 * Limits map is plan-tier → feature → max quantity. Returns true if allowed.
 */
export async function checkUsageLimit(
  userId: string,
  feature: string,
  limitsByTier: Record<string, number>,
  userTier: string,
): Promise<boolean> {
  const limit = limitsByTier[userTier] ?? 0
  if (limit === -1) return true  // unlimited
  const used = await getUsage(userId, feature)
  return used < limit
}
