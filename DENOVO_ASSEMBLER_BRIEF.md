# DeNovo — Assembler Build Brief
## The engine that turns slot maps into deployed apps.
## Builds on top of the running DeNovo Studio (port 4010).

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Stop at port 4010.

---

## What the Assembler Is

The Assembler is the backend pipeline that takes a confirmed SlotMap
from the Intent Parser and produces either:
- A live deployed app (via Gitea + Coolify API), or
- A downloadable zip (signed URL via Supabase Storage)

It runs as a background job inside DeNovo Studio.
It is triggered after the user confirms on the confirmation screen.
It is NOT AI — it is a deterministic mechanical process.
AI ran in the Intent Parser. The Assembler just executes.

---

## Architecture

```
Confirmed SlotMap
      ↓
Step 1: Clone template from Gitea (denovo-templates org)
      ↓
Step 2: Token substitution (find/replace across all files)
      ↓
Step 3: Snippet injection (copy proven snippet files into workspace)
      ↓
Step 4: Schema extras (one AI call → SQL column definitions appended)
      ↓
Step 5: Env file generation (.env.example with known values filled)
      ↓
Step 6: Output
        ├── Deploy: push to Gitea (denovo-apps org) → Coolify API
        └── Download: zip → Supabase Storage → signed URL
```

---

## Existing Infrastructure (do not recreate)

| Service | Location | Purpose |
|---|---|---|
| Gitea | Hetzner (self-hosted) | Template repos + generated app repos |
| Coolify | Hetzner port 8000 | Auto-deploy generated apps |
| Supabase | jomualvckaudlcqrfvxv | Job tracking + zip storage |
| DeNovo Studio | port 4010 | The UI this assembler runs inside |

---

## Supabase Credentials

```
NEXT_PUBLIC_SUPABASE_URL=https://jomualvckaudlcqrfvxv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXVhbHZja2F1ZGxjcXJmdnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjUwNDIsImV4cCI6MjA4ODM0MTA0Mn0.nlMkdRyIMQ18Uf6MThIJn1kbN63VdArQ-p5Mw-_4Z-A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXVhbHZja2F1ZGxjcXJmdnh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc2NTA0MiwiZXhwIjoyMDg4MzQxMDQyfQ.3Hoz8-brzx8eX4kibH_hVcRdz645dn5HfVoAtUvbA9c
```

---

## Database Schema (add to existing DeNovo Studio schema)

```sql
-- Assemble jobs (tracks pipeline progress)
create table if not exists assemble_jobs (
  id uuid primary key default gen_random_uuid(),
  app_id uuid references apps(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  stage text check (stage in (
    'queued',
    'cloning',
    'substituting',
    'injecting',
    'schema',
    'env',
    'outputting',
    'done',
    'error'
  )) default 'queued',
  progress int default 0,           -- 0-100
  log text[] default '{}',          -- progress messages shown to user
  output_type text check (output_type in ('deploy', 'download')),
  result jsonb,                     -- final output details
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table assemble_jobs enable row level security;
create policy "own jobs" on assemble_jobs
  for select using (auth.uid() = user_id);
```

---

## Environment Variables (add to existing DeNovo Studio .env)

```bash
# Gitea (self-hosted on Hetzner)
GITEA_BASE_URL=https://gitea.agyemanenterprises.com
GITEA_API_TOKEN=
GITEA_TEMPLATES_ORG=denovo-templates
GITEA_APPS_ORG=denovo-apps

# Coolify (self-hosted on Hetzner)
COOLIFY_BASE_URL=https://coolify.agyemanenterprises.com
COOLIFY_API_TOKEN=

# Anthropic (schema extras generation only)
ANTHROPIC_API_KEY=

# Assembly workspace (temp directory on server)
ASSEMBLY_WORKSPACE=/tmp/denovo-assembly
```

---

## New Files to Add to DeNovo Studio

