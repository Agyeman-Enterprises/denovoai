# DeNovo — Content / Media Template Brief
## Deployable baseline for newsletter, course, blog, or podcast platform.
## Token substitution ready. Snippet augmentation ready.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
Port 6009. Stop there.

---

## Definition

A content platform where a creator publishes content and monetizes
through subscriptions or one-time access. Think newsletter + blog,
online course, podcast with paid tier, digital magazine.

---

## Token Map

```typescript
{{APP_NAME}}
{{APP_SLUG}}
{{APP_TAGLINE}}
{{PRIMARY_COLOR}}
{{SECONDARY_COLOR}}

{{CONTENT_NOUN}}            // e.g. "article" / "lesson" / "episode"
{{CONTENT_NOUN_PLURAL}}     // e.g. "articles" / "lessons" / "episodes"
{{CREATOR_NOUN}}            // e.g. "author" / "instructor" / "host"
{{READER_NOUN}}             // e.g. "reader" / "student" / "listener"
{{COLLECTION_NOUN}}         // e.g. "series" / "course" / "season"
{{CATEGORIES_ARRAY}}        // e.g. ["Business","Technology","Design"]

{{FREE_CONTENT_COUNT}}      // e.g. "3" — free articles before paywall
{{PRO_PRICE}}               // e.g. "12" — monthly subscription
{{PRO_PRICE_ANNUAL}}        // e.g. "99" — annual subscription

{{APP_URL}}
```

---

## Database Schema

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  role text check (role in ('reader','admin')) default 'reader',
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan_id text check (plan_id in ('free','pro','annual')) default 'free',
  status text check (status in ('active','cancelled','past_due')) default 'active',
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_image_url text,
  is_pro_only boolean default false,
  status text check (status in ('draft','active','archived')) default 'draft',
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references collections(id) on delete set null,
  title text not null,
  slug text unique not null,
  excerpt text,
  body text,                          -- MDX or rich text
  cover_image_url text,
  category text,
  tags text[] default '{}',
  is_pro_only boolean default false,
  is_featured boolean default false,
  status text check (status in ('draft','published','archived')) default 'draft',
  published_at timestamptz,
  view_count int default 0,
  read_time_minutes int,
  search_vector tsvector,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function update_content_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.excerpt,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.category,'')), 'C');
  return new;
end;
$$ language plpgsql;

create trigger content_search_update
  before insert or update on content_items
  for each row execute function update_content_search_vector();

create index if not exists content_search_idx on content_items using gin(search_vector);
create index if not exists content_published_idx on content_items(published_at desc, status);
create index if not exists content_slug_idx on content_items(slug);

alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table collections enable row level security;
alter table content_items enable row level security;

-- Public can see published free content
create policy "public read free content" on content_items
  for select using (
    status = 'published' and not is_pro_only
  );

-- Pro subscribers see all published content
create policy "pro read all content" on content_items
  for select using (
    status = 'published' and
    exists (
      select 1 from subscriptions s
      where s.user_id = auth.uid()
      and s.plan_id in ('pro','annual')
      and s.status = 'active'
    )
  );

create policy "admin manage content" on content_items
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "public read collections" on collections
  for select using (status = 'active');
create policy "own subscription" on subscriptions for all using (auth.uid() = user_id);
create policy "own profile" on profiles for all using (auth.uid() = id);

-- Seed demo content
insert into content_items (title, slug, excerpt, category, status, is_pro_only, published_at)
select
  '{{CONTENT_NOUN}} ' || i || ': Sample Title',
  '{{APP_SLUG}}-' || i,
  'This is a sample {{CONTENT_NOUN}} excerpt that gives readers a preview.',
  (array{{CATEGORIES_ARRAY}})[((i-1) % array_length(array{{CATEGORIES_ARRAY}}, 1)) + 1],
  'published',
  i > {{FREE_CONTENT_COUNT}},
  now() - (i || ' days')::interval
