# DeNovo Studio — Pricing Update Brief
## Targeted change only. Do not touch anything else.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
## 🚨 DO NOT REBUILD OR REFACTOR ANYTHING

This is a surgical update. You are changing pricing data only.
The app is built, deployed, and running. Do not break it.

---

## What You Are Changing

Two things only:
1. The seeded plans in the database
2. The Stripe products/prices (via Stripe Dashboard instructions below)

Nothing else. No UI changes. No schema changes. No refactoring.

---

## Step 1 — Update Supabase Plans Table

Run this SQL in Supabase SQL Editor.
This replaces the existing plan seed data with correct pricing.

```sql
-- Clear existing plans
delete from plans;

-- DeNovo Build Plans (generate and take the code)
insert into plans (id, name, product, monthly_credits, price_monthly_cents, price_annual_cents, overage_cents, features) values
(
  'build-starter',
  'Starter',
  'build',
  3,
  9900,
  95040,
  4900,
  '["3 app builds/month", "Full source code", "Download as zip", "All templates", "Email support"]'
),
(
  'build-builder',
  'Builder',
  'build',
  10,
  24900,
  239040,
  5900,
  '["10 app builds/month", "Full source code", "Download as zip", "All templates", "Priority support", "Best value"]'
),
(
  'build-studio',
  'Studio',
  'build',
  25,
  49900,
  479040,
  6900,
  '["25 app builds/month", "Full source code", "Download as zip", "All templates", "Priority support", "API access"]'
),
(
  'build-agency',
  'Agency',
  'build',
  60,
  99900,
  959040,
  7900,
  '["60 app builds/month", "Full source code", "White label output", "All templates", "Dedicated support", "API access"]'
),

-- DeNovo Launch Plans (we host and run it)
(
  'launch-1',
  'Launch 1',
  'launch',
  1,
  14900,
  143040,
  9900,
  '["1 hosted app", "SSL included", "Managed deploys", "Uptime monitoring", "Email support"]'
),
(
  'launch-5',
  'Launch 5',
  'launch',
  5,
  59900,
  575040,
  10900,
  '["5 hosted apps", "SSL included", "Managed deploys", "Uptime monitoring", "Priority support"]'
),
(
  'launch-15',
  'Launch 15',
  'launch',
  15,
  149900,
  1439040,
  11900,
  '["15 hosted apps", "SSL included", "Managed deploys", "Uptime monitoring", "Priority support", "Custom domains"]'
),
(
  'launch-40',
  'Launch 40',
  'launch',
  40,
  349900,
  3359040,
  14900,
  '["40 hosted apps", "SSL included", "Managed deploys", "Uptime monitoring", "Dedicated support", "Custom domains", "SLA guarantee"]'
);
```

---

## Step 2 — Update Schema If Needed

The plans table may need a `product` column and `overage_cents` column
if they don't exist. Run this first, then the seed above:

```sql
-- Add product column if missing
alter table plans
  add column if not exists product text
    check (product in ('build', 'launch')) default 'build';

-- Add overage_cents column if missing
alter table plans
  add column if not exists overage_cents int default 4900;

-- Update annual price column name if it differs
-- Check existing schema first:
select column_name from information_schema.columns
where table_name = 'plans';
```

Adapt the seed SQL to match existing column names exactly.
Do not rename existing columns.

---

## Step 3 — Update Stripe Products

Create these products in Stripe Dashboard →
Products → Add Product. Owner will fill in the real Price IDs.

### DeNovo Build Products

| Product Name | Monthly Price | Annual Price | Metadata |
|---|---|---|---|
| DeNovo Build — Starter | $99/mo | $950/yr | product=build, credits=3 |
| DeNovo Build — Builder | $249/mo | $2,390/yr | product=build, credits=10 |
| DeNovo Build — Studio | $499/mo | $4,790/yr | product=build, credits=25 |
| DeNovo Build — Agency | $999/mo | $9,590/yr | product=build, credits=60 |

### DeNovo Launch Products

| Product Name | Monthly Price | Annual Price | Metadata |
|---|---|---|---|
| DeNovo Launch — 1 App | $149/mo | $1,430/yr | product=launch, credits=1 |
| DeNovo Launch — 5 Apps | $599/mo | $5,750/yr | product=launch, credits=5 |
| DeNovo Launch — 15 Apps | $1,499/mo | $14,390/yr | product=launch, credits=15 |
| DeNovo Launch — 40 Apps | $3,499/mo | $33,590/yr | product=launch, credits=40 |

### Overage Products (one-time, metered)

| Product Name | Price | Notes |
|---|---|---|
| Extra Build — Starter | $49/app | For build-starter overages |
| Extra Build — Builder | $59/app | For build-builder overages |
| Extra Build — Studio | $69/app | For build-studio overages |
| Extra Build — Agency | $79/app | For build-agency overages |
| Extra Hosted App — Launch 1 | $99/app/mo | For launch-1 overages |
| Extra Hosted App — Launch 5 | $109/app/mo | For launch-5 overages |
| Extra Hosted App — Launch 15 | $119/app/mo | For launch-15 overages |
| Extra Hosted App — Launch 40 | $149/app/mo | For launch-40 overages |

---

