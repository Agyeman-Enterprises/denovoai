# DeNovo — Internal Tool Template Brief
## Deployable baseline for admin panels, CRMs, ops dashboards.
## Token substitution ready. Snippet augmentation ready.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
Port 6008. Stop there.

---

## Definition

An internal tool for a team to manage data, operations, and workflows.
Auth-gated. Role-based. Data-dense. Not customer-facing.
Think CRM, ops dashboard, inventory system, reporting tool.

---

## Token Map

```typescript
{{APP_NAME}}
{{APP_SLUG}}
{{APP_TAGLINE}}
{{PRIMARY_COLOR}}
{{SECONDARY_COLOR}}

{{PRIMARY_ENTITY}}          // e.g. "contact" / "lead" / "item" / "record"
{{PRIMARY_ENTITY_PLURAL}}   // e.g. "contacts" / "leads" / "items"
{{SECONDARY_ENTITY}}        // e.g. "company" / "deal" / "task"
{{SECONDARY_ENTITY_PLURAL}} // e.g. "companies" / "deals" / "tasks"
{{TEAM_NOUN}}               // e.g. "team" / "organization" / "workspace"
{{CATEGORIES_ARRAY}}        // e.g. ["Active","Pending","Closed","Archived"]

{{APP_URL}}
```

---

## Database Schema

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text check (role in ('viewer','operator','admin')) default 'operator',
  created_at timestamptz default now()
);

-- Primary entity (contacts, leads, items, etc.)
create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references profiles(id),
  assigned_to uuid references profiles(id),
  title text not null,
  status text,
  category text,
  priority text check (priority in ('low','medium','high','urgent')) default 'medium',
  data jsonb default '{}',          -- flexible field storage
  tags text[] default '{}',
  is_archived boolean default false,
  search_vector tsvector,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Secondary entity (companies, deals, tasks, etc.)
create table if not exists related_records (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references records(id) on delete cascade,
  type text not null,
  title text not null,
  data jsonb default '{}',
  status text,
  due_date date,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activity log
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  record_id uuid references records(id) on delete cascade,
  action text not null,
  notes text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create or replace function update_record_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.status,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.category,'')), 'C');
  return new;
end;
$$ language plpgsql;

create trigger records_search_update
  before insert or update on records
  for each row execute function update_record_search_vector();

create index if not exists records_search_idx on records using gin(search_vector);
create index if not exists records_status_idx on records(status, is_archived);
create index if not exists records_assigned_idx on records(assigned_to);

alter table profiles enable row level security;
alter table records enable row level security;
alter table related_records enable row level security;
alter table activity_log enable row level security;

-- Internal tool — all authenticated users can read all records
create policy "team read records" on records
  for select using (auth.uid() is not null);
create policy "operators manage records" on records
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('operator','admin'))
  );
create policy "team read activity" on activity_log
  for select using (auth.uid() is not null);
create policy "own profile" on profiles for all using (auth.uid() = id);

-- Seed demo data
insert into records (created_by, title, status, category, priority)
select
  (select id from profiles limit 1),
  '{{PRIMARY_ENTITY}} ' || i,
  (array{{CATEGORIES_ARRAY}})[((i-1) % array_length(array{{CATEGORIES_ARRAY}}, 1)) + 1],
  'General',
  (array['low','medium','high'])[((i-1) % 3) + 1]
from generate_series(1, 25) i;
```

---

## Page Structure

```
app/
├── page.tsx                          # Redirect to /app
├── auth/
│   ├── login/page.tsx
│   └── callback/route.ts
├── app/                              # Main tool shell
│   ├── layout.tsx                    # Sidebar + top nav
│   ├── page.tsx                      # Dashboard: stats + recent activity
│   ├── records/
│   │   ├── page.tsx                  # Records list: table view + search
│   │   ├── new/page.tsx             # Create record
│   │   └── [id]/page.tsx            # Record detail + activity + related
│   ├── board/
│   │   └── page.tsx                  # Kanban view by status
│   ├── reports/
│   │   └── page.tsx                  # Analytics + charts
│   └── settings/
│       ├── page.tsx                  # App settings
│       └── team/page.tsx            # Team member management
└── api/
    ├── health/route.ts
    ├── records/
    │   ├── route.ts
    │   └── [id]/
    │       ├── route.ts
    │       └── activity/route.ts
    └── reports/
        └── route.ts                  # Aggregated stats
```

---

## Core Flows

### Data management flow
1. Operator logs in → sees dashboard
2. Views records list → table with search + filter
3. Creates new record → fills form
4. Opens record → sees detail + activity log
5. Edits record → activity logged automatically

### Kanban flow
1. Operator opens /app/board
2. Sees records grouped by status
3. Drags card to new status column
4. Status updates in DB + activity logged

### Reports flow
1. Admin opens /app/reports
2. Sees record counts by status
3. Sees recent activity feed
4. Exports data as CSV (snippet 07)

---

## Snippet Compatibility Matrix

| Snippet | Status | Seam Location |
|---|---|---|
| 01 Auth | ✅ Required | full app gate |
| 02 Stripe Simple | ❌ N/A | internal tool |
| 03 Stripe Connect | ❌ N/A | — |
| 04 File Upload | ⬜ Optional | record attachments |
| 05 Admin Panel | ✅ Required | team management |
| 06 Search & Filter | ✅ Required | records list |
| 07 Output & Delivery | ✅ Required | CSV export + PDF reports |
| 08 Roles & Permissions | ✅ Required | viewer/operator/admin |
| 09 Notifications | ⬜ Optional | assignment alerts |
| 10 Messaging | ❌ N/A | — |
| 11 Reviews & Ratings | ❌ N/A | — |
| 12 Bookings | ❌ N/A | — |
| 13 Blog/CMS | ❌ N/A | — |
| 14 API + Webhooks | ⬜ Optional | external integrations |
| 15 Email | ⬜ Optional | assignment notifications |

---

## 5 Boot Tests
```bash
npm run build    # zero errors

1. / redirects to /app or /auth/login
2. /app/records loads — table with demo data
3. /app/board loads — kanban columns render
4. /app/records/new loads — create form renders
5. /api/health returns { status: 'ok' }
```

---

## When Done — Report Exactly
1. ✅/❌ Schema + demo data applied
2. ✅/❌ Records CRUD works end to end
3. ✅/❌ Kanban view renders and drag works
4. ✅/❌ Activity log records every mutation
5. ✅/❌ All 5 boot tests pass
6. ✅/❌ `npm run build` clean
