# DeNovo — Stripe Simple Snippet Brief
## Subscriptions + one-time payments for single-seller apps.
## Must work 100% of the time. No exceptions.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE

NEVER:
- Modify Cloudflare DNS, tunnel routes, or ingress rules
- Call any Cloudflare API
- Run `cloudflared` commands
- Touch Traefik config

Your job ends at: all payment flows work, app runs on port 6001,
build passes clean. Owner handles Cloudflare manually.

---

## Context

This is the Stripe Simple Snippet — a standalone, battle-tested
implementation of Stripe subscriptions and one-time payments.
It will be extracted into DeNovo's snippet registry and dropped
into SaaS, Directory, E-commerce, and Content templates.

It must work perfectly out of the box. Zero payment failures.
Zero broken webhooks. Zero subscription state bugs.

This is NOT a prototype. This is production-grade reference code.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js latest stable (`npx create-next-app@latest`) |
| Auth | Supabase Auth via `@supabase/ssr` (copy from auth snippet) |
| Payments | Stripe (`stripe` + `@stripe/stripe-js`) |
| Styling | Tailwind CSS |
| Language | TypeScript strict mode |
| Port | 6001 |
| Deployment | Hetzner via Coolify |

**Critical:** Use Stripe Checkout hosted — do NOT build custom card forms.
**Critical:** Next.js 16 uses `proxy.ts` not `middleware.ts`.
**Critical:** Verify webhook signatures on every webhook event.

---

## Supabase Credentials

```
NEXT_PUBLIC_SUPABASE_URL=https://jomualvckaudlcqrfvxv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXVhbHZja2F1ZGxjcXJmdnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjUwNDIsImV4cCI6MjA4ODM0MTA0Mn0.nlMkdRyIMQ18Uf6MThIJn1kbN63VdArQ-p5Mw-_4Z-A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXVhbHZja2F1ZGxjcXJmdnh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc2NTA0MiwiZXhwIjoyMDg4MzQxMDQyfQ.3Hoz8-brzx8eX4kibH_hVcRdz645dn5HfVoAtUvbA9c
```

---

## Database Schema

Apply this. Check if profiles table already exists before running.

```sql
-- Profiles (extends auth.users) — skip if already exists
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text check (role in ('user', 'admin')) default 'user',
  created_at timestamptz default now()
);

-- Subscriptions
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan_id text not null default 'free',
  status text check (status in (
    'active', 'cancelled', 'past_due', 'trialing', 'incomplete'
  )) default 'active',
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- One-time purchases
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  product_id text not null,
  amount_cents int not null,
  currency text default 'usd',
  status text check (status in ('pending', 'succeeded', 'failed', 'refunded')) default 'pending',
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- RLS
alter table subscriptions enable row level security;
alter table purchases enable row level security;

create policy "own subscription" on subscriptions
  for all using (auth.uid() = user_id);
create policy "own purchases" on purchases
  for all using (auth.uid() = user_id);

-- Service role bypasses RLS for webhook handler
-- Use SUPABASE_SERVICE_ROLE_KEY in webhook route
```

---

## File Structure

```
src/
├── app/
│   ├── page.tsx                        # Public landing — pricing CTA
│   ├── layout.tsx
│   ├── globals.css
│   │
│   ├── auth/
│   │   ├── login/page.tsx              # Copy from auth snippet
│   │   ├── callback/route.ts           # Copy from auth snippet
│   │   └── signout/route.ts            # Copy from auth snippet
│   │
│   ├── dashboard/
│   │   ├── layout.tsx                  # Protected — copy from auth snippet
│   │   ├── page.tsx                    # Shows plan + billing button
│   │   └── billing/
│   │       └── page.tsx                # Subscription management
│   │
│   ├── pricing/
│   │   └── page.tsx                    # Pricing page — 3 plans
│   │
│   └── api/
│       ├── health/route.ts
│       └── stripe/
│           ├── checkout/route.ts       # Create checkout session
│           ├── webhook/route.ts        # Handle Stripe events
│           └── portal/route.ts        # Customer billing portal
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Copy from auth snippet
│   │   └── server.ts                   # Copy from auth snippet
│   └── stripe/
│       └── client.ts                   # Stripe server client
│
└── proxy.ts                            # Next.js 16 route protection
```

---

## Implementation Details