## Step 4 — Update Environment Variables in Coolify

Once Stripe products are created, owner adds these to Coolify env vars
for the DeNovo app. You do not set these — just generate the .env.example
with the correct variable names:

```bash
# DeNovo Build Plan Price IDs
STRIPE_BUILD_STARTER_MONTHLY_PRICE_ID=
STRIPE_BUILD_STARTER_ANNUAL_PRICE_ID=
STRIPE_BUILD_BUILDER_MONTHLY_PRICE_ID=
STRIPE_BUILD_BUILDER_ANNUAL_PRICE_ID=
STRIPE_BUILD_STUDIO_MONTHLY_PRICE_ID=
STRIPE_BUILD_STUDIO_ANNUAL_PRICE_ID=
STRIPE_BUILD_AGENCY_MONTHLY_PRICE_ID=
STRIPE_BUILD_AGENCY_ANNUAL_PRICE_ID=

# DeNovo Launch Plan Price IDs
STRIPE_LAUNCH_1_MONTHLY_PRICE_ID=
STRIPE_LAUNCH_1_ANNUAL_PRICE_ID=
STRIPE_LAUNCH_5_MONTHLY_PRICE_ID=
STRIPE_LAUNCH_5_ANNUAL_PRICE_ID=
STRIPE_LAUNCH_15_MONTHLY_PRICE_ID=
STRIPE_LAUNCH_15_ANNUAL_PRICE_ID=
STRIPE_LAUNCH_40_MONTHLY_PRICE_ID=
STRIPE_LAUNCH_40_ANNUAL_PRICE_ID=

# Overage Price IDs
STRIPE_OVERAGE_BUILD_STARTER_PRICE_ID=
STRIPE_OVERAGE_BUILD_BUILDER_PRICE_ID=
STRIPE_OVERAGE_BUILD_STUDIO_PRICE_ID=
STRIPE_OVERAGE_BUILD_AGENCY_PRICE_ID=
STRIPE_OVERAGE_LAUNCH_1_PRICE_ID=
STRIPE_OVERAGE_LAUNCH_5_PRICE_ID=
STRIPE_OVERAGE_LAUNCH_15_PRICE_ID=
STRIPE_OVERAGE_LAUNCH_40_PRICE_ID=
```

---

## Step 5 — Update Pricing Page UI

Find the pricing page component (likely `/app/pricing/page.tsx` or
`/src/components/Pricing.tsx`).

Update displayed prices to match:

**Build Plans:**
- Starter: $99/mo or $950/yr — 3 apps — $49/app overage
- Builder: $249/mo or $2,390/yr — 10 apps — $59/app overage ⭐ BEST VALUE
- Studio: $499/mo or $4,790/yr — 25 apps — $69/app overage
- Agency: $999/mo or $9,590/yr — 60 apps — $79/app overage

**Launch Plans:**
- Launch 1: $149/mo or $1,430/yr — 1 app — $99/app overage
- Launch 5: $599/mo or $5,750/yr — 5 apps — $109/app overage
- Launch 15: $1,499/mo or $14,390/yr — 15 apps — $119/app overage
- Launch 40: $3,499/mo or $33,590/yr — 40 apps — $149/app overage

**Positioning line on pricing page (add this as hero text above plans):**
> "DeNovo doesn't charge for prompts. It charges for launched businesses."

**Two product tabs on pricing page:**
- Tab 1: "Build" — Generate and take the code
- Tab 2: "Launch" — We host, maintain, and run it

---

## Step 6 — Update Overage Logic in Webhook Handler

Find the Stripe webhook handler (`/app/api/stripe/webhook/route.ts`).

Ensure overage charges are looked up by plan ID:

```typescript
const OVERAGE_PRICE_MAP: Record<string, string> = {
  'build-starter':  process.env.STRIPE_OVERAGE_BUILD_STARTER_PRICE_ID!,
  'build-builder':  process.env.STRIPE_OVERAGE_BUILD_BUILDER_PRICE_ID!,
  'build-studio':   process.env.STRIPE_OVERAGE_BUILD_STUDIO_PRICE_ID!,
  'build-agency':   process.env.STRIPE_OVERAGE_BUILD_AGENCY_PRICE_ID!,
  'launch-1':       process.env.STRIPE_OVERAGE_LAUNCH_1_PRICE_ID!,
  'launch-5':       process.env.STRIPE_OVERAGE_LAUNCH_5_PRICE_ID!,
  'launch-15':      process.env.STRIPE_OVERAGE_LAUNCH_15_PRICE_ID!,
  'launch-40':      process.env.STRIPE_OVERAGE_LAUNCH_40_PRICE_ID!,
};
```

---

## Build Verification

After all changes:

```bash
npm run build
```

Must pass with zero errors. Fix anything that breaks.

---

## When Done — Report Exactly

1. ✅/❌ Plans table updated in Supabase
2. ✅/❌ Schema columns added if needed
3. ✅/❌ Pricing page updated with correct prices and tabs
4. ✅/❌ Overage map updated in webhook handler
5. ✅/❌ .env.example updated with all new price ID variables
6. ✅/❌ `npm run build` passes clean
7. List of Stripe products owner needs to create manually

Then stop. Do not touch Cloudflare, DNS, or deployment.
