@AGENTS.md


## Supabase RLS Canon (mandatory for all new tables)

Every new table MUST have RLS enabled and a policy in the same migration. No exceptions.

**Pattern selection:**
- Backend/internal/AI/infra table → `service_role_only` (USING false)
- Table has `user_id UUID REFERENCES auth.users` → `own_rows` (auth.uid() = user_id)
- Table has `auth_id UUID REFERENCES auth.users` → `own_rows` (auth.uid() = auth_id)
- Public catalog/content (no user data) → `public_read` SELECT + `service_role_only` ALL

**Template (copy into every migration):**
```sql
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;
-- Pick ONE of the following:

-- Backend/internal:
CREATE POLICY "service_role_only" ON public.your_table FOR ALL USING (false);

-- User-owned:
CREATE POLICY "own_rows" ON public.your_table
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Public read:
CREATE POLICY "public_read" ON public.your_table FOR SELECT USING (true);
CREATE POLICY "service_role_only" ON public.your_table
  FOR INSERT USING (false);
```

**Never:**
- Create a table without RLS + a policy
- Use the anon key in server-side code (server = service_role key only)
- Cascade embedding models


## AE Engineering Canon — Mandatory for All AI Agents

### Identity
- Git author: name=Akua Agyeman, email=admin@agyemanenterprises.com
- Never use @gmail or personal addresses for AE commits

### Language Stack (sovereign, no exceptions)
- Rust → infrastructure, chip, performance-critical systems
- TypeScript → application layer, APIs, UI
- Python → AI/ML only
- No mixing without explicit approval in task brief

### Secrets (CRITICAL)
- NEVER commit .env files
- NEVER hardcode secrets in source code
- NEVER log secrets or tokens
- NEVER put production credentials in dev/staging configs
- Production secrets live in Coolify env vars or Sanctum vault
- Dev uses .env (gitignored) with .env.example committed

### Git Rules
- Branch from dev for all features: `feature/description` or `fix/description`
- Never commit directly to main
- Commit format: `type(app-name): description`
  Types: `feat | fix | chore | db | sec | breaking`
- Never force push to main or dev

### Database Rules (Supabase)
- Every new table: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` immediately
- Every new table: `CREATE POLICY` in same migration (see RLS Canon below)
- DDL changes use `apply_migration`, never `execute_sql`
- Migrations are append-only — never edit existing migration files
- Auth column standard: `user_id UUID REFERENCES auth.users(id)`
  (not auth_id, not owner_id — user_id, always)
- Embeddings: single model per index, absolute rule, never cascade
- Service role key: server-side only, never in frontend

### RLS Canon
Backend/internal table:
```sql
CREATE POLICY "service_role_only" ON public.table FOR ALL USING (false);
```
User-owned table (has `user_id → auth.users`):
```sql
CREATE POLICY "own_rows" ON public.table
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```
Public read/admin write:
```sql
CREATE POLICY "public_read" ON public.table FOR SELECT USING (true);
CREATE POLICY "service_role_only" ON public.table FOR INSERT USING (false);
```

### API Rules
- All protected routes require auth middleware
- Never trust client-sent user IDs — derive from JWT server-side
- Never return stack traces or raw DB errors to client
- Never use CORS wildcard (`*`) in production
- Rate limit all public endpoints

### Auth Rules
- New apps use Supabase Auth. No custom `passwordHash` columns.
- Tokens in httpOnly cookies, never localStorage
- Session expiry: 1 hour for medical/payment apps, 24 hours others

### Inference Stack (AE apps only — not apps sold to others)
- Route through LiteLLM at `ai.agyemanenterprises.com`
- Aliases: `ae-medical | ae-fast | ae-deep | ae-local`
- Never call raw model names. Never use OpenAI as first resort for AE apps.
- Medical repos (solopractice, linahla, cannexis): Anthropic-only, PHI present.

### Deployment
- Dual deployment: Vercel + Supabase Cloud AND Aurora/Coolify/Hetzner
- AI agents build against dev/staging — never production directly
- Migrations run on staging first, verified, then production
- No manual SSH deploys to production — use Coolify triggers

### Forbidden Patterns
- No .env committed to git
- No service_role key in frontend code
- No DROP/TRUNCATE without WHERE in production
- No floating dependency versions (`^` or `~`) in production
- No AI-hallucinated npm packages — verify on npmjs.com first
- No custom auth systems in new apps — use Supabase Auth
- No snippets — full files always
- No shortcuts, no "I'll fix this later" TODOs in security-critical code


## Auth Rules

- Every app has one auth system. Never mix two.
- Auth system issues a JWT containing the user UUID in the `sub` claim.
- `user_id` column is always UUID, always the auth UUID — never a custom int ID.
- Current auth backend: Supabase Auth (apps built before AeBase migration)
- ae-platform auth backend: Zitadel (sovereign identity provider — not Supabase/AeBase)
  ae-platform DB tables are backend/internal: use `service_role_only` RLS, no user-level policies.
  For app-layer tables behind Zitadel: `ae_uid()` reads JWT `sub` claim — policy syntax identical.
- Future auth backend: AeBase/MiBase (sovereign replacement — migration TBD)
- RLS policies use `auth.uid()` now. When AeBase ships, swap to `ae_uid()`.
  The `ae_uid()` function will be defined in AeBase's Postgres init and will be
  a drop-in replacement — policy syntax stays identical.
- Tokens in httpOnly cookies, never localStorage regardless of auth backend.
- No custom `passwordHash` columns in application tables. Auth system owns credentials.

**When AeBase replaces Supabase Auth, run once per database:**
```sql
-- Step 1: Define once per database in AeBase init
CREATE OR REPLACE FUNCTION ae_uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    '00000000-0000-0000-0000-000000000000'
  )::uuid
$$;

-- Step 2: All existing policies become:
-- OLD: USING (auth.uid() = user_id)
-- NEW: USING (ae_uid() = user_id)
-- This is a scripted migration, not manual work
```

## Before Every Code Job

Before writing any code, you MUST read:
1. This file (`CLAUDE.md`) — for project-specific rules and context
2. `C:\DEV\ae-master-context\CLAUDE.md` — for AE-wide engineering canon

No exceptions. These files are the source of truth for all engineering decisions.