# DeNovo — Community Template Brief
## Deployable baseline for membership community, forum, or creator platform.
## Token substitution ready. Snippet augmentation ready.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
Port 6005. Stop there.

---

## Definition

A membership community where users post, discuss, and connect.
Optional paid membership tier. Think niche forum, creator community,
private membership club, professional network.

---

## Token Map

```typescript
{{APP_NAME}}
{{APP_SLUG}}
{{APP_TAGLINE}}
{{PRIMARY_COLOR}}
{{SECONDARY_COLOR}}

{{COMMUNITY_NOUN}}          // e.g. "community" / "network" / "club"
{{MEMBER_NOUN}}             // e.g. "member" / "creator" / "professional"
{{MEMBER_NOUN_PLURAL}}      // e.g. "members" / "creators"
{{POST_NOUN}}               // e.g. "post" / "discussion" / "thread"
{{POST_NOUN_PLURAL}}        // e.g. "posts" / "discussions"
{{CATEGORIES_ARRAY}}        // e.g. ["General","Resources","Jobs","Events"]

{{FREE_ACCESS}}             // "true" — free to join, or "false" — paid only
{{PRO_PRICE}}               // e.g. "19" — monthly membership price
{{APP_URL}}
```

---

## Database Schema

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  role text check (role in ('member','moderator','admin','banned')) default 'member',
  is_pro boolean default false,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text check (status in ('active','cancelled','past_due')) default 'active',
  current_period_end timestamptz,
  created_at timestamptz default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade,
  title text not null,
  body text not null,
  category text,
  tags text[] default '{}',
  is_pinned boolean default false,
  is_locked boolean default false,
  is_pro_only boolean default false,
  status text check (status in ('active','removed','archived')) default 'active',
  view_count int default 0,
  reply_count int default 0,
  last_reply_at timestamptz,
  search_vector tsvector,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  body text not null,
  is_solution boolean default false,
  status text check (status in ('active','removed')) default 'active',
  created_at timestamptz default now()
);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  reaction text check (reaction in ('like','helpful','fire')) default 'like',
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

create or replace function update_post_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.body,'')), 'B');
  return new;
end;
$$ language plpgsql;

create trigger posts_search_update
  before insert or update on posts
  for each row execute function update_post_search_vector();

-- Update reply count on post when reply added
create or replace function update_reply_count()
returns trigger as $$
begin
  update posts set
    reply_count = (select count(*) from replies where post_id = new.post_id and status = 'active'),
    last_reply_at = now()
  where id = new.post_id;
  return new;
end;
$$ language plpgsql;

create trigger on_reply_created
  after insert on replies
  for each row execute function update_reply_count();

alter table profiles enable row level security;
alter table posts enable row level security;
alter table replies enable row level security;
alter table reactions enable row level security;
alter table subscriptions enable row level security;

create policy "public read profiles" on profiles for select using (true);
create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "public read active posts" on posts
  for select using (status = 'active' and (not is_pro_only or
    exists (select 1 from subscriptions s where s.user_id = auth.uid() and s.status = 'active')
  ));
create policy "members create posts" on posts
  for insert with check (auth.uid() = author_id);
create policy "own posts" on posts for update using (auth.uid() = author_id);
create policy "public read replies" on replies
  for select using (status = 'active');
create policy "members reply" on replies
  for insert with check (auth.uid() = author_id);
create policy "own reactions" on reactions for all using (auth.uid() = user_id);
create policy "own subscription" on subscriptions for all using (auth.uid() = user_id);

-- Seed demo data
insert into posts (author_id, title, body, category, status)
select
  (select id from profiles limit 1),
  'Welcome to {{APP_NAME}} — {{POST_NOUN}} ' || i,
  'This is a sample {{POST_NOUN}} to get things started.',
  (array{{CATEGORIES_ARRAY}})[((i-1) % array_length(array{{CATEGORIES_ARRAY}}, 1)) + 1],
  'active'
from generate_series(1, 10) i;
```

---

## Page Structure

```
app/
├── page.tsx                          # Landing or feed (if logged in)
├── feed/
│   └── page.tsx                      # Main community feed
├── post/
│   ├── new/page.tsx                  # Create post
│   └── [id]/page.tsx                 # Post detail + replies
├── members/
│   └── page.tsx                      # Member directory
├── profile/
│   └── [id]/page.tsx                 # Member profile + posts
├── auth/
│   ├── login/page.tsx
│   └── callback/route.ts
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx                      # My posts + activity
│   └── settings/page.tsx
├── upgrade/
│   └── page.tsx                      # Pro membership CTA
├── admin/
│   └── page.tsx                      # Moderation queue
└── api/
    ├── health/route.ts
    ├── posts/
    │   ├── route.ts
    │   └── [id]/
    │       ├── route.ts
    │       ├── replies/route.ts
    │       └── react/route.ts
    └── stripe/
        ├── checkout/route.ts
        ├── webhook/route.ts
        └── portal/route.ts
```

---

## Core Flows

### Browse flow
1. Visitor sees landing page or feed
2. Browses posts by category
3. Clicks post → sees replies
4. Signs up to reply or react

### Post + reply flow
1. Logged-in member creates post
2. Sets title, body, category
3. Other members reply
4. Author marks best reply as solution

### Pro membership flow
1. User hits pro-only content → upgrade prompt
2. Clicks upgrade → Stripe Checkout
3. Returns → is_pro = true
4. Can now see pro-only posts

---

## Snippet Compatibility Matrix

| Snippet | Status | Seam Location |
|---|---|---|
| 01 Auth | ✅ Required | post/reply gates |
| 02 Stripe Simple | ⬜ Optional | pro membership |
| 03 Stripe Connect | ❌ N/A | — |
| 04 File Upload | ⬜ Optional | post images + avatars |
| 05 Admin Panel | ✅ Required | moderation |
| 06 Search & Filter | ✅ Required | /feed search |
| 07 Output & Delivery | ❌ N/A | — |
| 08 Roles & Permissions | ✅ Required | member/mod/admin |
| 09 Notifications | ✅ Required | reply notifications |
| 10 Messaging | ⬜ Optional | member DMs |
| 11 Reviews & Ratings | ❌ N/A | — |
| 12 Bookings | ❌ N/A | — |
| 13 Blog/CMS | ⬜ Optional | /blog |
| 14 API + Webhooks | ❌ N/A | — |
| 15 Email | ✅ Required | welcome + reply alerts |

---

## 5 Boot Tests
```bash
npm run build    # zero errors

1. /feed loads — posts render with demo data
2. /post/new redirects to /auth/login unauthenticated
3. /post/[id] loads — replies section renders
4. /upgrade loads — pricing shown
5. /api/health returns { status: 'ok' }
```

---

## When Done — Report Exactly
1. ✅/❌ Schema + triggers + demo data applied
2. ✅/❌ Post + reply flow works end to end
3. ✅/❌ Pro-only gate enforced correctly
4. ✅/❌ All 5 boot tests pass
5. ✅/❌ `npm run build` clean
