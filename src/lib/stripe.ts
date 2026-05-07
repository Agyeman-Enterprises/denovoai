import Stripe from 'stripe'

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is required');
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
    typescript: true,
  });
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

export const CREDIT_PACKS = [
  { credits: 5, amountCents: 1900, label: "5 credits — $19" },
  { credits: 15, amountCents: 4900, label: "15 credits — $49" },
  { credits: 50, amountCents: 13900, label: "50 credits — $139" },
] as const;
