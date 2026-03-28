# DeNovo — Directory Template Brief
## Deployable baseline for listings directory with search, submit, reviews.
## Token substitution ready. Snippet augmentation ready.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
Port 6004. Stop there.

---

## Definition

A browsable directory of listings. Users can browse, search, filter,
and submit their own listing. Optional paid featured listings.
Think job board, vendor directory, resource hub, local business directory.

---

## Token Map

```typescript
{{APP_NAME}}
{{APP_SLUG}}
{{APP_TAGLINE}}
{{PRIMARY_COLOR}}
{{SECONDARY_COLOR}}

{{LISTING_NOUN}}            // e.g. "vendor" / "job" / "resource"
{{LISTING_NOUN_PLURAL}}     // e.g. "vendors" / "jobs" / "resources"
{{SUBMITTER_NOUN}}          // e.g. "vendor" / "employer" / "creator"
{{CATEGORIES_ARRAY}}        // e.g. ["Design","Development","Marketing"]
{{LISTING_FIELDS}}          // e.g. ["website","location","founded_year"]

{{FEATURED_PRICE}}          // e.g. "49" — one-time featured listing fee USD
{{SUBMIT_REQUIRES_APPROVAL}} // "true" or "false"

{{APP_URL}}
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

create table if not exists directory_listings (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid references profiles(id) on delete set null,
  name text not null,
  description text,
  category text,
  tags text[] default '{}',
  website_url text,
  logo_url text,
  location text,
  status text check (status in ('pending','active','rejected','archived')) default 'pending',
  is_featured boolean default false,
  featured_until timestamptz,
  metadata jsonb default '{}',       -- {{LISTING_FIELDS}} values go here
  search_vector tsvector,
  view_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function update_directory_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.category,'')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.tags,' '),'')), 'C');
  return new;
end;
$$ language plpgsql;

create trigger directory_search_update
  before insert or update on directory_listings
  for each row execute function update_directory_search_vector();

create index if not exists directory_search_idx
  on directory_listings using gin(search_vector);
create index if not exists directory_category_idx
  on directory_listings(category, status);
create index if not exists directory_featured_idx
  on directory_listings(is_featured, status);

alter table profiles enable row level security;
alter table directory_listings enable row level security;

create policy "public read active listings" on directory_listings
  for select using (status = 'active');
create policy "submitters manage own" on directory_listings
  for all using (auth.uid() = submitter_id);

-- Seed demo data
insert into directory_listings (name, description, category, status, is_featured)
select
  '{{LISTING_NOUN}} ' || i,
  'A great {{LISTING_NOUN}} worth knowing about.',
  (array{{CATEGORIES_ARRAY}})[((i-1) % array_length(array{{CATEGORIES_ARRAY}}, 1)) + 1],
  'active',
  i <= 3
from generate_series(1, 20) i;
```

---

## Page Structure

```
app/
├── page.tsx                          # Landing: search hero + featured + categories
├── browse/
│   └── page.tsx                      # Full directory: search + filter + grid
├── listing/
│   └── [id]/
│       └── page.tsx                  # Listing detail + contact/visit CTA
├── submit/
│   └── page.tsx                      # Submit a listing form
├── auth/
│   ├── login/page.tsx
│   └── callback/route.ts
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx                      # My submitted listings
│   └── settings/page.tsx
├── admin/
│   ├── page.tsx                      # Pending approval queue
│   └── listings/page.tsx            # All listings management
└── api/
    ├── health/route.ts
    ├── listings/
    │   ├── route.ts                  # GET + POST
    │   └── [id]/
    │       ├── route.ts              # GET + PUT + DELETE
    │       └── view/route.ts        # Increment view count
    ├── stripe/
    │   ├── checkout/route.ts        # Featured listing payment
    │   └── webhook/route.ts
    └── admin/
        └── approve/route.ts         # Approve/reject submissions
```

---

## Core Flows

### Browse flow
1. Lands on homepage → search bar prominent
2. Types query → results filter live
3. Clicks category → filtered view
4. Clicks listing → detail page
5. Clicks website/contact CTA

### Submit flow
1. Clicks "Submit {{LISTING_NOUN}}"
2. Auth gate (must be logged in)
3. Fills form: name, description, category, website, logo
4. Submits → status = pending (if approval required) or active
5. Optional: pays {{FEATURED_PRICE}} for featured placement

### Admin approval flow (if {{SUBMIT_REQUIRES_APPROVAL}} = true)
1. Admin sees pending queue at /admin
2. Reviews submission
3. Approves → status = active
4. Or rejects with reason

---

## Snippet Compatibility Matrix

| Snippet | Status | Seam Location |
|---|---|---|
| 01 Auth | ✅ Required | submit gate + dashboard |
| 02 Stripe Simple | ⬜ Optional | featured listing payment |
| 03 Stripe Connect | ❌ N/A | — |
| 04 File Upload | ✅ Required | logo upload on submit |
| 05 Admin Panel | ✅ Required | approval queue |
| 06 Search & Filter | ✅ Required | /browse |
| 07 Output & Delivery | ⬜ Optional | export directory as CSV |
| 08 Roles & Permissions | ✅ Required | submitter/admin |
| 09 Notifications | ⬜ Optional | approval status updates |
| 10 Messaging | ❌ N/A | — |
| 11 Reviews & Ratings | ⬜ Optional | listing reviews |
| 12 Bookings | ❌ N/A | — |
| 13 Blog/CMS | ⬜ Optional | /blog |
| 14 API + Webhooks | ⬜ Optional | — |
| 15 Email | ✅ Required | submission + approval |

---

## Landing Page Content

```
H1: Find the best {{LISTING_NOUN_PLURAL}}.
Subline: {{APP_TAGLINE}}

Search bar: "Search {{LISTING_NOUN_PLURAL}}..."

Featured section: "Featured {{LISTING_NOUN_PLURAL}}"
— show is_featured=true listings

Category grid: render {{CATEGORIES_ARRAY}}
— each links to /browse?category=[value]

CTA: "Submit your {{LISTING_NOUN}}" → /submit
```

---

## 5 Boot Tests
```bash
npm run build    # zero errors

1. / loads — hero + featured listings render
2. /browse loads — directory grid with demo data
3. /submit redirects to /auth/login unauthenticated
4. /admin redirects non-admins to /dashboard
5. /api/health returns { status: 'ok' }
```

---

## When Done — Report Exactly
1. ✅/❌ Schema + demo data applied
2. ✅/❌ Browse + search work
3. ✅/❌ Submit flow works (pending or active based on token)
4. ✅/❌ All 5 boot tests pass
5. ✅/❌ `npm run build` clean
