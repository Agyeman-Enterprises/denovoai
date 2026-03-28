# DeNovo Studio — Claude Code Build Brief
## The AI App Factory — Full SaaS

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE

NEVER under any circumstances:
- Modify Cloudflare DNS records
- Edit, add, or delete Cloudflare tunnel routes
- Call any Cloudflare API
- Run `cloudflared` commands

Cloudflare is managed manually by the project owner.
Your job ends at: app builds clean, runs on port 4010, health check passes.

---

## What DeNovo Is

An AI-orchestrated software factory. Users describe an app in plain English.
DeNovo's Intent Parser extracts what they want, the Assembler merges it into
a pre-built template, and the result is either auto-deployed or downloadable.

DeNovo is itself a full SaaS — multi-user, Stripe subscriptions + credits,
app management dashboard.

---

## Stack (do not change)

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, TypeScript |
| Database | Supabase (existing project) |
| Auth | Supabase Auth (magic link + OAuth) |
| Payments | Stripe (subscriptions + one-time credits) |
| AI | Anthropic Claude API (Intent Parser + schema generation) |
| Git | Gitea API (self-hosted — base URL in env vars) |
| Deploy | Coolify API (self-hosted — base URL in env vars) |
| Hosting | Hetzner via Coolify, port 4010 |
| Domain | denovoai.co |

---

## Supabase Credentials (existing project — do not create new)

```
NEXT_PUBLIC_SUPABASE_URL=https://jomualvckaudlcqrfvxv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXVhbHZja2F1ZGxjcXJmdnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjUwNDIsImV4cCI6MjA4ODM0MTA0Mn0.nlMkdRyIMQ18Uf6MThIJn1kbN63VdArQ-p5Mw-_4Z-A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXVhbHZja2F1ZGxjcXJmdnh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc2NTA0MiwiZXhwIjoyMDg4MzQxMDQyfQ.3Hoz8-brzx8eX4kibH_hVcRdz645dn5HfVoAtUvbA9c
```

---

## Database Schema

Apply this migration first. Verify tables exist before building anything else.

```sql
-- User profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text check (role in ('user', 'admin')) default 'user',
  created_at timestamptz default now()
);

-- Subscription plans
create table plans (
  id text primary key,               -- 'free', 'starter', 'pro', 'agency'
  name text not null,
  monthly_credits int not null,      -- apps included per month
  stripe_price_id text,              -- monthly price ID
  stripe_price_id_annual text,       -- annual price ID
  price_monthly_cents int,
  price_annual_cents int,
  features jsonb default '[]',
  created_at timestamptz default now()
);

-- User subscriptions (Stripe-synced)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique,
  plan_id text references plans(id) default 'free',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text check (status in ('active','cancelled','past_due','trialing')) default 'active',
  credits_remaining int not null default 1,  -- free trial = 1 app
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Credit top-ups (one-time purchases)
create table credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  credits int not null,
  amount_cents int not null,
  stripe_payment_intent_id text unique,
  created_at timestamptz default now()
);

-- Generated apps
create table apps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  slug text not null,
  template text not null,            -- 'marketplace', 'saas', 'directory', etc.
  status text check (status in (
    'parsing','confirming','assembling','deploying','live','failed','downloaded'
  )) default 'parsing',
  slot_map jsonb not null default '{}',
  snippets text[] default '{}',
  output_type text check (output_type in ('deploy','download')),
  gitea_repo_url text,
  coolify_app_id text,
  coolify_domain text,
  download_url text,
  download_expires_at timestamptz,
  error_message text,
  credits_used int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Intent Parser conversation sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  app_id uuid references apps(id) on delete cascade,
  messages jsonb not null default '[]',  -- [{role, content, timestamp}]
  slot_map jsonb default '{}',           -- accumulated slots
  stage text check (stage in (
    'intake','clarifying','confirming','assembling','done'
  )) default 'intake',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Assemble job progress (polled by frontend)
create table assemble_jobs (
  id uuid primary key default gen_random_uuid(),
  app_id uuid references apps(id) on delete cascade,
  stage text check (stage in (
    'cloning','substituting','injecting','schema','outputting','done','error'
  )) default 'cloning',
  progress int default 0,            -- 0-100
  log text[],                        -- progress messages shown to user
  result jsonb,                      -- OutputResult when done
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table credit_purchases enable row level security;
alter table apps enable row level security;
alter table sessions enable row level security;
alter table assemble_jobs enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own subscription" on subscriptions for all using (auth.uid() = user_id);
create policy "own credit purchases" on credit_purchases for all using (auth.uid() = user_id);
create policy "own apps" on apps for all using (auth.uid() = user_id);
create policy "own sessions" on sessions for all using (auth.uid() = user_id);
create policy "own jobs" on assemble_jobs for select using (
  auth.uid() = (select user_id from apps where id = app_id)
);

-- Plans are public read
alter table plans enable row level security;
create policy "public read plans" on plans for select using (true);

-- Seed plans
insert into plans (id, name, monthly_credits, price_monthly_cents, price_annual_cents, features) values
('free',    'Free',    1,  0,      0,      '["1 app", "Download only", "Community templates"]'),
('starter', 'Starter', 5,  2900,   29000,  '["5 apps/month", "Auto-deploy", "All templates", "Email support"]'),
('pro',     'Pro',     15, 7900,   79000,  '["15 apps/month", "Priority deploy", "Custom snippets", "Priority support"]'),
('agency',  'Agency',  50, 19900,  199000, '["50 apps/month", "White label", "API access", "Dedicated support"]');
```