```
src/
├── app/
│   └── api/
│       └── denovo/
│           ├── assemble/
│           │   ├── route.ts              # POST — trigger assembly
│           │   └── [jobId]/
│           │       └── route.ts          # GET — poll job status
│           └── assemble/
│               └── worker.ts             # Background job runner
└── lib/
    └── assembler/
        ├── index.ts                      # Main orchestrator
        ├── clone.ts                      # Step 1: Clone template
        ├── substitute.ts                 # Step 2: Token substitution
        ├── inject.ts                     # Step 3: Snippet injection
        ├── schema.ts                     # Step 4: Schema extras
        ├── env.ts                        # Step 5: Env file generation
        ├── deploy.ts                     # Step 6a: Deploy via Gitea+Coolify
        ├── download.ts                   # Step 6b: Zip + signed URL
        ├── gitea.ts                      # Gitea API client
        ├── coolify.ts                    # Coolify API client
        └── types.ts                      # SlotMap + job types
```

---

## Implementation Details

### `src/lib/assembler/types.ts`

```typescript
export interface SlotMap {
  // Identity
  APP_NAME: string
  APP_SLUG: string
  TAGLINE: string
  PRIMARY_ENTITY: string
  SECONDARY_ENTITY: string
  BRAND_PRIMARY: string
  BRAND_ACCENT: string
  CURRENCY: string
  PLATFORM_FEE: string
  CTA_PRIMARY: string
  CTA_SECONDARY: string
  SUPPORT_EMAIL: string
  DOMAIN: string

  // Template selection
  template: string           // e.g. 'MARKETPLACE'
  variant: string            // e.g. 'marketplace-service'

  // Snippet selection
  snippets: {
    required: number[]       // snippet numbers e.g. [1, 2, 5, 6]
    optional: number[]       // selected optional snippets
  }

  // Schema extras
  schema_extras: string[]    // e.g. ['portfolio_url', 'turnaround_days']

  // Additional variant-specific tokens
  [key: string]: any
}

export type AssembleStage =
  | 'queued' | 'cloning' | 'substituting' | 'injecting'
  | 'schema' | 'env' | 'outputting' | 'done' | 'error'

export interface AssembleJob {
  id: string
  appId: string
  userId: string
  stage: AssembleStage
  progress: number
  log: string[]
  outputType: 'deploy' | 'download'
  result?: DeployResult | DownloadResult
  error?: string
}

export interface DeployResult {
  type: 'deploy'
  giteaRepoUrl: string
  coolifyAppId: string
  domain: string
  status: 'deploying' | 'live'
}

export interface DownloadResult {
  type: 'download'
  downloadUrl: string
  filename: string
  expiresAt: string
}
```

---

### `src/lib/assembler/index.ts` — Main orchestrator

