import { NextResponse, type NextRequest } from 'next/server'
import { billingCustomers, profiles } from '@/lib/db'
import { requireUserId, UnauthorizedError, unauthorizedResponse } from '@/lib/session'
import { stripe } from '@/lib/stripe'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4010'

export async function POST(req: NextRequest) {
  let userId: string
  try {
    userId = await requireUserId()
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse()
    throw e
  }

  const { priceId, successPath = '/billing', cancelPath = '/billing' } =
    (await req.json().catch(() => ({}))) as { priceId?: string; successPath?: string; cancelPath?: string }

  if (!priceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 })

  const profile = await profiles.get(userId)
  const existing = await billingCustomers.getByUser(userId)

  let customerId = existing?.customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? undefined,
      metadata: { ae_user_id: userId },
    })
    customerId = customer.id
    await billingCustomers.insert(userId, customerId, profile?.email ?? undefined)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}${cancelPath}`,
    subscription_data: { metadata: { ae_user_id: userId } },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