---

## Page Structure

```
app/
├── page.tsx                        # Landing page
├── pricing/page.tsx                # Pricing tiers
├── auth/
│   ├── login/page.tsx
│   └── callback/page.tsx           # Supabase OAuth callback
├── studio/
│   ├── page.tsx                    # New app — chat intake UI
│   ├── [sessionId]/page.tsx        # Active session — conversation + progress
│   └── confirm/[sessionId]/page.tsx # Slot confirmation screen
├── dashboard/
│   ├── page.tsx                    # All my apps + status
│   ├── app/[appId]/page.tsx        # App detail — status, env vars, links
│   └── billing/page.tsx            # Subscription + credits + purchase history
├── admin/
│   └── page.tsx                    # Admin: all users, all apps, all jobs
└── api/
    ├── health/route.ts
    ├── auth/callback/route.ts
    ├── stripe/
    │   ├── checkout/route.ts       # Subscription checkout
    │   ├── credits/route.ts        # One-time credit purchase
    │   ├── webhook/route.ts        # Subscription + payment events
    │   └── portal/route.ts        # Customer billing portal
    ├── denovo/
    │   ├── parse/route.ts          # Intent Parser — chat endpoint
    │   ├── assemble/route.ts       # Trigger Assembler
    │   └── assemble/[jobId]/route.ts # Poll job status
    └── apps/
        └── [appId]/route.ts        # App management
```

---

## Core Feature: Intent Parser (Chat UI + API)

### The UI — `/studio`
- Full-page chat interface. Clean. One message at a time.
- User types description. Parser responds. Conversation continues.
- Max 3 clarifying questions before showing confirmation screen.
- Loading state shows "DeNovo is thinking..." between messages.

### The API — `POST /api/denovo/parse`

```typescript
// Request
interface ParseRequest {
  sessionId: string;
  message: string;
}

// Response
interface ParseResponse {
  message: string;           // Parser's reply to show user
  stage: 'clarifying' | 'confirming' | 'ready';
  slots?: Partial<SlotMap>;  // Updated slots
  confirmationCard?: ConfirmationCard; // Shown when stage = 'confirming'
}
```

### System Prompt for Claude API call

```
You are DeNovo's Intent Parser. Extract app requirements from user descriptions
to fill a slot map for generating a deployable web app.

RULES:
- Ask ONE question at a time, never multiple
- Maximum 3 clarifying questions before confirming
- Make smart assumptions, state them in the confirmation
- Be conversational, not form-like
- When ready to confirm, set stage to "confirming"

TEMPLATES AVAILABLE: marketplace, saas, directory, community,
ecommerce, client-portal, internal-tool, content-media

SLOT MAP TO FILL:
{
  "APP_NAME": string,
  "TAGLINE": string,
  "HERO_COPY": string,
  "TEMPLATE": TemplateType,
  "SELLER_NOUN": string,        // marketplace only
  "BUYER_NOUN": string,         // marketplace only
  "LISTING_NOUN": string,       // marketplace only
  "CATEGORIES": string[],
  "PLATFORM_FEE_PERCENT": number, // marketplace only
  "PRIMARY_COLOR": string,       // hex
  "SCHEMA_EXTRAS": string[],     // extra field names
  "SNIPPETS": string[]           // modules to include
}

SNIPPET SELECTION RULES (auto-select based on description):
- Always include: auth, admin-panel
- Marketplace: always add stripe-connect
- Other templates: add stripe-simple if monetization mentioned
- Add reviews if: rating/review/feedback mentioned
- Add messaging if: chat/contact/communicate mentioned
- Add bookings if: schedule/calendar/appointment/book mentioned
- Add file-upload if: photo/portfolio/upload/file mentioned
- Add search-filter if: search/filter/browse mentioned
- Add notifications if: notify/alert/email/remind mentioned

Current conversation: {{HISTORY}}
Current slots: {{SLOTS}}
Missing required slots: {{MISSING}}

Respond ONLY in JSON:
{
  "message": "Your conversational reply",
  "slots": { ...newly extracted slots },
  "stage": "clarifying" | "confirming" | "ready"
}
```