```typescript
import { createClient } from '@supabase/supabase-js'
import { cloneTemplate } from './clone'
import { substituteTokens } from './substitute'
import { injectSnippets } from './inject'
import { generateSchemaExtras } from './schema'
import { generateEnvFile } from './env'
import { deployToGitea } from './deploy'
import { packageDownload } from './download'
import type { SlotMap, AssembleJob } from './types'
import path from 'path'
import fs from 'fs/promises'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function updateJob(
  jobId: string,
  updates: Partial<AssembleJob> & { log_entry?: string }
) {
  const { log_entry, ...rest } = updates

  await supabaseAdmin
    .from('assemble_jobs')
    .update({
      ...rest,
      ...(log_entry ? {} : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  if (log_entry) {
    await supabaseAdmin.rpc('append_job_log', {
      job_id: jobId,
      entry: log_entry,
    })
  }
}

export async function runAssembly(
  jobId: string,
  slots: SlotMap,
  outputType: 'deploy' | 'download'
) {
  const workdir = path.join(
    process.env.ASSEMBLY_WORKSPACE!,
    jobId
  )

  try {
    // Step 1: Clone
    await updateJob(jobId, {
      stage: 'cloning',
      progress: 10,
      log_entry: 'Cloning template...',
    })
    await cloneTemplate(slots.template, workdir)
    await updateJob(jobId, { log_entry: '✓ Template cloned' })

    // Step 2: Token substitution
    await updateJob(jobId, {
      stage: 'substituting',
      progress: 25,
      log_entry: 'Applying your configuration...',
    })
    const fileCount = await substituteTokens(workdir, slots)
    await updateJob(jobId, {
      log_entry: `✓ Configuration applied (${fileCount} files updated)`,
    })

    // Step 3: Snippet injection
    await updateJob(jobId, {
      stage: 'injecting',
      progress: 45,
      log_entry: 'Injecting features...',
    })
    const allSnippets = [
      ...slots.snippets.required,
      ...slots.snippets.optional,
    ]
    await injectSnippets(workdir, allSnippets)
    await updateJob(jobId, {
      log_entry: `✓ Features injected (${allSnippets.length} modules)`,
    })

    // Step 4: Schema extras
    await updateJob(jobId, {
      stage: 'schema',
      progress: 60,
      log_entry: 'Generating database schema...',
    })
    if (slots.schema_extras.length > 0) {
      await generateSchemaExtras(workdir, slots.schema_extras)
      await updateJob(jobId, {
        log_entry: `✓ Schema generated (${slots.schema_extras.length} extras)`,
      })
    } else {
      await updateJob(jobId, { log_entry: '✓ Schema ready (no extras)' })
    }

    // Step 5: Env file
    await updateJob(jobId, {
      stage: 'env',
      progress: 75,
      log_entry: 'Preparing environment configuration...',
    })
    await generateEnvFile(workdir, slots)
    await updateJob(jobId, { log_entry: '✓ Environment file ready' })

    // Step 6: Output
    await updateJob(jobId, {
      stage: 'outputting',
      progress: 85,
      log_entry: outputType === 'deploy'
        ? 'Deploying to your infrastructure...'
        : 'Packaging your codebase...',
    })

    let result
    if (outputType === 'deploy') {
      result = await deployToGitea(workdir, slots)
      await updateJob(jobId, {
        log_entry: `✓ Deployed → ${result.domain}`,
      })
    } else {
      result = await packageDownload(workdir, slots)
      await updateJob(jobId, {
        log_entry: `✓ Download ready`,
      })
    }

    // Done
    await updateJob(jobId, {
      stage: 'done',
      progress: 100,
      result,
      completed_at: new Date().toISOString(),
    })

    // Update app record
    await supabaseAdmin
      .from('apps')
      .update({
        status: outputType === 'deploy' ? 'deploying' : 'downloaded',
        ...(result.type === 'deploy' ? {
          gitea_repo_url: result.giteaRepoUrl,
          coolify_app_id: result.coolifyAppId,
          coolify_domain: result.domain,
        } : {
          download_url: result.downloadUrl,
          download_expires_at: result.expiresAt,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', (await supabaseAdmin
        .from('assemble_jobs')
        .select('app_id')
        .eq('id', jobId)
        .single()
      ).data?.app_id)

  } catch (error) {
    await updateJob(jobId, {
      stage: 'error',
      error: String(error),
      completed_at: new Date().toISOString(),
    })
  } finally {
    // Clean up workspace
    await fs.rm(workdir, { recursive: true, force: true })
  }
}
```

---

### `src/lib/assembler/clone.ts`

```typescript
import { giteaClient } from './gitea'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

const execAsync = promisify(exec)

const TEMPLATE_MAP: Record<string, string> = {
  'MARKETPLACE':     'template-marketplace',
  'SAAS_TOOL':       'template-saas',
  'CLIENT_PORTAL':   'template-portal',
  'INTERNAL_TOOL':   'template-internal',
  'ECOMMERCE':       'template-commerce',
  'COMMUNITY':       'template-community',
  'DIRECTORY':       'template-directory',
  'CONTENT_MEDIA':   'template-content',
}

export async function cloneTemplate(
  archetype: string,
  workdir: string
): Promise<void> {
  const repoName = TEMPLATE_MAP[archetype]
  if (!repoName) throw new Error(`Unknown template archetype: ${archetype}`)

  const cloneUrl = `${process.env.GITEA_BASE_URL}/${process.env.GITEA_TEMPLATES_ORG}/${repoName}.git`

  await fs.mkdir(workdir, { recursive: true })

  await execAsync(
    `git clone --depth 1 ${cloneUrl} ${workdir}`,
    { env: {
      ...process.env,
      GIT_ASKPASS: 'echo',
      GIT_USERNAME: 'denovo',
      GIT_PASSWORD: process.env.GITEA_API_TOKEN,
    }}
  )

  // Remove .git so the output is a clean repo
  await fs.rm(path.join(workdir, '.git'), { recursive: true, force: true })
}
```

