import { NextResponse, type NextRequest } from 'next/server'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { sql } from '@/lib/db'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const ts = (n: number | null | undefined) => (n ? new Date(n * 1000).toISOString() : null)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break
      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const userId = sub.metadata['ae_user_id'] ?? sub.metadata['supabase_user_id']
      if (userId) {
        await sql`
          INSERT INTO billing_subscriptions
            (user_id, stripe_subscription_id, stripe_customer_id, plan_id, status,
             current_period_start, current_period_end, trial_start, trial_end)
          VALUES
            (${userId}, ${sub.id}, ${sub.customer as string}, ${sub.items.data[0]?.price.id ?? ''}, ${sub.status},
             ${ts(sub.current_period_start)}, ${ts(sub.current_period_end)},
             ${ts(sub.trial_start)}, ${ts(sub.trial_end)})
          ON CONFLICT (stripe_subscription_id) DO UPDATE SET
            status = EXCLUDED.status,
            current_period_start = EXCLUDED.current_period_start,
            current_period_end = EXCLUDED.current_period_end,
            trial_end = EXCLUDED.trial_end,
            updated_at = now()`
      }
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await sql`
        UPDATE billing_subscriptions SET
          plan_id = ${sub.items.data[0]?.price.id ?? ''},
          status = ${sub.status},
          current_period_start = ${ts(sub.current_period_start)},
          current_period_end = ${ts(sub.current_period_end)},
          cancel_at = ${ts(sub.cancel_at)},
          trial_end = ${ts(sub.trial_end)},
          updated_at = now()
        WHERE stripe_subscription_id = ${sub.id}`
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await sql`
        UPDATE billing_subscriptions SET status = 'canceled', canceled_at = now(), updated_at = now()
        WHERE stripe_subscription_id = ${sub.id}`
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = (invoice as unknown as { subscription?: string }).subscription
      if (subId) {
        await sql`
          UPDATE billing_subscriptions SET status = 'past_due', updated_at = now()
          WHERE stripe_subscription_id = ${subId}`
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