---

## Core Feature: Assembler

### The API — `POST /api/denovo/assemble`

```typescript
interface AssembleRequest {
  sessionId: string;
  appId: string;
  outputType: 'deploy' | 'download';
}

interface AssembleResponse {
  jobId: string;
  estimatedSeconds: number;
}
```

### Job Polling — `GET /api/denovo/assemble/[jobId]`

```typescript
interface JobStatus {
  stage: 'cloning' | 'substituting' | 'injecting' | 'schema' | 'outputting' | 'done' | 'error';
  progress: number;    // 0-100
  log: string[];       // messages shown to user in real-time
  result?: {
    type: 'deploy' | 'download';
    giteaUrl?: string;
    coolifyAppId?: string;
    domain?: string;
    downloadUrl?: string;
  };
  error?: string;
}
```

### Assembler Steps (implement in order)

**Step 1 — Clone template**
Use Gitea API to clone from `denovo-templates` org into a temp workspace.
Template repos must exist in Gitea before this works — stub this step
if Gitea isn't configured yet, log "Template cloned (stub)" and continue.

**Step 2 — Token substitution**
Replace all `{{TOKEN}}` placeholders across all `.ts`, `.tsx`, `.css`,
`.sql`, `.json`, `.md`, `.yaml` files using the slot map.

Tokens to replace:
```
{{APP_NAME}}, {{TAGLINE}}, {{HERO_COPY}},
{{SELLER_NOUN}}, {{SELLER_NOUN_PLURAL}},
{{BUYER_NOUN}}, {{BUYER_NOUN_PLURAL}},
{{LISTING_NOUN}}, {{LISTING_NOUN_PLURAL}},
{{PLATFORM_FEE_PERCENT}}, {{PRIMARY_COLOR}},
{{SECONDARY_COLOR}}, {{APP_URL}}, {{CATEGORIES_ARRAY}}
```

**Step 3 — Snippet injection**
Copy snippet folders from `/snippets/` registry into workspace.
Snippets live in the DeNovo repo under `snippets/` — stub if not present.

**Step 4 — Schema extras**
Call Claude API with this tightly constrained prompt:
```
Convert these field names to PostgreSQL ALTER TABLE ADD COLUMN statements.
Return ONLY the SQL, nothing else.
Fields: {SCHEMA_EXTRAS}
Rules: arrays→text[], urls→text, numbers→int, booleans→boolean default false, else→text
Format: ADD COLUMN IF NOT EXISTS {name} {type}
```
Append output to the migration file.

**Step 5 — Env file**
Write `.env.example` with known values filled from slot map,
secrets left blank with comments.

**Step 6 — Output**

Deploy path:
1. Create repo in Gitea via API (`POST /api/v1/orgs/denovo-apps/repos`)
2. Init git, commit, push to Gitea
3. Create Coolify app via API (`POST /api/v1/applications`)
4. Trigger deploy (`POST /api/v1/applications/{id}/deploy`)
5. Update `apps` table with `gitea_repo_url`, `coolify_app_id`, `coolify_domain`

Download path:
1. Zip the workspace
2. Upload to Supabase Storage
3. Generate signed URL (1 hour expiry)
4. Update `apps` table with `download_url`, `download_expires_at`

---

## Stripe Integration

### Subscription Plans (matches seeded plans table)

| Plan | Monthly | Credits/mo | Stripe Price ID env var |
|---|---|---|---|
| Free | $0 | 1 | — |
| Starter | $29 | 5 | `STRIPE_STARTER_PRICE_ID` |
| Pro | $79 | 15 | `STRIPE_PRO_PRICE_ID` |
| Agency | $199 | 50 | `STRIPE_AGENCY_PRICE_ID` |

