# DeNovo — SaaS Tool Template Brief
## Deployable baseline for subscription SaaS with dashboard + AI features.
## Token substitution ready. Snippet augmentation ready.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
Port 6003. Stop there.

---

## Definition

Deployable baseline for a single-product SaaS tool. Think invoice generator,
SEO analyzer, AI writer, report builder — any tool a user pays to access.
Subscription gated. Dashboard driven. API ready.

Must pass all 5 boot tests before delivery.

---

## Token Map

```typescript
{{APP_NAME}}              // e.g. "InvoiceAI"
{{APP_SLUG}}              // e.g. "invoiceai"
{{APP_TAGLINE}}           // e.g. "Invoices in seconds, not hours"
{{PRIMARY_COLOR}}         // e.g. "#6366F1"
{{SECONDARY_COLOR}}       // e.g. "#F59E0B"

{{PRIMARY_ENTITY}}        // e.g. "invoice" — the thing the tool creates/manages
{{PRIMARY_ENTITY_PLURAL}} // e.g. "invoices"
{{ACTION_VERB}}           // e.g. "generate" — what the tool does
{{USER_NOUN}}             // e.g. "user" or "client" or "team"

{{FREE_LIMIT}}            // e.g. "3" — free tier monthly limit
{{PRO_PRICE}}             // e.g. "29" — pro plan monthly price USD
{{PRO_LIMIT}}             // e.g. "50" — pro tier monthly limit

{{APP_URL}}
{{APP_NAME}}
```

---

## Database Schema

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text check (role in ('user','admin')) default 'user',
  created_at timestamptz default now()
);

-- Subscription
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan_id text check (plan_id in ('free','pro','business')) default 'free',
  status text check (status in ('active','cancelled','past_due','trialing')) default 'active',
  usage_count int default 0,        -- resets monthly
  usage_limit int default {{FREE_LIMIT}},
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Primary entity (invoices, reports, documents, etc.)
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  status text check (status in ('draft','active','archived')) default 'draft',
  input_data jsonb default '{}',    -- user inputs
  output_data jsonb default '{}',   -- generated output
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Usage log
create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  action text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table items enable row level security;
alter table usage_events enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own subscription" on subscriptions for all using (auth.uid() = user_id);
create policy "own items" on items for all using (auth.uid() = user_id);
create policy "own usage" on usage_events for select using (auth.uid() = user_id);

-- Auto-create subscription on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));

  insert into public.subscriptions (user_id, plan_id, usage_limit)
  values (new.id, 'free', {{FREE_LIMIT}});

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

---

## Page Structure

```
app/
├── page.tsx                        # Landing: hero, features, pricing
├── pricing/
│   └── page.tsx                    # Pricing page
├── auth/
│   ├── login/page.tsx
│   └── callback/route.ts
├── dashboard/
│   ├── layout.tsx                  # Protected shell + usage meter
│   ├── page.tsx                    # Items list + create CTA
│   ├── [id]/
│   │   └── page.tsx                # Item detail / editor
│   ├── billing/
│   │   └── page.tsx                # Plan + usage + upgrade
│   └── settings/
│       └── page.tsx
├── admin/
│   └── page.tsx                    # SNIPPET SEAM: admin panel
└── api/
    ├── health/route.ts
    ├── items/
    │   ├── route.ts                # GET list, POST create
    │   └── [id]/route.ts          # GET, PUT, DELETE
    ├── generate/
    │   └── route.ts                # SNIPPET SEAM: AI generation
    ├── stripe/
    │   ├── checkout/route.ts
    │   ├── webhook/route.ts
    │   └── portal/route.ts
    └── usage/
        └── route.ts                # Check + increment usage
```

---

## Core Flows (must work at baseline)

### Free user flow
1. Lands on homepage → sees value prop
2. Signs up → free plan auto-created
3. Goes to dashboard → sees empty state
4. Creates item → usage incremented
5. Hits free limit → upgrade prompt shown

### Pro user flow
1. Clicks upgrade → Stripe Checkout
2. Returns → plan updated to pro
3. Higher usage limit unlocked
4. Billing page shows plan + period end

### Item creation flow
1. User clicks create
2. Fills in form (title + input_data fields)
3. Submits → item created in DB
4. Output generated (stub — AI seam ready)
5. Item appears in dashboard list

---

## Usage Gate (critical — must enforce)

```typescript
// src/lib/usage.ts
export async function checkAndIncrementUsage(userId: string) {
  const supabase = createAdminClient()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('usage_count, usage_limit, plan_id')
    .eq('user_id', userId)
    .single()

  if (!sub) throw new Error('No subscription found')

  if (sub.usage_count >= sub.usage_limit) {
    throw new Error('USAGE_LIMIT_REACHED')
  }

  await supabase
    .from('subscriptions')
    .update({ usage_count: sub.usage_count + 1 })
    .eq('user_id', userId)

  return true
}
```

Every item creation must call this. If `USAGE_LIMIT_REACHED` → return 402 → frontend shows upgrade modal.

---

## Snippet Compatibility Matrix

| Snippet | Status | Seam Location |
|---|---|---|
| 01 Auth | ✅ Required | proxy.ts + auth/callback |
| 02 Stripe Simple | ✅ Required | /api/stripe/* |
| 03 Stripe Connect | ❌ N/A | Single seller SaaS |
| 04 File Upload | ⬜ Optional | item creation form |
| 05 Admin Panel | ✅ Required | /admin |
| 06 Search & Filter | ⬜ Optional | dashboard item list |
| 07 Output & Delivery | ✅ Required | item detail (export/download) |
| 08 Roles & Permissions | ✅ Required | user/admin |
| 09 Notifications | ⬜ Optional | usage alerts |
| 10 Messaging | ❌ N/A | — |
| 11 Reviews & Ratings | ❌ N/A | — |
| 12 Bookings | ❌ N/A | — |
| 13 Blog/CMS | ⬜ Optional | /blog |
| 14 API + Webhooks | ✅ Required | /api/v1 |
| 15 Email | ✅ Required | auth + usage alerts |

---

## Landing Page Content (tokens throughout)

```
H1: {{ACTION_VERB}} {{PRIMARY_ENTITY_PLURAL}} in seconds.
Subline: {{APP_TAGLINE}}
CTA: Start Free — {{FREE_LIMIT}} {{PRIMARY_ENTITY_PLURAL}} free every month.
```

Three feature cards:
```
Fast: {{ACTION_VERB}} a {{PRIMARY_ENTITY}} in under 60 seconds.
Simple: No setup. No learning curve.
Yours: Export, download, share — you own the output.
```

Pricing section — 3 tiers:
```
Free: $0 — {{FREE_LIMIT}} {{PRIMARY_ENTITY_PLURAL}}/month
Pro: ${{PRO_PRICE}}/mo — {{PRO_LIMIT}} {{PRIMARY_ENTITY_PLURAL}}/month
Business: Contact us — Unlimited
```

---

## 5 Boot Tests
```bash
npm run build    # zero errors

1. / loads — hero renders with tokens
2. /dashboard redirects to /auth/login unauthenticated
3. /pricing loads — 3 tiers displayed
4. /api/usage returns usage count for authenticated user
5. /api/health returns { status: 'ok' }
```

---

## Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_BUSINESS_MONTHLY_PRICE_ID=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME={{APP_NAME}}
```

---

## When Done — Report Exactly
1. ✅/❌ Schema + trigger applied
2. ✅/❌ Usage gate enforces free limit
3. ✅/❌ Stripe checkout + webhook updates plan
4. ✅/❌ All 5 boot tests pass
5. ✅/❌ `npm run build` clean
