import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Must export this config to disable body parsing (Stripe needs raw body)
export const config = { api: { bodyParser: false } }

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 })
  }

  const supabase = getServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      if (!userId || !session.subscription) break

      await supabase
        .schema('denovo')
        .from('subscriptions')
        .upsert({
          id: session.subscription as string,
          user_id: userId,
          plan: 'pro',
          stripe_customer_id: session.customer as string,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id ?? ''
      const isActive = sub.status === 'active' || sub.status === 'trialing'
      const plan = isActive ? 'pro' : 'free'

      if (userId) {
        await supabase
          .schema('denovo')
          .from('subscriptions')
          .upsert({
            id: sub.id,
            user_id: userId,
            plan,
            stripe_customer_id: sub.customer as string,
            status: sub.status === 'active' ? 'active' : sub.status === 'canceled' ? 'canceled' : 'past_due',
            period_start: new Date((sub.items.data[0]?.current_period_start ?? 0) * 1000).toISOString(),
            period_end: new Date((sub.items.data[0]?.current_period_end ?? 0) * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
      }
      break
    }

    default:
      // Unhandled event type — ignore
      break
  }

  return NextResponse.json({ received: true })
}
