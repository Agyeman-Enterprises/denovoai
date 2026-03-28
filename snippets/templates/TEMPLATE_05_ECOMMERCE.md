# DeNovo — E-Commerce Template Brief
## Deployable baseline for digital products, subscriptions, or physical store.
## Token substitution ready. Snippet augmentation ready.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
Port 6006. Stop there.

---

## Definition

A single-seller storefront. Owner sells products, customers buy.
Supports digital downloads, physical products, or subscriptions.
No marketplace split — single seller keeps all revenue minus Stripe fees.

---

## Token Map

```typescript
{{APP_NAME}}
{{APP_SLUG}}
{{APP_TAGLINE}}
{{PRIMARY_COLOR}}
{{SECONDARY_COLOR}}

{{PRODUCT_NOUN}}            // e.g. "product" / "template" / "course"
{{PRODUCT_NOUN_PLURAL}}     // e.g. "products" / "templates" / "courses"
{{STORE_NOUN}}              // e.g. "store" / "shop" / "marketplace"
{{CATEGORIES_ARRAY}}        // e.g. ["Templates","UI Kits","Icons","Fonts"]
{{PRODUCT_TYPE}}            // "digital" / "physical" / "subscription"

{{CURRENCY}}                // e.g. "usd"
{{APP_URL}}
```

---

## Database Schema

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text check (role in ('customer','admin')) default 'customer',
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  tags text[] default '{}',
  price_cents int not null,
  compare_at_price_cents int,        -- for sale pricing
  currency text default '{{CURRENCY}}',
  product_type text check (product_type in ('digital','physical','subscription')) default '{{PRODUCT_TYPE}}',
  images text[] default '{}',
  download_url text,                  -- for digital products
  stripe_price_id text,
  status text check (status in ('draft','active','archived')) default 'draft',
  stock_count int,                    -- null = unlimited
  metadata jsonb default '{}',
  search_vector tsvector,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function update_product_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.category,'')), 'C');
  return new;
end;
$$ language plpgsql;

create trigger products_search_update
  before insert or update on products
  for each row execute function update_product_search_vector();

create index if not exists products_search_idx on products using gin(search_vector);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id),
  stripe_payment_intent_id text unique,
  stripe_session_id text unique,
  status text check (status in ('pending','paid','fulfilled','refunded','cancelled')) default 'pending',
  amount_cents int not null,
  currency text default '{{CURRENCY}}',
  email text,                         -- for guest checkout
  shipping_address jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int default 1,
  price_cents int not null,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "public read active products" on products
  for select using (status = 'active');
create policy "customers see own orders" on orders
  for select using (auth.uid() = customer_id);
create policy "own profile" on profiles for all using (auth.uid() = id);

-- Seed demo products
insert into products (title, description, category, price_cents, status, product_type)
select
  '{{PRODUCT_NOUN}} ' || i,
  'A high quality {{PRODUCT_NOUN}} for your needs.',
  (array{{CATEGORIES_ARRAY}})[((i-1) % array_length(array{{CATEGORIES_ARRAY}}, 1)) + 1],
  (random() * 9900 + 100)::int,
  'active',
  '{{PRODUCT_TYPE}}'
from generate_series(1, 12) i;
```

---

## Page Structure

```
app/
├── page.tsx                          # Store landing: hero + featured products
├── shop/
│   └── page.tsx                      # Full product grid + filter
├── product/
│   └── [id]/
│       └── page.tsx                  # Product detail + add to cart
├── cart/
│   └── page.tsx                      # Cart review
├── checkout/
│   └── page.tsx                      # Stripe Checkout redirect
├── order/
│   ├── success/page.tsx              # Order confirmation
│   └── [id]/page.tsx                 # Order detail + download link
├── auth/
│   ├── login/page.tsx
│   └── callback/route.ts
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx                      # My orders
│   └── downloads/page.tsx            # My digital downloads
├── admin/
│   ├── page.tsx                      # Sales dashboard
│   ├── products/page.tsx             # Product management
│   └── orders/page.tsx              # Order management
└── api/
    ├── health/route.ts
    ├── cart/route.ts                 # Cart state (server-side session)
    ├── stripe/
    │   ├── checkout/route.ts
    │   ├── webhook/route.ts
    │   └── portal/route.ts
    └── downloads/
        └── [orderId]/route.ts       # Signed download URL (digital products)
```

---

## Core Flows

### Browse + purchase flow
1. Visitor lands on store → sees products
2. Clicks product → detail page
3. Adds to cart
4. Proceeds to checkout → Stripe hosted
5. Returns to /order/success
6. Gets download link (digital) or shipping confirmation (physical)

### Admin flow
1. Admin logs in → /admin
2. Creates/edits products
3. Views orders
4. Marks orders as fulfilled

### Digital download flow
1. Order paid → webhook fires
2. Order status = paid
3. Customer visits /dashboard/downloads
4. Clicks download → signed URL generated → file served

---

## Cart (client-side state + server validation)

```typescript
// src/lib/cart.ts
// Cart lives in localStorage for guests, synced on login
interface CartItem {
  productId: string
  quantity: number
  priceCents: number
  title: string
}
// On checkout: validate prices server-side before creating Stripe session
// Never trust client-side prices
```

---

## Snippet Compatibility Matrix

| Snippet | Status | Seam Location |
|---|---|---|
| 01 Auth | ✅ Required | checkout + dashboard |
| 02 Stripe Simple | ✅ Required | product checkout |
| 03 Stripe Connect | ❌ N/A | Single seller |
| 04 File Upload | ✅ Required | product images + digital files |
| 05 Admin Panel | ✅ Required | product + order management |
| 06 Search & Filter | ✅ Required | /shop |
| 07 Output & Delivery | ✅ Required | PDF receipts + downloads |
| 08 Roles & Permissions | ✅ Required | customer/admin |
| 09 Notifications | ⬜ Optional | order updates |
| 10 Messaging | ❌ N/A | — |
| 11 Reviews & Ratings | ✅ Required | product reviews |
| 12 Bookings | ❌ N/A | — |
| 13 Blog/CMS | ⬜ Optional | /blog |
| 14 API + Webhooks | ⬜ Optional | order webhooks |
| 15 Email | ✅ Required | order confirmation + download |

---

## 5 Boot Tests
```bash
npm run build    # zero errors

1. / loads — store hero + product grid renders
2. /shop loads — product grid with demo data
3. /product/[id] loads — product detail renders
4. /cart loads — empty cart state renders
5. /api/health returns { status: 'ok' }
```

---

## When Done — Report Exactly
1. ✅/❌ Schema + demo products seeded
2. ✅/❌ Browse + purchase flow works end to end
3. ✅/❌ Cart validates prices server-side
4. ✅/❌ All 5 boot tests pass
5. ✅/❌ `npm run build` clean
