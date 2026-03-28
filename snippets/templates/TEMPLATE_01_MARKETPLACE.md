# DeNovo — Marketplace Template Brief
## Deployable baseline for two-sided service + events marketplace.
## Token substitution ready. Snippet augmentation ready.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Port 6002. Stop there.

---

## Definition

This is a production-grade canonical template. It must:
1. Boot successfully
2. Render a coherent app
3. Support core CRUD and core flows
4. Accept snippet additions cleanly
5. Survive token substitution without breaking

It is NOT a bespoke customer app. It is a deployable baseline
for a two-sided marketplace business model.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js latest stable |
| Database | Supabase |
| Auth | Supabase Auth via @supabase/ssr |
| Payments | Stripe Connect |
| Styling | Tailwind CSS |
| Language | TypeScript strict |
| Port | 6002 (template test port) |

---

## Token Map

Every token below appears throughout the codebase as `{{TOKEN}}`.
The Assembler replaces all tokens at spin-up time.

```typescript
{{APP_NAME}}              // e.g. "ShootSpace"
{{APP_SLUG}}              // e.g. "shootspace"
{{APP_TAGLINE}}           // e.g. "Book the perfect photographer"
{{PRIMARY_COLOR}}         // e.g. "#8B5CF6"
{{SECONDARY_COLOR}}       // e.g. "#06B6D4"

{{SELLER_NOUN}}           // e.g. "photographer"
{{SELLER_NOUN_PLURAL}}    // e.g. "photographers"
{{BUYER_NOUN}}            // e.g. "venue"
{{BUYER_NOUN_PLURAL}}     // e.g. "venues"
{{LISTING_NOUN}}          // e.g. "service"
{{LISTING_NOUN_PLURAL}}   // e.g. "services"

{{CATEGORIES_ARRAY}}      // e.g. ["Weddings","Corporate","Concerts"]
{{PLATFORM_FEE_PERCENT}}  // e.g. "10"
{{CURRENCY}}              // e.g. "usd"

{{APP_URL}}               // e.g. "https://shootspace.denovoai.co"
```

All user-visible strings use tokens. No hardcoded business names.

---

## Supabase Credentials
```
NEXT_PUBLIC_SUPABASE_URL=https://jomualvckaudlcqrfvxv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXVhbHZja2F1ZGxjcXJmdnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjUwNDIsImV4cCI6MjA4ODM0MTA0Mn0.nlMkdRyIMQ18Uf6MThIJn1kbN63VdArQ-p5Mw-_4Z-A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXVhbHZja2F1ZGxjcXJmdnh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc2NTA0MiwiZXhwIjoyMDg4MzQxMDQyfQ.3Hoz8-brzx8eX4kibH_hVcRdz645dn5HfVoAtUvbA9c
```

---

## Database Schema

```sql
-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  role text check (role in ('buyer','seller','both','admin')) default 'buyer',
  stripe_account_id text,
  stripe_onboarded boolean default false,
  created_at timestamptz default now()
);

-- Listings
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  category text,
  price_cents int not null,
  currency text default '{{CURRENCY}}',
  listing_type text check (listing_type in ('service','event')) default 'service',
  status text check (status in ('draft','active','paused','archived')) default 'draft',
  images text[] default '{}',
  tags text[] default '{}',
  metadata jsonb default '{}',
  search_vector tsvector,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Search vector trigger
create or replace function update_listing_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.category,'')), 'C');
  return new;
end;
$$ language plpgsql;

create trigger listings_search_update
  before insert or update on listings
  for each row execute function update_listing_search_vector();

create index if not exists listings_search_idx on listings using gin(search_vector);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id),
  buyer_id uuid references profiles(id),
  seller_id uuid references profiles(id),
  status text check (status in (
    'pending','paid','in_progress','complete','refunded','disputed'
  )) default 'pending',
  amount_cents int not null,
  platform_fee_cents int not null,
  seller_payout_cents int not null,
  stripe_payment_intent_id text unique,
  stripe_transfer_id text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SNIPPET SEAM: reviews (injected by snippet 11)
-- SNIPPET SEAM: messages (injected by snippet 10)
-- SNIPPET SEAM: bookings (injected by snippet 12)
-- SNIPPET SEAM: notifications (injected by snippet 09)

-- RLS
alter table profiles enable row level security;
alter table listings enable row level security;
alter table orders enable row level security;

create policy "public read profiles" on profiles for select using (true);
create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "public read active listings" on listings
  for select using (status = 'active');
create policy "sellers manage own listings" on listings
  for all using (auth.uid() = seller_id);
create policy "buyers see own orders" on orders
  for select using (auth.uid() = buyer_id);
create policy "sellers see own orders" on orders
  for select using (auth.uid() = seller_id);

-- Seed demo data
insert into listings (seller_id, title, description, category, price_cents, status)
select
  (select id from profiles limit 1),
  '{{LISTING_NOUN}} ' || i,
  'A great {{LISTING_NOUN}} for your needs.',
  (select unnest(array{{CATEGORIES_ARRAY}}) limit 1),
  (random() * 50000 + 5000)::int,
  'active'
from generate_series(1, 12) i
on conflict do nothing;
```

