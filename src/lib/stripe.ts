import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const CREDIT_PACKS = [
  { credits: 5, amountCents: 1900, label: "5 credits — $19" },
  { credits: 15, amountCents: 4900, label: "15 credits — $49" },
  { credits: 50, amountCents: 13900, label: "50 credits — $139" },
] as const;
