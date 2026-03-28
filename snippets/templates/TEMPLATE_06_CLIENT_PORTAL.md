# DeNovo — Client Portal Template Brief
## Deployable baseline for agency/service business client portal.
## Token substitution ready. Snippet augmentation ready.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
Port 6007. Stop there.

---

## Definition

A private portal where a service business delivers work to clients.
Clients log in to see their projects, files, invoices, and messages.
Think agency client portal, coach platform, consultant dashboard.

---

## Token Map

```typescript
{{APP_NAME}}
{{APP_SLUG}}
{{APP_TAGLINE}}
{{PRIMARY_COLOR}}
{{SECONDARY_COLOR}}

{{SERVICE_NOUN}}            // e.g. "project" / "engagement" / "program"
{{SERVICE_NOUN_PLURAL}}     // e.g. "projects" / "engagements"
{{PROVIDER_NOUN}}           // e.g. "agency" / "coach" / "consultant"
{{CLIENT_NOUN}}             // e.g. "client" / "student" / "member"
{{CLIENT_NOUN_PLURAL}}      // e.g. "clients" / "students"
{{DELIVERABLE_NOUN}}        // e.g. "deliverable" / "asset" / "report"

{{APP_URL}}
```

---

## Database Schema

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text check (role in ('client','staff','admin')) default 'client',
  company_name text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) on delete cascade,
  assigned_to uuid references profiles(id),
  title text not null,
  description text,
  status text check (status in (
    'onboarding','active','review','complete','paused','cancelled'
  )) default 'onboarding',
  start_date date,
  due_date date,
  budget_cents int,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  file_url text,
  status text check (status in ('pending','uploaded','approved','revision_requested')) default 'pending',
  feedback text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  client_id uuid references profiles(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount_cents int not null,
  status text check (status in ('draft','sent','paid','overdue','cancelled')) default 'draft',
  due_date date,
  line_items jsonb default '[]',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
alter table projects enable row level security;
alter table deliverables enable row level security;
alter table invoices enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "clients see own projects" on projects
  for select using (auth.uid() = client_id);
create policy "staff see all projects" on projects
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('staff','admin'))
  );
create policy "staff manage projects" on projects
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('staff','admin'))
  );
create policy "project parties see deliverables" on deliverables
  for select using (
    exists (
      select 1 from projects p
      where p.id = project_id
      and (p.client_id = auth.uid() or
        exists (select 1 from profiles where id = auth.uid() and role in ('staff','admin')))
    )
  );
create policy "clients see own invoices" on invoices
  for select using (auth.uid() = client_id);
create policy "staff manage invoices" on invoices
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('staff','admin'))
  );
```

---

## Page Structure

```
app/
├── page.tsx                          # Landing / login redirect
├── auth/
│   ├── login/page.tsx
│   └── callback/route.ts
├── portal/                           # CLIENT VIEWS
│   ├── layout.tsx                    # Client shell
│   ├── page.tsx                      # Client dashboard: projects overview
│   ├── projects/
│   │   └── [id]/
│   │       └── page.tsx              # Project detail: status + deliverables
│   ├── files/
│   │   └── page.tsx                  # All deliverables
│   ├── invoices/
│   │   └── page.tsx                  # Invoice list + pay button
│   └── messages/                     # SNIPPET SEAM: messaging
│       └── page.tsx
├── admin/                            # STAFF/ADMIN VIEWS
│   ├── layout.tsx                    # Staff shell
│   ├── page.tsx                      # All clients + projects overview
│   ├── clients/
│   │   ├── page.tsx                  # Client list
│   │   └── [id]/page.tsx            # Client detail + projects
│   ├── projects/
│   │   ├── page.tsx                  # All projects
│   │   └── [id]/page.tsx            # Project management
│   └── invoices/
│       └── page.tsx                  # Invoice management
└── api/
    ├── health/route.ts
    ├── projects/
    │   └── route.ts
    ├── deliverables/
    │   └── route.ts
    ├── invoices/
    │   ├── route.ts
    │   └── [id]/pay/route.ts        # Pay invoice → Stripe
    └── stripe/
        ├── checkout/route.ts
        └── webhook/route.ts
```

---

## Core Flows

### Client flow
1. Client receives invite email with login link
2. Logs in → sees their projects
3. Opens project → sees status + deliverables
4. Downloads deliverable or requests revision
5. Views invoice → pays via Stripe

### Staff flow
1. Staff logs in → sees all clients + projects
2. Creates project → assigns to client
3. Uploads deliverable
4. Creates invoice → sends to client
5. Monitors project status

---

## Snippet Compatibility Matrix

| Snippet | Status | Seam Location |
|---|---|---|
| 01 Auth | ✅ Required | portal gate |
| 02 Stripe Simple | ✅ Required | invoice payment |
| 03 Stripe Connect | ❌ N/A | — |
| 04 File Upload | ✅ Required | deliverable upload |
| 05 Admin Panel | ✅ Required | staff dashboard |
| 06 Search & Filter | ⬜ Optional | project/client search |
| 07 Output & Delivery | ✅ Required | PDF invoices + file download |
| 08 Roles & Permissions | ✅ Required | client/staff/admin |
| 09 Notifications | ✅ Required | deliverable + invoice alerts |
| 10 Messaging | ✅ Required | client-staff messaging |
| 11 Reviews & Ratings | ⬜ Optional | project completion review |
| 12 Bookings | ⬜ Optional | consultation scheduling |
| 13 Blog/CMS | ❌ N/A | — |
| 14 API + Webhooks | ❌ N/A | — |
| 15 Email | ✅ Required | invite + invoice + deliverable |

---

## 5 Boot Tests
```bash
npm run build    # zero errors

1. / redirects to /auth/login
2. /portal redirects to /auth/login unauthenticated
3. /admin redirects non-staff to /portal
4. /portal/projects/[id] loads for authenticated client
5. /api/health returns { status: 'ok' }
```

---

## When Done — Report Exactly
1. ✅/❌ Schema applied
2. ✅/❌ Client can see their projects and deliverables
3. ✅/❌ Staff can create projects and upload deliverables
4. ✅/❌ Invoice payment flow works
5. ✅/❌ All 5 boot tests pass
6. ✅/❌ `npm run build` clean