from generate_series(1, 15) i;
```

---

## Page Structure

```
app/
├── page.tsx                          # Landing: hero + featured content + CTA
├── browse/
│   └── page.tsx                      # All content: search + filter + grid
├── [slug]/
│   └── page.tsx                      # Content detail (paywall if pro_only)
├── collections/
│   └── [id]/
│       └── page.tsx                  # Collection / course page
├── pricing/
│   └── page.tsx                      # Free vs Pro pricing
├── auth/
│   ├── login/page.tsx
│   └── callback/route.ts
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx                      # Reading history + saved items
│   └── billing/page.tsx             # Subscription management
├── admin/
│   ├── page.tsx                      # Content management
│   ├── content/
│   │   ├── page.tsx                  # All content list
│   │   ├── new/page.tsx             # Create content
│   │   └── [id]/edit/page.tsx       # Edit content
│   └── analytics/page.tsx          # View counts + subscriber stats
└── api/
    ├── health/route.ts
    ├── content/
    │   └── [slug]/
    │       └── view/route.ts        # Increment view count
    ├── stripe/
    │   ├── checkout/route.ts
    │   ├── webhook/route.ts
    │   └── portal/route.ts
    └── rss/
        └── route.ts                  # RSS feed
```

---

## Core Flows

### Reader flow
1. Lands on homepage → sees featured content
2. Reads free content (up to {{FREE_CONTENT_COUNT}})
3. Hits paywall → upgrade prompt
4. Signs up + subscribes → all content unlocked
5. Dashboard tracks reading history

### Creator/admin flow
1. Admin logs in → /admin
2. Creates new content item
3. Sets free or pro-only
4. Publishes → appears on site
5. Views analytics (reads, subscribers)

### Subscription flow
1. Reader clicks upgrade → Stripe Checkout
2. Returns → plan = pro
3. Pro content unlocked immediately
4. Billing page shows subscription status

---

## Paywall Component

```typescript
// Show excerpt + blur + upgrade CTA for pro-only content
// when user is not subscribed
export function PaywallGate({ isPro, children }: {
  isPro: boolean
  children: React.ReactNode
}) {
  if (isPro) return <>{children}</>
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none max-h-48 overflow-hidden">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-6 bg-black/80 rounded-xl">
          <p className="font-semibold mb-3">
            Subscribe to read the full {{CONTENT_NOUN}}
          </p>
          <a href="/pricing"
             className="bg-violet-500 text-white px-6 py-2 rounded-lg">
            View Plans
          </a>
        </div>
      </div>
    </div>
  )
}
```

---

## Snippet Compatibility Matrix

| Snippet | Status | Seam Location |
|---|---|---|
| 01 Auth | ✅ Required | paywall + dashboard |
| 02 Stripe Simple | ✅ Required | subscription checkout |
| 03 Stripe Connect | ❌ N/A | — |
| 04 File Upload | ⬜ Optional | cover images + media |
| 05 Admin Panel | ✅ Required | content management |
| 06 Search & Filter | ✅ Required | /browse |
| 07 Output & Delivery | ⬜ Optional | PDF download of content |
| 08 Roles & Permissions | ✅ Required | reader/admin |
| 09 Notifications | ⬜ Optional | new content alerts |
| 10 Messaging | ❌ N/A | — |
| 11 Reviews & Ratings | ❌ N/A | — |
| 12 Bookings | ❌ N/A | — |
| 13 Blog/CMS | ✅ Required | content rendering |
| 14 API + Webhooks | ❌ N/A | — |
| 15 Email | ✅ Required | welcome + new content |

---

## 5 Boot Tests
```bash
npm run build    # zero errors

1. / loads — hero + featured content renders
2. /browse loads — content grid with demo data
3. /[slug] loads for free content without auth
4. /[slug] shows paywall for pro-only content when unauthenticated
5. /api/health returns { status: 'ok' }
```

---

## When Done — Report Exactly
1. ✅/❌ Schema + demo content seeded
2. ✅/❌ Paywall enforces pro-only correctly
3. ✅/❌ Stripe subscription unlocks content
4. ✅/❌ Admin can create and publish content
5. ✅/❌ All 5 boot tests pass
6. ✅/❌ `npm run build` clean
