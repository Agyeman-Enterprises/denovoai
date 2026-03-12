import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICE_PRO, APP_URL } from '@/lib/stripe/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: STRIPE_PRICE_PRO, quantity: 1 }],
    customer_email: user.email,
    metadata: { user_id: user.id },
    success_url: `${APP_URL}/billing?success=true`,
    cancel_url: `${APP_URL}/billing`,
  })

  return NextResponse.json({ url: session.url })
}