### `src/lib/stripe/client.ts`
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
})
```

### `src/app/api/stripe/checkout/route.ts`
```typescript
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { priceId, mode } = await request.json()
  // mode: 'subscription' or 'payment'

  // Get or create Stripe customer
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  let customerId = subscription?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
    metadata: { supabase_user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
```

### `src/app/api/stripe/webhook/route.ts`
```typescript
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

// Use service role — bypasses RLS for webhook updates
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const userId = event.data.object.metadata?.supabase_user_id

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object
      if (session.mode === 'subscription') {
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: 'active',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      }
      if (session.mode === 'payment') {
        await supabase.from('purchases').insert({
          user_id: userId,
          stripe_payment_intent_id: session.payment_intent,
          stripe_customer_id: session.customer,
          product_id: session.metadata?.product_id ?? 'unknown',
          amount_cents: session.amount_total,
          status: 'succeeded',
        })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      await supabase.from('subscriptions')
        .update({
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      await supabase.from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      await supabase.from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', invoice.subscription)
      break
    }
  }

  return NextResponse.json({ received: true })
}

// Required — disable body parsing for webhook signature verification
export const config = {
  api: { bodyParser: false }
}
```

### `src/app/api/stripe/portal/route.ts`
```typescript
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!subscription?.stripe_customer_id) {
    return NextResponse.json({ error: 'No customer found' }, { status: 404 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  })

  return NextResponse.json({ url: session.url })
}
```

---

## Pricing Page

`src/app/pricing/page.tsx` — three plans, functional checkout buttons:

**Plans to display (use env var price IDs):**
- Free — $0 — basic features — CTA: "Get Started"
- Pro — $29/month — full features — CTA: "Upgrade to Pro"
- Business — $99/month — all features + priority support — CTA: "Upgrade to Business"

Each paid plan CTA calls `POST /api/stripe/checkout` with the correct
`priceId` from env vars and `mode: 'subscription'`.

Redirect to Stripe Checkout hosted page.
On success, Stripe webhook updates the database.
User lands back at `/dashboard?success=true`.

---

## Dashboard Billing Page

`src/app/dashboard/billing/page.tsx`:
- Show current plan name and status
- Show `current_period_end` formatted as human date
- Show `cancel_at_period_end` warning if true
- "Manage Billing" button → POST `/api/stripe/portal` → redirect to portal URL

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Plan Price IDs (owner creates in Stripe Dashboard)
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_BUSINESS_MONTHLY_PRICE_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:6001
```

---

## Stripe Webhook Setup

For local testing use Stripe CLI:
```bash
stripe listen --forward-to localhost:6001/api/stripe/webhook
```

Copy the webhook signing secret it outputs → `STRIPE_WEBHOOK_SECRET`

For production — owner adds webhook in Stripe Dashboard:
```
URL: https://[app-domain]/api/stripe/webhook
Events:
  - checkout.session.completed
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_failed
```

---

## Coolify Config

- Port: **6001**
- Health check: `/api/health`
- Domain: `https://snippet-harness.agyemanenterprises.com`
  (owner adds Cloudflare tunnel manually)
- Do NOT configure Cloudflare

---

## Build Verification

```bash
npm run build   # zero errors, zero type errors
```

Manually verify each flow:
- [ ] Unauthenticated user redirected to login from `/dashboard`
- [ ] Authenticated user on free plan sees pricing page
- [ ] Clicking upgrade redirects to Stripe Checkout
- [ ] After successful payment, subscription record created in Supabase
- [ ] Dashboard shows correct plan name and period end date
- [ ] "Manage Billing" opens Stripe customer portal
- [ ] Webhook signature verification rejects invalid payloads
- [ ] `customer.subscription.deleted` sets status to cancelled in DB

---

## What You Are NOT Doing

- ❌ Cloudflare — not even to look at it
- ❌ Stripe Connect — that's a separate snippet
- ❌ Custom card forms — use Stripe Checkout hosted only
- ❌ Using `middleware.ts` — Next.js 16 uses `proxy.ts`
- ❌ Changing the port from 6001

---

## When Done — Report Exactly

1. ✅/❌ Schema applied — subscriptions + purchases tables verified
2. ✅/❌ Checkout flow — redirects to Stripe, returns to dashboard
3. ✅/❌ Webhook — all 4 events update database correctly
4. ✅/❌ Portal — opens Stripe billing portal
5. ✅/❌ Dashboard billing page shows correct subscription state
6. ✅/❌ `npm run build` passes clean
7. Port running on: must be **6001**
8. Stripe products owner needs to create (list them)

Then stop. Do not touch Cloudflare, DNS, or tunnel config.