---

### `src/lib/assembler/substitute.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'
import { glob } from 'glob'
import type { SlotMap } from './types'

// All token patterns the Assembler replaces
const TOKEN_KEYS = [
  'APP_NAME', 'APP_SLUG', 'TAGLINE',
  'PRIMARY_ENTITY', 'SECONDARY_ENTITY',
  'BRAND_PRIMARY', 'BRAND_ACCENT',
  'CURRENCY', 'PLATFORM_FEE',
  'CTA_PRIMARY', 'CTA_SECONDARY',
  'SUPPORT_EMAIL', 'DOMAIN',
  // Plural forms
  'SELLER_NOUN', 'SELLER_NOUN_PLURAL',
  'BUYER_NOUN', 'BUYER_NOUN_PLURAL',
  'LISTING_NOUN', 'LISTING_NOUN_PLURAL',
  'MEMBER_NOUN', 'MEMBER_NOUN_PLURAL',
  'PROVIDER_NOUN', 'CLIENT_NOUN',
  'CONTENT_NOUN', 'CONTENT_NOUN_PLURAL',
  'PRODUCT_NOUN', 'PRODUCT_NOUN_PLURAL',
  'PRIMARY_ENTITY_PLURAL', 'SECONDARY_ENTITY_PLURAL',
  // Pricing
  'FREE_LIMIT', 'PRO_PRICE', 'PRO_LIMIT',
  'FEATURED_PRICE', 'APPROVAL_REQUIRED',
  // Misc
  'PIPELINE_STAGES', 'PRODUCT_TYPE',
]

export async function substituteTokens(
  workdir: string,
  slots: SlotMap
): Promise<number> {
  const files = await glob(
    '**/*.{ts,tsx,css,json,md,sql,yaml,yml,txt}',
    { cwd: workdir, ignore: ['node_modules/**', '.next/**'] }
  )

  for (const file of files) {
    const filepath = path.join(workdir, file)
    let content = await fs.readFile(filepath, 'utf8')
    let changed = false

    for (const key of TOKEN_KEYS) {
      const token = `{{${key}}}`
      const value = slots[key]
      if (value !== undefined && content.includes(token)) {
        // Arrays get JSON-stringified
        const replacement = Array.isArray(value)
          ? JSON.stringify(value)
          : String(value)
        content = content.replaceAll(token, replacement)
        changed = true
      }
    }

    if (changed) {
      await fs.writeFile(filepath, content)
    }
  }

  return files.length
}
```

---

### `src/lib/assembler/inject.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'

// Maps snippet number to its folder name in the snippets registry
const SNIPPET_DIRS: Record<number, string> = {
  1:  'auth',
  2:  'stripe-simple',
  3:  'stripe-connect',
  4:  'file-upload',
  5:  'admin-panel',
  6:  'search-filter',
  7:  'output-delivery',
  8:  'roles-permissions',
  9:  'notifications',
  10: 'messaging',
  11: 'reviews-ratings',
  12: 'bookings',
  13: 'blog-cms',
  14: 'api-webhooks',
  15: 'email-transactional',
}

// Snippets base path — the proven, extracted snippet files
const SNIPPETS_BASE = path.join(process.cwd(), 'snippets')

export async function injectSnippets(
  workdir: string,
  snippetNumbers: number[]
): Promise<void> {
  for (const num of snippetNumbers) {
    const dir = SNIPPET_DIRS[num]
    if (!dir) throw new Error(`Unknown snippet number: ${num}`)

    const snippetPath = path.join(SNIPPETS_BASE, dir)

    // Check snippet exists
    try {
      await fs.access(snippetPath)
    } catch {
      // Snippet not yet built — log warning, continue
      console.warn(`Snippet ${num} (${dir}) not found — skipping`)
      continue
    }

    // Copy snippet files into workdir
    await copyDir(snippetPath, workdir)
  }
}

async function copyDir(src: string, dest: string): Promise<void> {
  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true })
      await copyDir(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}
