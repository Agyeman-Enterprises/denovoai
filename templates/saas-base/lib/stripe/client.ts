import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO_MONTHLY!
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
