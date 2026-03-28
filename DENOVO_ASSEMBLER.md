# DeNovo — Assembler Design
## The Engine That Turns Slot Maps Into Deployed Apps

---

## What It Does

Takes a validated SlotMap from the Intent Parser and produces either:
- A **live deployed app** (via Gitea + Coolify API), or
- A **downloadable zip** (for users who want to self-host)

The Assembler is a mechanical process — not AI. AI already ran in the Parser.
The Assembler just executes deterministically.

---

## Infrastructure (fully self-hosted on Hetzner)

```
Template Registry    Gitea (self-hosted Git)    Coolify
(private repos)  →  (per-app repo created)  →  (API triggered deploy)
      ↓
   Hetzner server runs the whole pipeline
```

No GitHub. No Vercel. No external dependencies.
Every generated app lives in Gitea and deploys via Coolify.

---

## The 6-Step Pipeline

### Step 1: Clone Template

```typescript
async function cloneTemplate(template: TemplateType): Promise<string> {
  // Gitea API — clone private template repo into temp workspace
  const workdir = `/tmp/denovo/${sessionId}`;

  await gitea.repos.clone({
    owner: 'denovo-templates',
    repo: template,          // e.g. 'marketplace', 'saas', 'directory'
    destination: workdir,
  });

  return workdir;
}
```

Template repos live in a `denovo-templates` org on Gitea.
They are private and never modified — always cloned fresh.

---

### Step 2: Token Substitution

Find and replace all slot tokens across every file in the cloned workspace.
No AI. Pure string replacement.

```typescript
const TOKEN_MAP: Record<string, keyof SlotMap> = {
  '{{APP_NAME}}':             'APP_NAME',
  '{{TAGLINE}}':              'TAGLINE',
  '{{HERO_COPY}}':            'HERO_COPY',
  '{{SELLER_NOUN}}':          'SELLER_NOUN',
  '{{SELLER_NOUN_PLURAL}}':   'SELLER_NOUN_PLURAL',
  '{{BUYER_NOUN}}':           'BUYER_NOUN',
  '{{BUYER_NOUN_PLURAL}}':    'BUYER_NOUN_PLURAL',
  '{{LISTING_NOUN}}':         'LISTING_NOUN',
  '{{LISTING_NOUN_PLURAL}}':  'LISTING_NOUN_PLURAL',
  '{{PLATFORM_FEE_PERCENT}}': 'PLATFORM_FEE_PERCENT',
  '{{PRIMARY_COLOR}}':        'PRIMARY_COLOR',
  '{{SECONDARY_COLOR}}':      'SECONDARY_COLOR',
  '{{APP_URL}}':              'APP_URL',
};

async function substituteTokens(workdir: string, slots: SlotMap): Promise<void> {
  const files = await glob('**/*.{ts,tsx,css,json,md,sql,yaml}', { cwd: workdir });

  for (const file of files) {
    let content = await fs.readFile(path.join(workdir, file), 'utf8');

    for (const [token, slotKey] of Object.entries(TOKEN_MAP)) {
      content = content.replaceAll(token, String(slots[slotKey]));
    }

    // Inject categories array into browse/filter components
    content = content.replace(
      '{{CATEGORIES_ARRAY}}',
      JSON.stringify(slots.CATEGORIES)
    );

    await fs.writeFile(path.join(workdir, file), content);
  }
}
```

---

### Step 3: Snippet Injection

Copies selected snippet folders into the right locations and registers them.

