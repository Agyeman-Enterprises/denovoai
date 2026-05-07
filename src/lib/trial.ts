import { createServiceClient } from '@/lib/supabase/server'

/** Get trial info for a user. Returns null if no subscription exists. */
export async function getTrialInfo(userId: string): Promise<{
  isTrialing: boolean
  trialEnd: Date | null
  daysRemaining: number
} | null> {
  const admin = createServiceClient()
  const { data } = await admin
    .from('billing_subscriptions')
    .select('status, trial_end')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  const isTrialing = data.status === 'trialing'
  const trialEnd   = data.trial_end ? new Date(data.trial_end) : null
  const daysRemaining = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86_400_000))
    : 0

  return { isTrialing, trialEnd, daysRemaining }
}

/** Check if a user has ever had a trial (to prevent double-trial abuse). */
export async function hasUsedTrial(userId: string): Promise<boolean> {
  const admin = createServiceClient()
  const { data } = await admin
    .from('billing_subscriptions')
    .select('trial_start')
    .eq('user_id', userId)
    .not('trial_start', 'is', null)
    .limit(1)
    .maybeSingle()
  return !!data
}