---

## Page Structure

```
app/
├── page.tsx                        # Landing: hero, featured listings, categories
├── browse/
│   └── page.tsx                    # Browse + search + filter
├── listing/
│   └── [id]/
│       └── page.tsx                # Listing detail + CTA
├── seller/
│   └── [id]/
│       └── page.tsx                # Seller public profile
├── checkout/
│   └── page.tsx                    # Stripe Checkout redirect
├── dashboard/
│   ├── layout.tsx                  # Protected shell
│   ├── page.tsx                    # Overview
│   ├── orders/
│   │   └── page.tsx                # Buyer: my orders
│   ├── listings/
│   │   └── page.tsx                # Seller: manage listings
│   ├── earnings/
│   │   └── page.tsx                # Seller: payouts
│   ├── messages/                   # SNIPPET SEAM: messaging
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx                # Profile settings
├── onboarding/
│   └── seller/
│       └── page.tsx                # Stripe Connect onboarding
├── admin/
│   └── page.tsx                    # SNIPPET SEAM: admin panel
└── api/
    ├── health/route.ts
    ├── stripe/
    │   ├── checkout/route.ts
    │   ├── connect/
    │   │   ├── onboard/route.ts
    │   │   └── callback/route.ts
    │   └── webhook/route.ts
    ├── listings/
    │   └── route.ts
    └── orders/
        └── route.ts
```

---

## Snippet Compatibility Matrix

| Snippet | Status | Seam Location |
|---|---|---|
| 01 Auth | ✅ Required | proxy.ts + auth/callback |
| 02 Stripe Simple | ❌ N/A | Connect used instead |
| 03 Stripe Connect | ✅ Required | checkout + earnings |
| 04 File Upload | ✅ Required | listing create form |
| 05 Admin Panel | ✅ Required | /admin route |
| 06 Search & Filter | ✅ Required | /browse page |
| 07 Output & Delivery | ⬜ Optional | order detail |
| 08 Roles & Permissions | ✅ Required | buyer/seller/admin |
| 09 Notifications | ⬜ Optional | order + message events |
| 10 Messaging | ✅ Required | /dashboard/messages |
| 11 Reviews & Ratings | ✅ Required | order complete flow |
| 12 Bookings | ⬜ Optional | listing detail (service type) |
| 13 Blog/CMS | ❌ N/A | — |
| 14 API + Webhooks | ⬜ Optional | /api/v1 |
| 15 Email | ✅ Required | auth + order events |

---

## Core Flows (must work at baseline)

### Buyer flow
1. Lands on homepage → sees listings
2. Browses by category
3. Views listing detail
4. Signs up / logs in
5. Proceeds to checkout → Stripe hosted
6. Returns to dashboard → sees order

### Seller flow
1. Signs up → role = seller
2. Completes Stripe Connect onboarding
3. Creates a listing → sets price, description, images
4. Publishes listing → appears in browse
5. Receives order → sees in dashboard/earnings

### Admin flow
1. Admin user logs in
2. Accesses /admin
3. Sees user list and listing list
4. Can moderate (pause/archive listing)

---

## Landing Page Content (tokens throughout)

**Hero:**
```
H1: Find the right {{SELLER_NOUN}} for your next event.
Subline: Browse {{LISTING_NOUN_PLURAL}} from verified {{SELLER_NOUN_PLURAL}}.
CTA: Browse {{LISTING_NOUN_PLURAL}}
```

**Categories section:**
```
Render {{CATEGORIES_ARRAY}} as clickable filter chips.
Each links to /browse?category=[value]
```

**Featured listings:**
```
Show 6 newest active listings as cards.
Each card: image, title, seller name, price, category badge.
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
STRIPE_PLATFORM_FEE_PERCENT={{PLATFORM_FEE_PERCENT}}

NEXT_PUBLIC_APP_URL={{APP_URL}}
NEXT_PUBLIC_APP_NAME={{APP_NAME}}
NEXT_PUBLIC_PRIMARY_COLOR={{PRIMARY_COLOR}}
```

---

## Coolify Config
- Port: **6002**
- Health check: `/api/health`
- Do NOT configure Cloudflare

---

## 5 Boot Tests (acceptance criteria)

```bash
npm run build    # Must pass zero errors

# Then verify:
1. / loads — hero renders with {{APP_NAME}} token visible
2. /browse loads — listings grid renders with demo data
3. /auth/login loads — all 3 auth methods present
4. /dashboard redirects to /auth/login when unauthenticated
5. /api/health returns { status: 'ok' }
```

All 5 must pass. If any fail, Claude Code is not done.

---

## What You Are NOT Doing
- ❌ Building every possible marketplace vertical
- ❌ Custom business logic beyond baseline flows
- ❌ Cloudflare, DNS, tunnels
- ❌ Changing port from 6002

## When Done — Report Exactly
1. ✅/❌ Schema applied + demo data seeded
2. ✅/❌ All 3 core flows work end to end
3. ✅/❌ All 5 boot tests pass
4. ✅/❌ All tokens present and substitutable
5. ✅/❌ `npm run build` passes clean
6. List any snippet seams that need adjustment