```typescript
const SNIPPET_REGISTRY: Record<SnippetKey, SnippetConfig> = {
  'auth': {
    source: '/snippets/auth',
    target: 'src/lib/auth',
    imports: ['src/app/layout.tsx', 'src/middleware.ts'],
  },
  'stripe-connect': {
    source: '/snippets/stripe-connect',
    target: 'src/app/api/stripe',
    imports: ['src/app/dashboard/earnings/page.tsx'],
  },
  'reviews': {
    source: '/snippets/reviews',
    target: 'src/components/reviews',
    imports: ['src/app/listing/[id]/page.tsx'],
  },
  'messaging': {
    source: '/snippets/messaging',
    target: 'src/app/dashboard/messages',
    imports: ['src/app/dashboard/layout.tsx'],
  },
  'bookings': {
    source: '/snippets/bookings',
    target: 'src/components/bookings',
    imports: ['src/app/listing/[id]/page.tsx'],
  },
  'file-upload': {
    source: '/snippets/file-upload',
    target: 'src/components/upload',
    imports: ['src/app/dashboard/listings/page.tsx'],
  },
  'search-filter': {
    source: '/snippets/search-filter',
    target: 'src/components/search',
    imports: ['src/app/browse/page.tsx'],
  },
  'notifications': {
    source: '/snippets/notifications',
    target: 'src/lib/notifications',
    imports: ['src/app/api/notifications/route.ts'],
  },
  'admin-panel': {
    source: '/snippets/admin-panel',
    target: 'src/app/admin',
    imports: [],
  },
};

async function injectSnippets(
  workdir: string,
  snippets: SnippetKey[]
): Promise<void> {
  for (const key of snippets) {
    const config = SNIPPET_REGISTRY[key];

    // Copy snippet files into workspace
    await fs.cp(config.source, path.join(workdir, config.target), {
      recursive: true,
    });

    // Register imports in the files that need them
    for (const importTarget of config.imports) {
      await registerImport(workdir, importTarget, key);
    }
  }
}
```

---

### Step 4: Schema Generation

Takes `SCHEMA_EXTRAS` from the slot map and appends SQL to the base migration.
This is the ONE step where a small AI call is used — to convert field names
into valid SQL column definitions.

```typescript
async function generateSchemaExtras(
  workdir: string,
  extras: SchemaExtra[]
): Promise<void> {
  if (extras.length === 0) return;

  // Small AI call — input: field names, output: SQL column definitions only
  const sql = await generateSQL(extras);

  // Append to base migration file
  const migrationPath = path.join(
    workdir,
    'supabase/migrations/20250303000000_initial_schema.sql'
  );

  await fs.appendFile(
    migrationPath,
    `\n-- Auto-generated extras\nALTER TABLE listings\n${sql};\n`
  );
}

// AI prompt for schema extras — tightly constrained
const SCHEMA_SQL_PROMPT = `
Convert these field names into PostgreSQL ALTER TABLE ADD COLUMN statements.
Return only the SQL column definitions, nothing else.

Fields: {EXTRAS}

Rules:
- Arrays become text[]
- URLs become text
- Numbers become int or numeric
- Booleans become boolean default false
- Everything else becomes text
- Each line: ADD COLUMN IF NOT EXISTS {name} {type}

Example output:
ADD COLUMN IF NOT EXISTS portfolio_url text,
ADD COLUMN IF NOT EXISTS travel_radius_km int,
ADD COLUMN IF NOT EXISTS equipment text[]
`;
```

---

### Step 5: Environment File Generation

Populate `.env.example` with slot values where known.
Leaves placeholders for secrets the owner must fill in.

```typescript
async function generateEnvFile(
  workdir: string,
  slots: SlotMap
): Promise<void> {
  const envContent = `
# Auto-generated by DeNovo — fill in the secrets before deploying

# Supabase (get from supabase.com → project settings)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (get from dashboard.stripe.com)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PLATFORM_FEE_PERCENT=${slots.PLATFORM_FEE_PERCENT}

# App (pre-filled by DeNovo)
NEXT_PUBLIC_APP_URL=https://${slots.APP_SLUG}.yourdomain.com
NEXT_PUBLIC_APP_NAME=${slots.APP_NAME}

# ElevenLabs (if AI DJ snippet included)
${slots.SNIPPETS.includes('ai-dj') ? 'ELEVENLABS_API_KEY=\nELEVENLABS_VOICE_ID=' : '# (no AI DJ in this app)'}
`.trim();

  await fs.writeFile(path.join(workdir, '.env.example'), envContent);
}
```

---

### Step 6: Output — Deploy or Download

```typescript
async function output(
  workdir: string,
  slots: SlotMap,
  choice: 'deploy' | 'download'
): Promise<OutputResult> {

  if (choice === 'deploy') {
    return await autoDeploy(workdir, slots);
  } else {
    return await packageZip(workdir, slots);
  }
}
```

#### Path A: Auto-Deploy

