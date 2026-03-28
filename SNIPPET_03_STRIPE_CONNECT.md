# DeNovo — Stripe Connect Snippet Brief
## Marketplace split payments. Seller onboarding. Platform fees.
## Builds on top of Auth + Stripe Simple. Both must be in harness first.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Port 6001. Stop there.

---

## What This Adds to the Harness (port 6001)

Stripe Connect enables marketplace payments — platform takes a fee,
seller receives the rest. This snippet adds to the existing harness app.
Do not create a new app. Add to what's already running on port 6001.

---

## Database Schema (add to existing)

```sql
-- Seller accounts
create table if not exists seller_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  stripe_account_id text unique,
  stripe_onboarded boolean default false,
  stripe_charges_enabled boolean default false,
  stripe_payouts_enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Marketplace orders
create table if not exists marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references profiles(id),
  seller_id uuid references profiles(id),
  stripe_payment_intent_id text unique,
  stripe_transfer_id text,
  amount_cents int not null,
  platform_fee_cents int not null,
  seller_payout_cents int not null,
  currency text default 'usd',
  status text check (status in (
    'pending','paid','transferred','refunded','disputed'
  )) default 'pending',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table seller_profiles enable row level security;
alter table marketplace_orders enable row level security;

create policy "own seller profile" on seller_profiles
  for all using (auth.uid() = id);
create policy "buyer sees own orders" on marketplace_orders
  for select using (auth.uid() = buyer_id);
create policy "seller sees own orders" on marketplace_orders
  for select using (auth.uid() = seller_id);
```

---

## New Files to Add

```
src/app/
├── onboarding/
│   └── seller/
│       └── page.tsx          # Stripe Connect onboarding flow
├── dashboard/
│   └── earnings/
│       └── page.tsx          # Seller earnings + payout status
└── api/
    └── stripe/
        ├── connect/
        │   ├── onboard/route.ts    # Create Connect account + onboarding link
        │   └── callback/route.ts  # Handle return from Stripe onboarding
        └── transfer/route.ts      # Manual transfer trigger (admin only)
```

---

## Implementation Details

### `src/app/api/stripe/connect/onboard/route.ts`
```typescript
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get or create Connect account
  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single()

  let accountId = seller?.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    accountId = account.id

    await supabase.from('seller_profiles').upsert({
      id: user.id,
      stripe_account_id: accountId,
    })
  }

  // Create onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/seller?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/seller/callback`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
```

### `src/app/api/stripe/connect/callback/route.ts`
```typescript
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single()

  if (seller?.stripe_account_id) {
    const account = await stripe.accounts.retrieve(seller.stripe_account_id)
    await supabase.from('seller_profiles')
      .update({
        stripe_onboarded: account.details_submitted,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
  }

  return NextResponse.redirect(
    new URL('/dashboard/earnings', request.url)
  )
}
```

### Webhook additions (add to existing webhook handler)
```typescript
case 'account.updated': {
  const account = event.data.object
  const userId = account.metadata?.supabase_user_id
  if (userId) {
    await supabase.from('seller_profiles')
      .update({
        stripe_onboarded: account.details_submitted,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
  }
  break
}
```

### Platform fee checkout (add to existing checkout route)
```typescript
// For marketplace purchases — add to checkout route
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'payment',
  payment_intent_data: {
    application_fee_amount: platformFeeCents,
    transfer_data: {
      destination: sellerStripeAccountId,
    },
  },
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/browse?cancelled=true`,
})
```

---

## Environment Variables (add to existing)
```bash
STRIPE_PLATFORM_FEE_PERCENT=10
```

---

## Verification Checklist
- [ ] Seller can initiate Connect onboarding
- [ ] Stripe Express dashboard opens correctly
- [ ] Callback updates seller_profiles with correct flags
- [ ] Marketplace checkout creates payment with platform fee
- [ ] Seller receives payout minus platform fee
- [ ] `account.updated` webhook fires and updates DB
- [ ] Earnings page shows correct payout status
- [ ] `npm run build` passes clean

---

## When Done — Report Exactly
1. ✅/❌ seller_profiles + marketplace_orders tables created
2. ✅/❌ Seller onboarding flow completes end to end
3. ✅/❌ Marketplace checkout fires with correct fee split
4. ✅/❌ Webhook updates seller status correctly
5. ✅/❌ `npm run build` passes clean
