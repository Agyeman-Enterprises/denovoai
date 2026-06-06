import { NextResponse } from 'next/server'
import { billingCustomers } from '@/lib/db'
import { requireUserId, UnauthorizedError, unauthorizedResponse } from '@/lib/session'
import { stripe } from '@/lib/stripe'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:4010'

export async function POST() {
  let userId: string
  try {
    userId = await requireUserId()
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse()
    throw e
  }

  const customer = await billingCustomers.getByUser(userId)
  if (!customer?.customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.customer_id,
    return_url: `${SITE_URL}/billing`,
  })

  return NextResponse.json({ url: session.url })
}
