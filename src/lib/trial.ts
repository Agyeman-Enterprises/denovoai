import { sql } from '@/lib/db'

/** Get trial info for a user. Returns null if no subscription exists. */
export async function getTrialInfo(userId: string): Promise<{
  isTrialing: boolean
  trialEnd: Date | null
  daysRemaining: number
} | null> {
  const rows = await sql<{ status: string; trial_end: string | null }[]>`
    SELECT status, trial_end FROM billing_subscriptions
    WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1`
  const data = rows[0]
  if (!data) return null

  const isTrialing = data.status === 'trialing'
  const trialEnd = data.trial_end ? new Date(data.trial_end) : null
  const daysRemaining = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86_400_000))
    : 0

  return { isTrialing, trialEnd, daysRemaining }
}

/** Check if a user has ever had a trial (to prevent double-trial abuse). */
export async function hasUsedTrial(userId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM billing_subscriptions
    WHERE user_id = ${userId} AND trial_start IS NOT NULL LIMIT 1`
  return rows.length > 0
}
