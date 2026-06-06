import { usage } from '@/lib/db'

function currentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Record usage for a feature this period. */
export async function trackUsage(userId: string, feature: string, quantity = 1): Promise<void> {
  await usage.record(userId, feature, currentPeriod(), quantity)
}

/** Get total usage for a user/feature in the current period. */
export async function getUsage(userId: string, feature: string): Promise<number> {
  return usage.sumForPeriod(userId, feature, currentPeriod())
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
  if (limit === -1) return true // unlimited
  const used = await getUsage(userId, feature)
  return used < limit
}
