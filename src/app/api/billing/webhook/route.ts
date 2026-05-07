import { NextResponse, type NextRequest } from 'next/server'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break
      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const userId = sub.metadata['supabase_user_id']
      if (userId) {
        await admin.from('billing_subscriptions').upsert({
          user_id:               userId,
          stripe_subscription_id: sub.id,
          stripe_customer_id:    sub.customer as string,
          plan_id:               sub.items.data[0]?.price.id ?? '',
          status:                sub.status,
          current_period_start:  new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end:    new Date(sub.current_period_end   * 1000).toISOString(),
          trial_start:           sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
          trial_end:             sub.trial_end   ? new Date(sub.trial_end   * 1000).toISOString() : null,
        }, { onConflict: 'stripe_subscription_id' })
      }
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await admin.from('billing_subscriptions').update({
        plan_id:              sub.items.data[0]?.price.id ?? '',
        status:               sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
        cancel_at:            sub.cancel_at    ? new Date(sub.cancel_at    * 1000).toISOString() : null,
        trial_end:            sub.trial_end    ? new Date(sub.trial_end    * 1000).toISOString() : null,
        updated_at:           new Date().toISOString(),
      }).eq('stripe_subscription_id', sub.id)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await admin.from('billing_subscriptions').update({
        status:      'canceled',
        canceled_at: new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      }).eq('stripe_subscription_id', sub.id)
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        await admin.from('billing_subscriptions').update({
          status: 'past_due', updated_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', invoice.subscription as string)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
