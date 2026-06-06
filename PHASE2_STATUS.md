# AE Design Studio — Phase 2 status (2026-06-03, overnight)

## Done — data layer is fully off Supabase, on bare Postgres (Aurora :5433)

**Foundation**
- `src/lib/db.ts` — postgres.js singleton pool + ownership-enforcing repos. Every owner-scoped method REQUIRES a `userId` arg, so "forgot to scope" is a missing-arg type error, not a cross-tenant leak.
- `src/types/db.ts` — hand-written snake_case row types for all 18 tables.
- `src/lib/session.ts` — `getSessionUser()` / `requireUserId()` read the OIDC `sub` from the `ae_session` cookie (signature verification happens in the Phase-3 middleware).
- `postgres` + `jose` added to package.json.

**~35 files converted** supabase → repos (all owner-scoped queries now carry explicit `WHERE user_id`):
- Pages (server-split where they were client): dashboard, dashboard/app/[id], dashboard/billing, admin (page+layout).
- New client shells: `dashboard-shell`, `billing-client`, `delete-app-button`.
- API routes: denovo parse/assemble/[jobId], apps (GET/DELETE + new POST), new sessions/[id] GET, design (approve/code/generate/inventory/regenerate/screens), stripe (checkout/credits/portal/webhook), billing (checkout/portal/webhook).
- Lib: rbac-server, usage, audit, trial, notification, lead-capture, referral.
- Pipeline: assembler/index (atomic `array_append` logs), generation (generate-all/generate-screen/extract-slotmap — also **fixed a real bug**: extract-slotmap pulled active variants across ALL sessions; now scoped to the session).
- Studio client pages now fetch through APIs (no browser→DB).

**DB**
- Renamed `denovoai-db`→`ae-design-studio-db`, db/role→`aedesignstudio`, new password (in Sanctum `ae-design-studio:global` + credentials.md + portmap). TCP password auth verified.
- Full schema applied (`db/schema.sql`, 18 tables, no RLS/`auth.uid`). Added `'design'` to sessions.stage enum. Added `profiles.email` (column drift from the old table).
- **Isolation verified**: seeded user A + user B, confirmed each sees only their own apps.

**Verification**
- `npx tsc --noEmit` → **ZERO errors** (verified repeatedly through the conversion).
- `assemble_jobs.queue_job_id` column NOT yet added (pre-existing table) — needed for Phase 4 ae-queue; `ALTER TABLE assemble_jobs ADD COLUMN queue_job_id text;` when wiring it.

## Known / deferred
- **5 pre-existing eslint errors** (`react-hooks/set-state-in-effect`, immutability) in `dark-mode-toggle`, `studio/[sessionId]/page` (job poller), `admin-user-management`, and the design canvas. These are Next-16's strict plugin flagging canonical patterns (e.g. the `mounted` SSR guard); they predate Phase 2 and are in files it didn't substantively touch. Next 16 does NOT run eslint during `next build`, so they don't block the build. A focused lint-modernization pass can address them (cannot use `eslint-disable` — no-bypass rule).
- **trawl_* tables (3)** deferred — no source migration; `design-memory/supabase.ts` returns null without Supabase env so the trawl/design-memory subsystem degrades gracefully. Derive their DDL from the TS types when re-enabling.
- Auth files still import supabase (login, navbar, mfa-*, require-auth*, use-role, supabase/{client,server}, admin/users routes) — these are **Phase 3** (OIDC wiring) and compile fine until then.

## Not committed
Work is on disk only. The machine-level pre-commit hook blocks commits without a passing GATE7, and the release gate can't pass mid-migration (auth not wired). Left uncommitted deliberately rather than bypass the hook (--no-verify is forbidden). **Consider committing in the morning** once Phase 3 lands or after a manual gate review.

## Next: Phase 3 (auth) — gated on the platform tunnel
- Wire `/auth/login` → redirect to ae-platform `/auth/authorize`; `/auth/callback` exchanges code→JWT, sets `ae_session` cookie, JIT-provisions `profiles` + `subscriptions`; rewrite `proxy.ts` middleware to verify the JWT against ae-platform JWKS; retire Supabase auth + MFA pages; `/auth/signout` clears the cookie.
- **Blocked for end-to-end test** until `platform.agyemanenterprises.com` tunnel route is live (TBD 2026-06-03).
- Then Phase 4 (pipeline→ae-queue) and Phase 5 (single Aurora/Coolify deploy).
