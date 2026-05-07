-- AE: billing-stripe-standard
-- Core billing tables: customers + subscriptions.

CREATE TABLE IF NOT EXISTS public.billing_customers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  customer_id text NOT NULL UNIQUE,  -- Stripe customer ID (cus_...)
  email       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "billing_customers: user read own" ON public.billing_customers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id     text NOT NULL,
  plan_id                text NOT NULL,
  status                 text NOT NULL DEFAULT 'active',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at              timestamptz,
  canceled_at            timestamptz,
  trial_start            timestamptz,
  trial_end              timestamptz,
  metadata               jsonb NOT NULL DEFAULT '{}',
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_subs_user ON public.billing_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_billing_subs_status ON public.billing_subscriptions (status);

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "billing_subscriptions: user read own" ON public.billing_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