```

---

### `src/lib/assembler/schema.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'
import { glob } from 'glob'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function generateSchemaExtras(
  workdir: string,
  extras: string[]
): Promise<void> {
  // Find the migration file
  const migrations = await glob(
    'supabase/migrations/*.sql',
    { cwd: workdir }
  )

  if (migrations.length === 0) return

  const migrationPath = path.join(workdir, migrations[0])

  // Tightly constrained AI call — schema only, nothing else
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Convert these field names to PostgreSQL ALTER TABLE ADD COLUMN statements for the listings table.
Return ONLY the SQL, nothing else. No explanation, no markdown, no backticks.

Fields: ${extras.join(', ')}

Rules:
- Arrays become text[]
- Fields ending in _url become text
- Fields ending in _cents become int
- Fields ending in _count or _minutes or _days become int
- Boolean fields become boolean default false
- Everything else becomes text
- Format: ADD COLUMN IF NOT EXISTS {name} {type}
- Comma-separate each line
- No semicolons`
    }],
  })

  const sql = response.content[0].type === 'text'
    ? response.content[0].text.trim()
    : ''

  if (sql) {
    await fs.appendFile(
      migrationPath,
      `\n-- Auto-generated schema extras\nALTER TABLE listings\n  ${sql};\n`
    )
  }
}
```

---

### `src/lib/assembler/env.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'
import type { SlotMap } from './types'

export async function generateEnvFile(
  workdir: string,
  slots: SlotMap
): Promise<void> {
  const content = `# Generated by DeNovo — fill in secrets before deploying
# App: ${slots.APP_NAME}
# Template: ${slots.template} / ${slots.variant}
# Generated: ${new Date().toISOString()}

# ─── Supabase ───────────────────────────────────────────
# Get from: supabase.com → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ─── Stripe ─────────────────────────────────────────────
# Get from: dashboard.stripe.com → Developers → API Keys
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
${slots.template === 'MARKETPLACE'
  ? `STRIPE_PLATFORM_FEE_PERCENT=${slots.PLATFORM_FEE}`
  : `# STRIPE_[PLAN]_PRICE_ID= # Add your Stripe Price IDs here`
}

# ─── App ────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://${slots.DOMAIN}
NEXT_PUBLIC_APP_NAME=${slots.APP_NAME}
NEXT_PUBLIC_APP_SLUG=${slots.APP_SLUG}

# ─── Email ──────────────────────────────────────────────
# Get from: resend.com → API Keys
RESEND_API_KEY=
EMAIL_FROM=noreply@${slots.DOMAIN}
EMAIL_REPLY_TO=${slots.SUPPORT_EMAIL}

${slots.snippets.required.includes(3) ? `# ─── Stripe Connect ──────────────────────────────────
# Already configured above — Connect uses same keys
` : ''}
${slots.snippets.required.includes(15) || slots.snippets.optional.includes(15) ? '' : ''}
`

  await fs.writeFile(path.join(workdir, '.env.example'), content)

  // Also write a .gitignore entry for .env.local
  const gitignorePath = path.join(workdir, '.gitignore')
  try {
    const existing = await fs.readFile(gitignorePath, 'utf8')
    if (!existing.includes('.env.local')) {
      await fs.appendFile(gitignorePath, '\n.env.local\n')
    }
  } catch {
    await fs.writeFile(gitignorePath, '.env.local\n.env\n')
  }
}
```

---

### `src/lib/assembler/deploy.ts`

```typescript
import { giteaClient } from './gitea'
import { coolifyClient } from './coolify'
import { exec } from 'child_process'
import { promisify } from 'util'
import type { SlotMap, DeployResult } from './types'

const execAsync = promisify(exec)

export async function deployToGitea(
  workdir: string,
  slots: SlotMap
): Promise<DeployResult> {
  const repoName = slots.APP_SLUG

  // 1. Create repo in denovo-apps org on Gitea
  const repo = await giteaClient.createRepo({
    org: process.env.GITEA_APPS_ORG!,
    name: repoName,
    description: `Generated by DeNovo — ${slots.APP_NAME}`,
    private: true,
    autoInit: false,
  })

  // 2. Push assembled code to Gitea
  await execAsync(`git init`, { cwd: workdir })
  await execAsync(`git add .`, { cwd: workdir })
  await execAsync(
    `git commit -m "feat: initial scaffold — ${slots.APP_NAME}"`,
    { cwd: workdir }
  )
  await execAsync(
    `git remote add origin ${repo.cloneUrl}`,
    { cwd: workdir }
  )
  await execAsync(
    `git push -u origin main`,
    {
      cwd: workdir,
      env: {
        ...process.env,
        GIT_ASKPASS: 'echo',
        GIT_USERNAME: 'denovo',
        GIT_PASSWORD: process.env.GITEA_API_TOKEN,
      }
    }
  )

  // 3. Create Coolify application
  const app = await coolifyClient.createApplication({
    name: slots.APP_NAME,
    gitRepository: repo.cloneUrl,
    gitBranch: 'main',
    buildPack: 'nixpacks',
    port: 3000,
    domain: `https://${slots.DOMAIN}`,
    environmentVariables: {
      NEXT_PUBLIC_APP_NAME: slots.APP_NAME,
      NEXT_PUBLIC_APP_URL: `https://${slots.DOMAIN}`,
    },
  })

  // 4. Trigger first deploy
  await coolifyClient.deploy(app.id)

  return {
    type: 'deploy',
    giteaRepoUrl: repo.htmlUrl,
    coolifyAppId: app.id,
    domain: slots.DOMAIN,
    status: 'deploying',
  }
}
```

---

### `src/lib/assembler/download.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'
import type { SlotMap, DownloadResult } from './types'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function packageDownload(
  workdir: string,
  slots: SlotMap
): Promise<DownloadResult> {
  const zipPath = `${workdir}.zip`
  const filename = `${slots.APP_SLUG}-${Date.now()}.zip`

  // Create zip
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', resolve)
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(workdir, slots.APP_SLUG)
    archive.finalize()
  })

  // Upload to Supabase Storage
  const zipBuffer = fs.readFileSync(zipPath)

  const { error } = await supabaseAdmin.storage
    .from('app-downloads')
    .upload(filename, zipBuffer, {
      contentType: 'application/zip',
      upsert: false,
    })

  if (error) throw error

  // Generate signed URL (1 hour expiry)
  const { data } = await supabaseAdmin.storage
    .from('app-downloads')
    .createSignedUrl(filename, 3600)

  fs.unlinkSync(zipPath)

  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()

  return {
    type: 'download',
    downloadUrl: data!.signedUrl,
    filename,
    expiresAt,
  }
}
```

---

### `src/lib/assembler/gitea.ts`

```typescript
const BASE = process.env.GITEA_BASE_URL!
const TOKEN = process.env.GITEA_API_TOKEN!

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...options,
    headers: {
      'Authorization': `token ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`Gitea API error: ${res.status} ${await res.text()}`)
  return res.json()
}

export const giteaClient = {
  async createRepo(opts: {
    org: string
    name: string
    description: string
    private: boolean
    autoInit: boolean
  }) {
    const data = await request(`/orgs/${opts.org}/repos`, {
      method: 'POST',
      body: JSON.stringify({
        name: opts.name,
        description: opts.description,
        private: opts.private,
        auto_init: opts.autoInit,
      }),
    })
    return {
      id: data.id,
      name: data.name,
      cloneUrl: data.clone_url,
      htmlUrl: data.html_url,
    }
  },
}
```

---

### `src/lib/assembler/coolify.ts`

```typescript
const BASE = process.env.COOLIFY_BASE_URL!
const TOKEN = process.env.COOLIFY_API_TOKEN!

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`Coolify API error: ${res.status} ${await res.text()}`)
  return res.json()
}

export const coolifyClient = {
  async createApplication(opts: {
    name: string
    gitRepository: string
    gitBranch: string
    buildPack: string
    port: number
    domain: string
    environmentVariables: Record<string, string>
  }) {
    const data = await request('/applications', {
      method: 'POST',
      body: JSON.stringify({
        name: opts.name,
        git_repository: opts.gitRepository,
        git_branch: opts.gitBranch,
        build_pack: opts.buildPack,
        ports_exposes: String(opts.port),
        fqdn: opts.domain,
        environment_variables: Object.entries(opts.environmentVariables)
          .map(([key, value]) => ({ key, value })),
      }),
    })
    return { id: data.uuid, domain: opts.domain }
  },

  async deploy(appId: string) {
    return request(`/applications/${appId}/deploy`, { method: 'POST' })
  },
}
```

---

### API Routes

#### `src/app/api/denovo/assemble/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { runAssembly } from '@/lib/assembler'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { appId, slots, outputType } = await request.json()

  // Check credits
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('credits_remaining, plan_id')
    .eq('user_id', user.id)
    .single()

  if (!sub || sub.credits_remaining < 1) {
    return NextResponse.json(
      { error: 'INSUFFICIENT_CREDITS' },
      { status: 402 }
    )
  }

  // Deduct credit
  await supabase
    .from('subscriptions')
    .update({ credits_remaining: sub.credits_remaining - 1 })
    .eq('user_id', user.id)

  // Create job
  const { data: job } = await supabase
    .from('assemble_jobs')
    .insert({
      app_id: appId,
      user_id: user.id,
      output_type: outputType,
      stage: 'queued',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  // Run assembly in background (fire and forget)
  runAssembly(job.id, slots, outputType).catch(console.error)

  return NextResponse.json({
    jobId: job.id,
    estimatedSeconds: outputType === 'deploy' ? 45 : 15,
  })
}
```

#### `src/app/api/denovo/assemble/[jobId]/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: job } = await supabase
    .from('assemble_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single()

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(job)
}
```

---

## Additional Dependencies

```bash
npm install archiver glob @anthropic-ai/sdk
npm install --save-dev @types/archiver
```

---

## Supabase Storage Bucket

Create in Supabase Dashboard → Storage → New bucket:
```
Name: app-downloads
Public: false
File size limit: 500MB
```

---

## SQL Helper Function

```sql
-- Append to job log array
create or replace function append_job_log(job_id uuid, entry text)
returns void as $$
begin
  update assemble_jobs
  set log = array_append(log, entry),
      updated_at = now()
  where id = job_id;
end;
$$ language plpgsql security definer;
```

---

## Build Verification

```bash
npm run build    # zero errors, zero type errors
```

Manually test:
- [ ] POST /api/denovo/assemble creates job + deducts credit
- [ ] Job stages update correctly as pipeline runs
- [ ] GET /api/denovo/assemble/[jobId] returns current status
- [ ] Token substitution replaces all {{TOKEN}} placeholders
- [ ] Schema extras generate valid SQL
- [ ] Download produces valid zip file
- [ ] Deploy path creates Gitea repo (or fails gracefully if Gitea not configured)
- [ ] Insufficient credits returns 402
- [ ] `npm run build` passes clean

---

## Graceful Degradation

If Gitea is not yet configured:
- Log "Gitea not configured — outputting as download instead"
- Fall back to download path automatically
- Do not crash

If Coolify is not yet configured:
- Create the Gitea repo
- Log "Coolify not configured — repo created, deploy manually"
- Return partial result with giteaRepoUrl only

If a snippet is not yet built:
- Log warning "Snippet N not found — skipping"
- Continue assembly without it
- Note missing snippets in job result

---

## What You Are NOT Doing

- ❌ Cloudflare, DNS, tunnels
- ❌ Building the Intent Parser (already in Studio)
- ❌ Building templates or snippets (those are separate briefs)
- ❌ Changing the DeNovo Studio port from 4010
- ❌ One-shot AI generation of entire apps

---

## When Done — Report Exactly

1. ✅/❌ assemble_jobs table created
2. ✅/❌ app-downloads storage bucket created
3. ✅/❌ POST /api/denovo/assemble creates job + deducts credit
4. ✅/❌ Pipeline runs all 6 steps with correct stage updates
5. ✅/❌ Token substitution works across file types
6. ✅/❌ Schema extras generate valid SQL via Claude API
7. ✅/❌ Download path produces valid zip + signed URL
8. ✅/❌ Deploy path creates Gitea repo (or degrades gracefully)
9. ✅/❌ Job polling returns correct status
10. ✅/❌ `npm run build` passes clean