```typescript
async function autoDeploy(
  workdir: string,
  slots: SlotMap
): Promise<DeployResult> {

  const repoName = slots.APP_SLUG; // e.g. 'shootspace'

  // 1. Create repo in Gitea
  const repo = await gitea.repos.create({
    org: 'denovo-apps',           // Apps org on Gitea
    name: repoName,
    private: true,
    auto_init: false,
  });

  // 2. Push assembled code to Gitea
  await git.init(workdir);
  await git.addRemote('origin', repo.clone_url);
  await git.add('.');
  await git.commit(`feat: initial scaffold — ${slots.APP_NAME}`);
  await git.push('origin', 'main');

  // 3. Create Coolify application via API
  const app = await coolify.applications.create({
    name: slots.APP_NAME,
    git_repository: repo.clone_url,
    git_branch: 'main',
    build_pack: 'nixpacks',
    port: 3000,                   // Coolify assigns external port
    domain: `${slots.APP_SLUG}.yourdomain.com`,
    environment_variables: buildEnvVars(slots),
  });

  // 4. Trigger first deploy
  await coolify.applications.deploy(app.id);

  return {
    type: 'deploy',
    gitea_url: repo.html_url,
    coolify_app_id: app.id,
    domain: app.domain,
    status: 'deploying',
  };
}
```

#### Path B: Download Zip

```typescript
async function packageZip(
  workdir: string,
  slots: SlotMap
): Promise<DownloadResult> {

  const zipPath = `/tmp/denovo/${slots.APP_SLUG}.zip`;

  await zip(workdir, zipPath);

  // Generate signed download URL (expires in 1 hour)
  const url = await storage.signedUrl(zipPath, { expiresIn: 3600 });

  return {
    type: 'download',
    url,
    filename: `${slots.APP_SLUG}.zip`,
    instructions: buildReadme(slots),
  };
}
```

---

## What the User Sees

### Deploy Path
```
✅ Building your app...

  ✓ Template cloned
  ✓ Slots applied (47 files updated)
  ✓ Snippets injected (auth, stripe-connect, reviews, bookings)
  ✓ Schema generated
  ✓ Repo created → gitea.yourdomain.com/denovo-apps/shootspace
  ✓ Coolify deploying...

  🎉 ShootSpace is live at https://shootspace.yourdomain.com

  Next steps:
  → Add your Supabase credentials in Coolify env vars
  → Add your Stripe keys in Coolify env vars
  → Upload your first listing

  [Open App] [Open Coolify] [View Repo]
```

### Download Path
```
✅ Your app is ready.

  📦 shootspace.zip (4.2 MB)

  Includes:
  → Full Next.js 14 source
  → Supabase migration SQL
  → Docker Compose for local dev
  → README with setup instructions

  [Download] [Copy Setup Instructions]
```

---

## Assembler API

```typescript
// POST /api/denovo/assemble
interface AssembleRequest {
  sessionId: string;
  slots: SlotMap;
  template: TemplateType;
  outputChoice: 'deploy' | 'download';
}

interface AssembleResponse {
  jobId: string;            // Poll for status
  estimatedSeconds: number; // ~30s deploy, ~10s download
}

// GET /api/denovo/assemble/:jobId
interface AssembleStatus {
  stage: 'cloning' | 'substituting' | 'injecting' | 'schema' | 'outputting' | 'done' | 'error';
  progress: number;         // 0-100
  result?: OutputResult;
  error?: string;
}
```

---

## What the Assembler Does NOT Do

- Does not use AI except for the schema extras SQL step
- Does not modify the template repos (always clones fresh)
- Does not store user data beyond the session
- Does not configure Cloudflare (owner does that manually)
- Does not run `npm install` or `npm run build` — Coolify handles that
- Does not create Supabase projects — owner provides credentials

---

## DeNovo Full Architecture (all three pieces together)

```
User types description
        ↓
  Intent Parser
  (LLM-powered, conversational)
  → Extracts SlotMap
  → Selects template
  → Selects snippets
        ↓
  Confirmation screen
  (user reviews + approves)
        ↓
  Assembler
  (mechanical, deterministic)
  → Clones template from Gitea
  → Substitutes tokens
  → Injects snippets
  → Generates schema SQL
  → Generates .env.example
        ↓
  Output choice
  ┌─────────────────┐
  │  Auto-Deploy    │  Download Zip
  │  Gitea repo  →  │  → signed URL
  │  Coolify API    │
  └─────────────────┘
        ↓
  Live app on Hetzner
  (owner fills API keys in Coolify)
```
