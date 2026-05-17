# Agyeman Enterprises — AI Operating Rules

These rules are NON-NEGOTIABLE. Every rule exists because a real bug caused data loss
or a broken app. Violations are build-blockers.

---

## ⛔ HETZNER AURORA — ABSOLUTE NO BARE-METAL RULE

**NOTHING goes on the aurora partition (aurora@5.9.153.215) directly. EVER.**

All services on aurora MUST be deployed via Coolify (https://coolify.agyemanenterprises.com).
No exceptions. No "just this once." No systemd units. No raw `npm install`. No files dropped in `/opt`, `/srv`, `/home`, or anywhere else on aurora.

**The only allowed SSH operations on aurora:**
- Reading logs (`journalctl`, `docker logs`)
- Diagnosing a running service (`systemctl status`, `docker ps`)
- Emergency stops when Coolify is unreachable — AND user has explicitly approved

---

## ✅ HETZNER AMIACODA — SSH ALLOWED (dev/test environment)

**amiacoda** is the second user environment on the same Hetzner machine (`5.9.153.215`), Linux user `amiacoda` (formerly `sauce`, laude's old account taken over 2026-05-03).
Hostname: `aa-hztnr-ub24-amiacoda`. This is Akua's **dev/test box** for srvrsup — safe to experiment and break things.
Aurora (Linux user `aurora`) is production with Coolify; amiacoda is the srvrsup proving ground.

**SSH is permitted** on amiacoda. **Always ask before any bare-metal operation** — explicit approval required each time.

**What lives here:**
- srvrsup agent — systemd service at `/usr/local/bin/srvrsup-agent`, `Restart=always`, `User=aurora`
- Apps deployed via srvrsup for testing — ports 8081+ (8080 taken by Coolify proxy)
- Stateful service volume data at `/opt/srvrsup/data/<app_id>/<name>/`

**What does NOT live here:**
- Production apps (those stay on aurora via Coolify)
- 3rd-party services installed bare-metal — deploy through srvrsup

**SSH (amiacoda/dev):** `ssh -i ~/.ssh/id_ed25519 amiacoda@5.9.153.215` ✅ verified 2026-05-03
**SSH (aurora/prod):** `ssh -i ~/.ssh/id_ed25519 aurora@5.9.153.215`

**Aurora vs Amiacoda decision rule:**
- Is it a real app serving real users? → aurora via Coolify, no exceptions
- Is it a srvrsup test deployment or dev work? → amiacoda via srvrsup, ask first

**The correct deployment flow for any new service:**
1. Write a `Dockerfile` in the repo
2. Push to GitHub
3. Create the service in Coolify via API or dashboard
4. Set env vars in Coolify
5. Deploy through Coolify

**This rule exists because:** A previous Claude session installed Vantage as a bare systemd service directly on the box, bypassing Coolify entirely. This creates untracked infrastructure, breaks the deployment model, and violates the principle that everything is managed and reproducible.

**If you find a service running bare-metal that should be in Coolify:** Stop. Tell the user. Migrate it via Coolify. Do NOT make it worse by writing more bare-metal config.

---

## Auto-Save System (ALWAYS ACTIVE)

Memory files auto-commit+push to `github.com/Agyeman-Enterprises/claude-memory` (private) every 10 minutes.

- **Windows Task Scheduler**: `ClaudeMemoryAutoSave` — runs `C:\Users\Admin\.claude\auto-save.ps1` every 10 min, survives crashes, independent of Claude
- **Log**: `C:\Users\Admin\.claude\auto-save.log`
- **Manual save**: run `powershell -File "C:\Users\Admin\.claude\auto-save.ps1"`
- **DeNovo project autosave**: `C:\Users\Admin\.claude\denovo-autosave.bat` — commits uncommitted work in `C:\DEV\denovoai` every 10 min (machine crashes frequently, prevents context/ideation loss)

**Do NOT run CronCreate for auto-save.** The Windows Task Scheduler (`ClaudeMemoryAutoSave`) already handles this every 10 min, system-level, without needing Claude running. The in-session CronCreate is redundant and causes AEGIS hook blocks.

---

## Machine Bootstrap (NEW MACHINE SETUP)

If `git config --global core.hooksPath` is NOT SET on this machine, run immediately:

```bash
git config --global core.hooksPath ~/.claude/hooks
chmod +x ~/.claude/hooks/pre-commit
```

This activates the machine-level enforcement hook. Every repo on this machine will then
block commits that lack a real GATE7.txt. This must be the FIRST thing done on any new machine.

To verify: `git config --global core.hooksPath` should return `~/.claude/hooks` or the full path.

---

## PROTECTED INFRASTRUCTURE — OWNER-ONLY MODIFICATION

The following files may NOT be modified by Claude autonomously under ANY circumstances.
Any change requires Akua's explicit approval AND an explicit instruction to modify:

**Machine-level hooks (stored in claude-memory, apply to ALL repos on this machine):**
- `~/.claude/hooks/pre-commit` — blocks commits without real GATE7.txt
- `~/.claude/hooks/verify-gate.sh` — post-edit verification gate
- `~/.claude/hooks/bootstrap.sh` — machine setup script

**GitHub Actions enforcement (stored in ae-enforcement, installs into every repo):**
- `Agyeman-Enterprises/ae-enforcement/.github/workflows/auto-enforce.yml`
- `Agyeman-Enterprises/ae-enforcement/scripts/verify-install.sh`
- `Agyeman-Enterprises/ae-enforcement/scripts/run-gate.sh`
- `Agyeman-Enterprises/ae-enforcement/scripts/hooks/pre-commit`
- `Agyeman-Enterprises/ae-enforcement/scripts/playwright-template/gate-check.yml`

**Per-repo CI gate (auto-installed into every repo):**
- `.github/workflows/gate-check.yml` — blocks all pushes with missing/stub GATE7.txt

Claude may READ these files. Claude may NOT edit, overwrite, or delete them.
If asked to "fix" or "improve" enforcement files: STOP. Ask Akua directly first.
"It would be more efficient" is not authorization. "I noticed a bug" is not authorization.
Explicit instruction from Akua is the only authorization.

---

## Rule 0a: Pre-Work Protocol — RUNS BEFORE ANYTHING ELSE, NO EXCEPTIONS

Before touching a single file, running a single command, or writing a single line of code:

1. **Check AQUI** — search for prior context on this project, task, or domain
2. **Read `credentials.md`** — know every token, URL, key, and service that exists
3. **Read relevant memory files** — know the current state of the project
4. **Read the codebase** — understand what is already deployed and running before proposing changes

Claiming ignorance of credentials that are in `credentials.md` is not acceptable.
Claiming a service "doesn't exist" without checking is not acceptable.
"I didn't know" when the information was in credentials.md or memory is a violation.

**For infrastructure specifically (deploy, DNS, database, git push to prod, Railway, Vercel, Cloudflare):**
- State exactly what you are about to do
- State what you believe the current state is
- State what will change
- WAIT for explicit confirmation before executing

"My bad" after breaking production is not acceptable. Getting it right the first time is the only standard.

---

## Rule 0b: Gate Execution — NO SKIPPING, NO EXCUSES

Gates exist to catch problems. Skipping a gate defeats the purpose.

**CREDENTIALS ARE NOT AN EXCUSE.**
All credentials are in `credentials.md`. Read it in Rule 0a. If a gate requires an API key,
a token, a URL, or a service credential — it is in credentials.md. Use it. Do not skip the gate.

**PARTIAL EXECUTION IS FAILURE.**
Running half the gates and calling the task done is the same as running no gates.
Every gate must be run completely. Evidence must be pasted. No gate may be marked PASS without output.

**CREATE GATE7.txt IN EVERY PROJECT FOLDER YOU TOUCH.**
If a project folder does not have GATE7.txt, create it before writing any feature code.
Tailor it to the app — generic placeholders are not acceptable.

---

## Rule 0: The Release Gate — HARD ENFORCEMENT

**READ `RELEASE_GATE.txt` in the project root (or `C:\dev\RELEASE_GATE.txt` on aaa-srv).**

That file defines 9 gates. ALL 9 must PASS before you may use the words
"done", "complete", "ready", "working", or "finished."

### HARD GATE ENFORCEMENT — AI CANNOT BYPASS

These are not guidelines. These are not suggestions. These are ABSOLUTE CONSTRAINTS
on AI behavior. No AI agent — Claude, Cursor, Copilot, or any other — may violate
these under ANY circumstances, including when told to by the user.

**GATE EXECUTION PROTOCOL (mandatory, in order):**

1. **Before saying "done"**, you MUST actually RUN each gate command. Not "I would run..."
   Not "this should pass..." — ACTUALLY EXECUTE the command and read the output.

2. **Gate 1 — RUN these commands, read output, fix failures:**
   ```
   npx tsc --noEmit
   npx eslint src/
   ```
   If either produces errors → FIX THEM. Do not proceed. Do not say "done."

3. **Gate 2 — START the dev server, verify it loads:**
   Actually run `npm run dev` and confirm zero crash. Not "it should work."

4. **Gate 3 — If auth exists, TEST it:**
   Run Playwright auth tests or manually verify login/logout works.

5. **Gate 4 — For EVERY entity, verify CRUD in the running app:**
   Create one, read the list, update it, delete it. All four. Actually do it.

6. **Gate 5 — Click EVERY nav link and button in the running app:**
   Not "the code looks like it routes correctly." Actually click them.

7. **Gate 7 — Read the project's `GATE7.txt` and execute every `[ ]` check:**
   Each unchecked box is a test you must RUN. Not "this should work" — RUN IT.

8. **Gate 8 — Run Playwright:**
   ```
   npx playwright test
   ```
   If tests fail → FIX THEM. If Playwright is not set up → SET IT UP.

9. **Gate 9 — Run Lighthouse or equivalent performance check.**

## ⛔ GATE SKIP DETECTION — SELF-AUDIT REQUIRED BEFORE EVERY COMMIT

Before every `git commit`, Claude MUST self-audit by answering ALL of the following
out loud in the chat. Unanswered questions = gates were skipped = task is NOT done.

```
GATE AUDIT — [project name] — [timestamp]
------------------------------------------
Gate 1  (TS + Lint):      Did I run `npx tsc --noEmit` AND `npx eslint src/`? [YES/NO]
                           Output (paste last 3 lines): ___
Gate 2  (Dev server):      Did I actually start the server and confirm it loaded? [YES/NO]
                           URL confirmed: ___
Gate 3  (Auth):            Did I test login/logout? (or N/A if no auth) [YES/NO/NA]
Gate 4  (CRUD):            Did I create/read/update/delete at least one entity? [YES/NO/NA]
Gate 5  (Nav/UI):          Did I click every nav link and button? [YES/NO]
Gate 7  (GATE7.txt):       Did I run every [ ] checkbox in GATE7.txt? [YES/NO]
                           Boxes remaining unchecked: ___
Gate 8  (Playwright 00-05): Did I run `npx playwright test`? [YES/NO]
                           Tests passed/failed: ___
Gate 9  (Performance):     Did I run Lighthouse or equivalent? [YES/NO/NA]
Gate 10 (Security):        Did I run 06.security.spec.ts? [YES/NO]
                           No X-Powered-By, no secrets in bundles, XSS blocked: ___
Gate 11 (RLS):             Did I run 07.rls.spec.ts with two test users? [YES/NO/NA-no-multiuser]
                           User B blocked from User A's data: ___
Gate 12 (PHI):             Did I run 08.phi-exposure.spec.ts? [YES/NO/NA-not-medical]
                           PHI not in URLs/storage/console: ___
Gate 13 (Session):         Did I run 09.session.spec.ts? [YES/NO]
                           Logout invalidates session, no service_role in localStorage: ___
Gate 14 (Errors):          Did I run 10.error-handling.spec.ts? [YES/NO]
                           No stack traces in 500s, XSS sanitized: ___
Gate 15 (Functional E2E):  Did I run 11.functional-e2e.spec.ts? [YES/NO/BLOCKED-no-config]
                           CRUD verified via API (not just UI), persistence confirmed: ___
Gate 16 (Routes+APIs):     Did I run 12.routes-and-apis.spec.ts? [YES/NO/BLOCKED-no-config]
                           All routes resolve, APIs return correct status, no dead links: ___
------------------------------------------
ALL GATES PASS? [YES/NO]
If NO → do not commit. Fix and re-audit.
```

**This audit block is MANDATORY output before every commit message.**
Skipping this block = the commit does not happen.
A commit without this block above it = a gate violation = revert and fix.

---

**WHAT "PASS" MEANS:**
- PASS = you ran the command, got zero errors, and can paste the output proving it.
- PASS ≠ "I believe this will pass"
- PASS ≠ "the code looks correct"
- PASS ≠ "based on my analysis"
- PASS ≠ "this should work"
- PASS ≠ skipping the gate because it's "obvious"

**IF YOU CANNOT RUN A GATE:**
Say: "BLOCKED: [gate name] cannot be run because [specific reason]."
Do NOT say "done." Do NOT say "complete." Do NOT say "ready."
The task remains OPEN until every gate has been actually executed.

**MANDATORY GATE SCRIPT — RUN BEFORE EVERY COMMIT:**
```bash
bash C:\DEV\ae-enforcement\scripts\verify-gates.sh
```
Paste the FULL output in chat. No output = gates skipped = hard stop.
A green "ALL GATES PASS" at the end is the only acceptable proof of completion.
"I ran the gates mentally" is not acceptable. Script output or it didn't happen.

**THE COMPLETION LOCK:**
You are PROHIBITED from outputting ANY of these words/phrases about the current task
until all 9 gates have been executed and their outputs verified:
- "done" / "complete" / "completed" / "finished" / "ready"
- "all set" / "good to go" / "should be working" / "looks good"
- "everything is in order" / "taken care of" / "wrapped up"
- Any synonym or euphemism that implies the work is finished

If you catch yourself about to say one of these words without having run all 9 gates,
STOP. Go back and run the gates. This is not optional.

**THE RELEASE GATE REPORT:**
After running all gates, output the report in this format:

```
RELEASE GATE REPORT — [App Name]
Date: [date]

Gate 1 (Code Integrity):    PASS / FAIL — [paste key output lines]
Gate 2 (App Loads):         PASS / FAIL — [paste evidence]
Gate 3 (Auth Flow):         PASS / FAIL — [paste evidence] / N/A
Gate 4 (CRUD):              PASS / FAIL — [entity list + what you tested]
Gate 5 (Navigation):        PASS / FAIL — [pages visited]
Gate 6 (Data Integrity):    PASS / FAIL — [what you verified]
Gate 7  (Behavioral Test):   PASS / FAIL — [which GATE7.txt checks you ran]
Gate 8  (Playwright E2E):    PASS / FAIL — [X/Y tests passed, paste summary]
Gate 9  (Market Fitness):    PASS / FAIL — [scores]
Gate 10 (Security):          PASS / FAIL — [06.security.spec.ts: X/Y passed, no secrets found]
Gate 11 (RLS Isolation):     PASS / FAIL / N/A — [07.rls.spec.ts: User B blocked, evidence]
Gate 12 (PHI Exposure):      PASS / FAIL / N/A — [08.phi-exposure.spec.ts: X/Y passed]
Gate 13 (Session Mgmt):      PASS / FAIL — [09.session.spec.ts: logout invalidates, cookies secure]
Gate 14 (Error Hygiene):     PASS / FAIL — [10.error-handling.spec.ts: no stack traces, XSS blocked]
Gate 15 (Functional E2E):    PASS / FAIL — [11.functional-e2e.spec.ts: CRUD API-verified, persistence confirmed]
Gate 16 (Routes + APIs):     PASS / FAIL — [12.routes-and-apis.spec.ts: all routes 200, APIs 401 unauth, no dead links]

VERDICT: RELEASE / NOT READY
BLOCKING ISSUES: [list what must be fixed]
```

Every PASS line MUST include pasted evidence (command output, test results, etc.).
A PASS line without evidence is automatically INVALID.

### Rule 0b: GATE7 Creation — Mandatory for Every New Project

When scaffolding, cloning, or creating ANY new project in `C:\dev`:

1. **Immediately create `GATE7.txt`** in the project root before writing any feature code.
2. Follow this structure (adapt sections to the app's purpose):

```
[APP NAME] — GATE 7: PRODUCT-SPECIFIC BEHAVIORAL TEST
=====================================================
[One sentence: what this app IS and what it DOES.]
Verification must center on the [CORE WORKFLOW NAME], not static build health.

This file is read by RELEASE_GATE.txt Gate 7.
Every check below must PASS before [App Name] can be called done.

===================================================================
SECTION A: NAVIGATION — ALL TOP-LEVEL ROUTES
===================================================================

  [ ] Landing page opens           → readySelector: main present
  [ ] [List every route the app should have]

===================================================================
SECTION B: [PRIMARY FEATURE DOMAIN] (e.g., PATIENT BOOKING, SCHEDULING)
===================================================================

  [ ] [Core entity CRUD checks]
  [ ] [Key workflow steps]
  [ ] [Integration points]

===================================================================
SECTION C: THE MANDATORY PERSISTENCE TEST
===================================================================

  [ ] Create [primary entity] → fill all fields → save
  [ ] Navigate away from page
  [ ] Return to page → data still present
  [ ] Hard refresh browser → data still present
  [ ] Log out → log back in → data still present
  [ ] Open in incognito/different browser → data visible (if shared)

===================================================================
WHAT CLAUDE IS NOT ALLOWED TO SUBSTITUTE FOR THIS TEST
===================================================================

  - "tsc passed" → NOT A PRODUCT TEST
  - "build succeeded" → NOT A PRODUCT TEST
  - "component renders" → NOT A PRODUCT TEST
  - "API returns 200" → NOT A PRODUCT TEST
  - Only the full end-to-end flow above counts as PASS.
```

3. **Tailor Section B** to the specific app — a CRM gets lead/campaign tests, a scheduler gets shift/calendar tests, a health app gets patient flow tests. Generic placeholders are not acceptable.
4. If the project is too early to define features (just a README), write placeholder sections marked `PENDING — app not yet scaffolded` and update them when features are built.
5. **Every `GATE7.txt` must exist before the first commit** that adds feature code.

---

## Rule 1: Check Before You Write

**NEVER invent table names, column names, enum values, or type shapes.**

Before writing ANY database query:
1. Read the migration files at `supabase/migrations/` or schema at `src/db/schema/`
2. Use exact column names from the migration — not camelCase guesses
3. Check enum values in the migration before using string literals
4. Grep the codebase for existing usage of that column name
5. If `src/types/database.types.ts` exists, use it. If not, generate it.

PostgREST writes to non-existent columns succeed silently. The data vanishes.

---

## Rule 2: No Dead UI

Every button, link, tab, form, and control must do something real.

- `onClick={() => {}}` → PROHIBITED
- `onClick={() => setState(false)}` pretending to be "Save" → PROHIBITED
- "Coming Soon" tabs → PROHIBITED
- Hardcoded demo data arrays → PROHIBITED
- Forms that don't write to DB → PROHIBITED
- localStorage for user data → PROHIBITED (use Supabase)

If a feature can't be completed, disable it visibly. Don't fake it.

---

## Rule 3: CRUD Must Be Complete

For every entity: Create, Read, Update, AND Delete must all work.
No create form without a delete path. No list without an edit path.

---

## Rule 4: Auth Parity

If login exists, logout MUST exist and be reachable.
All password fields MUST have a visibility toggle.
Protected routes MUST redirect to login when unauthenticated.

Stack rules:
- Next.js App Router → PKCE flow, callback handles `?code=`
- Vite SPA → hash token flow, callback handles `#access_token=`
- Only ONE middleware file may exist (check root AND src/)

---

## Rule 5: Schema Enforcement

Every Supabase project must have:
- `src/types/database.types.ts` generated from live schema
- `SCHEMA_MAP.md` at project root
- Typed Supabase client: `createClient<Database>(url, key)`
- NO hand-written interfaces for DB rows — use derived types only

```bash
npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
```

---

## Rule 6: Naming Consistency

Grep before you name. If 3 files use `session_date`, don't write `scheduledAt`.
When renaming, grep ALL files and update atomically.

- DB columns: `snake_case`
- TypeScript DB interfaces: `snake_case`
- UI component props: camelCase (mapped from snake_case)

---

## Rule 7: Work Autonomously

- Don't ask "what stack?" → use Next.js 14+, Supabase, Tailwind, Playwright
- Don't ask "should I set up auth?" → yes, always
- Don't ask "should I create tests?" → yes, always
- Don't ask permission for file writes, commands, commits → just do it
- Don't stop after one step → keep going until all gates pass
- For multi-step work → use ralph-loop with `--max-iterations 25`

The user hands off tasks and walks away. Work silently until done.

---

## Credentials & Infrastructure

### WHERE TO FIND CREDENTIALS — READ THIS BEFORE ASKING

Credentials live in MULTIPLE places. Check ALL of them before claiming a key doesn't exist:

1. **`C:\Users\Admin\.claude\credentials.md`** — primary store, read first always
2. **Windows Sticky Notes** — `C:\Users\Admin\AppData\Local\Packages\Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe\LocalState\plum.sqlite` — read with `sqlite3`, table `Note`, column `Text`. Contains keys that predate credentials.md including Stripe live keys, extra Supabase passwords, etc.
3. **Local `.env.local` files** — `find C:/DEV -name ".env.local" | xargs grep KEY_NAME` — working keys used by running apps
4. **Vercel env vars** — `GET /v9/projects/{id}/env` via Vercel REST API — production keys set for each app
5. **`C:\DEV\aqui`** — the Aqui project directory may contain `.env` files with JARVIS-related keys

**Reading Sticky Notes:**
```python
import sqlite3
conn = sqlite3.connect('C:/Users/Admin/AppData/Local/Packages/Microsoft.MicrosoftStickyNotes_8wekyb3d8bbwe/LocalState/plum.sqlite')
cur = conn.cursor(); cur.execute('SELECT Text FROM Note')
for (t,) in cur.fetchall():
    if t and 'KEYWORD' in t.upper(): print(t[:500])
```

**Stripe keys specifically:**
- `sk_live_` and `pk_live_` are in Sticky Notes (may be expired — if expired, get fresh from Stripe dashboard)
- `sk_test_` working key: in `C:/DEV/BBOS2/.env.local` and `C:/DEV/aloty/.env.local`
- Stripe account: `acct_1S17Q93tKKFT6t6L`
- If a live key is expired, say so clearly — don't silently use test mode

**API keys**: `C:\Users\Admin\.claude\credentials.md` — read this, never ask for keys.

**Supabase projects** (DO NOT MERGE):
| App | Project ID |
|-----|-----------|
| Brightroot | `dptubonksvipfnywalev` |
| CodeWeaver | `wrpspjscllzlyfnvgjik` |

**Table prefixes**: Brightroot → `bright_root_*`, CodeWeaver → `codeweaver_*`

**Deployment**: All apps deploy via `vercel --prod`.
PaintersFolly → push to `enterprise` remote, not `origin`.
PaintersFolly `.npmrc` needs `ignore-scripts=true` and `legacy-peer-deps=true`.

**Vite SPAs on Vercel** need `vercel.json` with SPA rewrites:
```json
{ "rewrites": [{ "source": "/((?!api).*)", "destination": "/index.html" }] }
```

---

## ⛔ Hetzner Port Routing — THREE TIERS, INVIOLATE (agyemanenterprises.com)

**ANY Claude that wants to change this architecture MUST stop and ask Akua directly.**
**This rule exists because a previous Claude silently moved all apps to Traefik 443, removed all tunnel routes, caused a Let's Encrypt rate-limit crisis, and took everything offline. Discovered 2026-05-03.**

Three tiers. No mixing. No exceptions.

**Tier 1 — 40xx — Cloudflare Tunnel → direct host port**
- User-facing apps ONLY. Anything a human browses to in a browser.
- Tunnel route: `subdomain.agyemanenterprises.com → http://localhost:40xx`
- Cloudflare handles TLS at their edge. NO Traefik involvement for these.
- Examples: struth (4009), imho (4011), nexus (4005), ghexit (4006), denovo (4010), vantage (4021), linahla (4015), clyka (4018)
- cannexis (4022 — assigned, not yet live on Coolify)
- **NO backends, APIs, DBs, audio streams, or services on 40xx. Ever.**

**Tier 2 — 443/Traefik — Cloudflare Tunnel → Traefik → internal 80xx**
- All backend services: APIs, admin tools, media, AI, queues, Supabase/Kong instances, etc.
- Tunnel route: `subdomain.agyemanenterprises.com → https://localhost:443` (with noTLSVerify)
- Traefik routes internally to the container on its 80xx port.
- These containers have **NO exposed host ports** — internal Docker network only.
- Examples: db-radio, db-imho, stream.agyemanenterprises.com → Traefik → Icecast
- **NEVER touch Traefik config** — tell Akua what subdomain + internal port is needed. She wires it.

**Tier 3 — 543x+ — Postgres direct (NOT on Cloudflare tunnel)**
- Database admin access only via SSH/psql. Never exposed to internet.
- 5433=DeNovo, 5434=IMHO, 5435=Listmonk, 5436=PeerTube, 5437=Linahla, 5438=TaxRx, 5439=Aqui pgvector, 5440=Riftdesk, 5441=Neuralia

**Decision rule for any new service:**
- Does a user browse to it? → 40xx (Tier 1)
- Everything else (stream, API, DB, queue, etc.) → Traefik 443 (Tier 2)
- Database admin? → 543x+ (Tier 3)

**BEFORE ASSIGNING ANY PORT — MANDATORY:**
Read `~/.claude/portmap.json`. Use the `next_port` value. Increment `next_port` after assignment. Never pick a number not in that file. Two apps on the same port = both go down.

**SSL certs:** Traefik uses DNS-01 challenge via Cloudflare API (CF_API_EMAIL + CF_API_KEY). If Coolify resets proxy config, DNS-01 settings will be lost — reapply from `/data/coolify/proxy/docker-compose.yml`.

---

## Cloudflare Tunnels — ABSOLUTE NO-TOUCH ZONE

**NEVER modify, restart, reconfigure, or interact with Cloudflare Tunnels in ANY way**
unless specifically approved by the user AND the user has instructed exactly how to proceed.

This includes:
- NEVER edit `/etc/cloudflared/config.yml` or any cloudflared config
- NEVER restart `cloudflared` systemd service or Docker container
- NEVER add, remove, or modify tunnel routes (neither locally nor via API)
- NEVER create DNS records in Cloudflare (A, AAAA, CNAME, or TXT)
- NEVER call the Cloudflare Tunnels API
- NEVER touch tunnel `142bf427-79c8-4c1a-8249-5984d03fcc6e` — this belongs to another team member (laudesaucelabs.xyz). It has NOTHING to do with Agyeman Enterprises.
- NEVER touch the `coolify-cloudflared` Docker container

**If a new subdomain needs routing**, tell the user what hostname and port mapping is needed.
The user will add tunnel routes themselves unless they explicitly instruct otherwise.

---

## ⛔ Dual Deployment — MANDATORY FOR EVERY APP (Vercel + Coolify/Hetzner)

Every app in the Agyemanosphere MUST be deployed to BOTH platforms. This is not optional.

- **Vercel** — primary production (GitHub push → auto-deploy), public domain (`appname.com`)
- **Coolify/Hetzner** — failover (`appname.agyemanenterprises.com`), Cloudflare Tunnel → direct 40xx port

A user hitting either URL gets the same working app. Both must be live simultaneously.

**ENV VARS must be set identically in both places.** This includes Supabase, Resend, Stripe, and all app-specific keys. Setting env vars only in Vercel and not Coolify = broken failover = violation.

Exceptions:
- Python workers, background agents, queue processors → Coolify only (no Vercel counterpart needed)
- Stateful long-running backends → Railway

---

## Code Quality (run before every commit)

```bash
npx tsc --noEmit        # zero errors
npx eslint src/         # zero errors
npx vitest run          # unit tests pass
npx playwright test     # e2e tests pass
```

TypeScript strict mode is mandatory. `"strict": true` in every `tsconfig.json`.

---

## Ralph Loop Defaults

```bash
/ralph-loop "TASK" --completion-promise "DONE" --max-iterations 25
```

Always set max-iterations. Always set completion-promise.
After 15 iterations without progress, document blockers and stop.
Never ralph-loop destructive operations without the user present.

---

## Supabase Auth — OTP Pattern (ALL PROJECTS)

### OTP Email Template (mandatory, all templates)

```html
<p>Your verification code is: <strong>{{ .Token }}</strong></p>
<p>This code expires in 10 minutes.</p>
```

Apply to: confirmation, magic_link, email_change, recovery, reauthentication templates.
Update via PATCH `/v1/projects/{ref}/config/auth` with `mailer_templates_*_content` fields.

**CRITICAL settings when applying OTP:**
- `mailer_otp_exp: 600` — default is 60s which is too short; always set to 600
- `mailer_autoconfirm: true` — turn OFF "Confirm email" so new users aren't blocked
- In Supabase dashboard: Authentication → Sign In / Providers → Email → turn off "Confirm email"

### OTP Code Pattern (canonical — use this exactly)

```ts
// lib/auth.ts
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function sendOTP(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) throw error
}

export async function verifyOTP(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw error
  return data
}
```

**CRITICAL:** `type: 'email'` in `verifyOtp()` is mandatory — without it Supabase treats the token as a magic link and it fails silently.

### SMTP — No 2/hr Limit

Never rely on Supabase's built-in email (2/hr cap). Always configure Resend as custom SMTP:
- Host: `smtp.resend.com`, Port: `465` (string, not number), User: `resend`, Pass: Resend API key
- Sender: `hello@[domain]` or `noreply@[domain]`
- The sending domain MUST be verified in Resend — add DKIM (TXT at `resend._domainkey`), SPF TXT + MX at `send.[domain]`
- Set via PATCH `/v1/projects/{ref}/config/auth` with `smtp_*` fields

---

## Domain Routing — Cloudflare → Vercel (ALL PROJECTS)

Standard flow for app subdomains:

1. **Cloudflare DNS** — add CNAME: `app.[domain]` → `cname.vercel-dns.com`, proxied: true
2. **Vercel** — add domain in project settings: `app.[domain]`
3. Vercel auto-provisions SSL via Cloudflare proxy

Never bypass Cloudflare for Vercel deployments. Never add A records pointing directly to Vercel IPs.