Annual variants at 2 months free.

### Credit Top-Ups (one-time)
- 5 credits — $19
- 15 credits — $49
- 50 credits — $139

Use Stripe Payment Links or Checkout for these.

### Webhook Events to Handle
- `checkout.session.completed` → activate subscription OR add credits
- `customer.subscription.updated` → update plan + reset monthly credits
- `customer.subscription.deleted` → downgrade to free
- `payment_intent.succeeded` → add purchased credits to subscription

### Credit Deduction Logic
Before allowing assembly to start:
1. Check `subscriptions.credits_remaining > 0`
2. If zero → block + show upgrade prompt
3. If ok → decrement credits_remaining, start assembly

---

## Confirmation Screen — `/studio/confirm/[sessionId]`

Show a clean card with all extracted slots before building:

```
Here's what DeNovo will build:

  Name:           ShootSpace
  Type:           Service Marketplace
  Sellers:        Photographers
  Buyers:         Event venues
  Categories:     Weddings, Corporate, Concerts, Sports
  Platform fee:   12%
  Features:       Bookings, Reviews, Messaging, File Upload

  AI-detected extras:
  + availability_calendar (boolean)
  + travel_radius_km (int)
  + equipment (text[])

  [✏️ Edit anything] [🚀 Deploy it] [📦 Download instead]
```

"Edit anything" → goes back into chat session
"Deploy it" → triggers Assembler with outputType='deploy'
"Download instead" → triggers Assembler with outputType='download'

---

## Dashboard — `/dashboard`

Show all user's apps as cards:

```
[App Name]    [Template badge]    [Status badge]
Created 2 hours ago
[Open App ↗]  [View Repo ↗]  [Coolify ↗]
```

Status badges:
- 🟡 Assembling
- 🔵 Deploying
- 🟢 Live
- ⬇️ Downloaded
- 🔴 Failed (show error + retry button)

---

## Landing Page — `/`

Sections in order:
1. **Hero** — "Describe an app. Get a deployed product." + CTA "Start Building Free"
2. **How it works** — 3 steps: Describe → Review → Deploy
3. **Templates** — 8 archetype cards with examples
4. **Pricing** — 4 tiers, monthly/annual toggle
5. **CTA** — "Your first app is free. No credit card."

Design tone: dark, technical, confident. Not playful.
Color: deep navy/black background, electric violet (#8B5CF6) accent.

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_AGENCY_PRICE_ID=
STRIPE_STARTER_ANNUAL_PRICE_ID=
STRIPE_PRO_ANNUAL_PRICE_ID=
STRIPE_AGENCY_ANNUAL_PRICE_ID=

# Anthropic (Intent Parser)
ANTHROPIC_API_KEY=

# Gitea (self-hosted)
GITEA_BASE_URL=
GITEA_API_TOKEN=
GITEA_TEMPLATES_ORG=denovo-templates
GITEA_APPS_ORG=denovo-apps

# Coolify (self-hosted)
COOLIFY_BASE_URL=
COOLIFY_API_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://denovoai.co
NEXT_PUBLIC_APP_NAME=DeNovo
```

---

## Coolify Deployment Config

- **Port**: 4010
- **Domain in Coolify**: `https://denovoai.co`
- **Health check**: `/api/health`
- **Do NOT configure Cloudflare** — owner handles tunnel manually

---

## Build Verification

All must pass before stopping:

```bash
npm run build    # zero errors, zero type errors
```

Fix every error. Do not leave TypeScript errors or broken imports.

---

## What You Are NOT Doing

- ❌ Cloudflare — not even to look at it
- ❌ Building the Marketplace template (that's a separate repo)
- ❌ Building the snippet library (stub references are fine)
- ❌ Setting up Gitea or Coolify servers (just the API calls)
- ❌ Creating a new Supabase project
- ❌ Changing the port from 4010

---

## When Done — Report Exactly

1. ✅/❌ Schema applied and tables verified
2. ✅/❌ Intent Parser chat working (Claude API call fires)
3. ✅/❌ Assembler pipeline runs (stubs ok for Gitea/Coolify)
4. ✅/❌ Stripe subscriptions + credits wired
5. ✅/❌ `npm run build` passes clean
6. Port: must be **4010**
7. Env vars still needing real values

Then stop. Do not attempt Cloudflare, DNS, or tunnel config.
