import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceId, successPath = '/billing', cancelPath = '/billing' } =
    await req.json().catch(() => ({})) as {
      priceId?: string; successPath?: string; cancelPath?: string
    }

  if (!priceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 })

  const admin = createServiceClient()

  // Get or create Stripe customer
  const { data: existing } = await admin
    .from('billing_customers').select('customer_id').eq('user_id', user.id).maybeSingle()

  let customerId = existing?.customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await admin.from('billing_customers').insert({
      user_id: user.id, customer_id: customerId, email: user.email,
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${SITE_URL}${cancelPath}`,
    subscription_data: { metadata: { supabase_user_id: user.id } },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
