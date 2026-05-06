# DeNovo — Assembler Corrected Build Brief
## Types verified against src/types/denovo.ts + src/types/database.ts

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, or Traefik config.

---

## 🚨 RULE 0 — READ BEFORE YOU WRITE ANYTHING

Before creating or editing any file, you MUST:

1. Read `src/types/denovo.ts` — confirm SlotMap field names
2. Read `src/types/database.ts` — confirm table columns and JobStage values
3. Read the existing `src/app/api/denovo/assemble/route.ts` — match its patterns
4. Read `src/lib/supabase/server.ts` — use the correct client factory
5. Print a summary of what you found before writing

If you skip this step, stop and do it now.

---

## VERIFIED TYPES — DO NOT DEVIATE FROM THESE

These are extracted from the actual codebase. Use them exactly.

### SlotMap (from src/types/denovo.ts)
```typescript
interface SlotMap {
  APP_NAME: string
  TAGLINE: string
  HERO_COPY: string
  TEMPLATE: TemplateType          // lowercase: 'marketplace' | 'saas' | 'directory' |
                                  // 'community' | 'ecommerce' | 'client-portal' |
                                  // 'internal-tool' | 'content-media'
  SELLER_NOUN?: string
  BUYER_NOUN?: string
  LISTING_NOUN?: string
  CATEGORIES: string[]
  PLATFORM_FEE_PERCENT?: number
  PRIMARY_COLOR: string
  SECONDARY_COLOR?: string
  SCHEMA_EXTRAS: string[]
  SNIPPETS: string[]              // flat array of snippet names e.g. ['auth', 'stripe-simple']
}
```

### assemble_jobs table columns (from src/types/database.ts)
```
id           uuid
app_id       string   (NOT user_id — user is on the apps table)
stage        JobStage
progress     number
log          string[] | null
result       Json | null
error        string | null
created_at   string
updated_at   string
```

### JobStage enum (from src/types/database.ts)
```typescript
type JobStage = 'cloning' | 'substituting' | 'injecting' | 'schema' | 'outputting' | 'done' | 'error'
```
⚠️ 'queued' does NOT exist. 'env' does NOT exist. Do not use them.

### JobStatus result shape (from src/types/denovo.ts)
```typescript
result?: {
  type: 'deploy' | 'download'
  giteaUrl?: string          // NOT giteaRepoUrl
  coolifyAppId?: string
  domain?: string
  downloadUrl?: string
}
```

### Functions table (from src/types/database.ts)
```typescript
Functions: Record<string, never>
```
⚠️ append_job_log RPC does NOT exist. Do NOT call supabase.rpc().
Update logs by reading the existing array and appending to it manually.

### AssembleRequest (from src/types/denovo.ts)
```typescript
interface AssembleRequest {
  sessionId: string    // used to look up slot_map from sessions table
  appId: string
  outputType: 'deploy' | 'download'
}
```
The slot_map lives in the sessions table, not passed directly.
Fetch it: SELECT slot_map FROM sessions WHERE id = sessionId

---

## What You Are Doing

DeNovo Studio is running on port 4010.
The assemble route exists but has stub implementations.
You are replacing stubs with real implementations.

The Assembler is a 5-step background pipeline:
clone → substitute → inject → schema → outputting → done

---

## Step 0 — Delete Previous Bad Files

```bash
rm -rf src/lib/assembler
```

Then verify it's gone before writing anything new.

---

## Step 1 — Install Dependencies

```bash
npm install archiver glob minio
npm install --save-dev @types/archiver
```

---

## Step 2 — Find MinIO Credentials

```bash
docker inspect $(docker ps -q --filter "name=minio") 2>/dev/null \
  | grep -A2 -E "MINIO_ROOT_USER|MINIO_ROOT_PASSWORD"
```

Note the values. You'll need them for env vars.

---

## Step 3 — Add Env Vars

Add to `.env.local`:
```bash
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=<from step 2>
MINIO_SECRET_KEY=<from step 2>
MINIO_BUCKET=denovo-downloads
MINIO_USE_SSL=false

GITEA_BASE_URL=https://gitea.agyemanenterprises.com
GITEA_API_TOKEN=<fill in>
GITEA_TEMPLATES_ORG=denovo-templates
GITEA_APPS_ORG=denovo-apps

COOLIFY_BASE_URL=http://localhost:8000
COOLIFY_API_TOKEN=<fill in>
```

---

## Step 4 — Write Assembler Files

### `src/lib/assembler/types.ts`
```typescript
import type { SlotMap as FrontendSlotMap } from '@/types/denovo'
import type { JobStage, OutputType } from '@/types/database'

// Re-export the real SlotMap — single source of truth
export type { FrontendSlotMap as SlotMap }

export interface AssembleJob {
  id: string
  appId: string
  stage: JobStage
  progress: number
  log: string[]
  outputType: OutputType
  result?: JobResult
  error?: string
}

export interface JobResult {
  type: OutputType
  giteaUrl?: string        // matches frontend JobStatus.result.giteaUrl
  coolifyAppId?: string
  domain?: string
  downloadUrl?: string
}
```

---

### `src/lib/assembler/clone.ts`
```typescript
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'

const execAsync = promisify(exec)

// Maps TemplateType values to Gitea repo names
const TEMPLATE_REPO: Record<string, string> = {
  'marketplace':    'template-marketplace',
  'saas':           'template-saas',
  'directory':      'template-directory',
  'community':      'template-community',
  'ecommerce':      'template-ecommerce',
  'client-portal':  'template-client-portal',
  'internal-tool':  'template-internal-tool',
  'content-media':  'template-content-media',
}

export async function cloneTemplate(
  template: string,
  workdir: string
): Promise<void> {
  const repoName = TEMPLATE_REPO[template]
  if (!repoName) throw new Error(`Unknown template type: ${template}`)

  const base = process.env.GITEA_BASE_URL!
  const org = process.env.GITEA_TEMPLATES_ORG!
  const token = process.env.GITEA_API_TOKEN!

  // Embed token in URL for auth — never logged
  const urlObj = new URL(base)
  const cloneUrl = `${urlObj.protocol}//${token}@${urlObj.host}/${org}/${repoName}.git`

  await fs.mkdir(workdir, { recursive: true })
  await execAsync(`git clone --depth 1 "${cloneUrl}" "${workdir}"`)

  // Strip .git so assembled output is a clean fresh repo
  await fs.rm(`${workdir}/.git`, { recursive: true, force: true })
}
```

---

### `src/lib/assembler/substitute.ts`
```typescript
import fs from 'fs/promises'
import path from 'path'
import { glob } from 'glob'
import type { FrontendSlotMap as SlotMap } from '@/types/denovo'

export async function substituteTokens(
  workdir: string,
  slots: SlotMap
): Promise<number> {
  const files = await glob('**/*.{ts,tsx,css,json,md,sql,yaml,yml,txt}', {
    cwd: workdir,
    ignore: ['node_modules/**', '.next/**'],
  })

  for (const file of files) {
    const filepath = path.join(workdir, file)
    let content = await fs.readFile(filepath, 'utf8')
    let changed = false

    // Iterate over every key in the SlotMap
    for (const [key, value] of Object.entries(slots)) {
      if (value === undefined || value === null) continue
      const token = `{{${key}}}`
      if (!content.includes(token)) continue

      const replacement = Array.isArray(value)
        ? JSON.stringify(value)
        : String(value)

      content = content.replaceAll(token, replacement)
      changed = true
    }

    if (changed) await fs.writeFile(filepath, content)
  }

  return files.length
}
```

---

### `src/lib/assembler/inject.ts`
```typescript
import fs from 'fs/promises'
import path from 'path'

// Maps snippet name strings (as stored in SNIPPETS[]) to folder names
const SNIPPET_DIRS: Record<string, string> = {
  'auth':               'auth',
  'stripe-simple':      'stripe-simple',
  'stripe-connect':     'stripe-connect',
  'file-upload':        'file-upload',
  'admin-panel':        'admin-panel',
  'search-filter':      'search-filter',
  'output-delivery':    'output-delivery',
  'roles-permissions':  'roles-permissions',
  'notifications':      'notifications',
  'messaging':          'messaging',
  'reviews-ratings':    'reviews-ratings',
  'bookings':           'bookings',
  'blog-cms':           'blog-cms',
  'api-webhooks':       'api-webhooks',
  'email-transactional':'email-transactional',
}

const SNIPPETS_BASE = path.join(process.cwd(), 'snippets')

export async function injectSnippets(
  workdir: string,
  snippetNames: string[]   // these are strings like 'auth', 'stripe-simple'
): Promise<void> {
  for (const name of snippetNames) {
    const dir = SNIPPET_DIRS[name]
    if (!dir) {
      console.warn(`Unknown snippet: ${name} — skipping`)
      continue
    }

    const snippetPath = path.join(SNIPPETS_BASE, dir)

    try {
      await fs.access(snippetPath)
    } catch {
      console.warn(`Snippet folder not found: ${snippetPath} — skipping`)
      continue
    }

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
  if (extras.length === 0) return

  const migrations = await glob('supabase/migrations/*.sql', { cwd: workdir })
  if (migrations.length === 0) return

  const migrationPath = path.join(workdir, migrations[0])

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
- Fields ending in _count, _minutes, _days become int
- Boolean fields become boolean default false
- Everything else becomes text
- Format: ADD COLUMN IF NOT EXISTS {name} {type}
- Comma-separate each line
- No trailing semicolon`,
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
import type { FrontendSlotMap as SlotMap } from '@/types/denovo'

export async function generateEnvFile(
  workdir: string,
  slots: SlotMap
): Promise<void> {
  const hasConnect = slots.SNIPPETS.includes('stripe-connect')
  const hasEmail = slots.SNIPPETS.includes('email-transactional')

  const content = `# Generated by DeNovo
# App: ${slots.APP_NAME}
# Template: ${slots.TEMPLATE}
# Generated: ${new Date().toISOString()}

# ─── Supabase ───────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ─── Stripe ─────────────────────────────────────────────
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
${slots.TEMPLATE === 'marketplace' && slots.PLATFORM_FEE_PERCENT
  ? `STRIPE_PLATFORM_FEE_PERCENT=${slots.PLATFORM_FEE_PERCENT}`
  : '# STRIPE_[PLAN]_PRICE_ID= # Add your Stripe Price IDs'
}
${hasConnect ? '# Stripe Connect — uses same keys above' : ''}

# ─── App ────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME=${slots.APP_NAME}
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# ─── Email ──────────────────────────────────────────────
RESEND_API_KEY=
${hasEmail ? '# Transactional email — RESEND_API_KEY required' : ''}
`

  await fs.writeFile(path.join(workdir, '.env.example'), content)

  // Ensure .env.local is gitignored
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

### `src/lib/assembler/gitea.ts`
```typescript
export const giteaClient = {
  async createRepo(opts: {
    org: string
    name: string
    description: string
    private: boolean
  }) {
    const base = process.env.GITEA_BASE_URL!
    const token = process.env.GITEA_API_TOKEN!

    const res = await fetch(`${base}/api/v1/orgs/${opts.org}/repos`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: opts.name,
        description: opts.description,
        private: opts.private,
        auto_init: false,
      }),
    })

    if (!res.ok) {
      throw new Error(`Gitea createRepo failed: ${res.status} ${await res.text()}`)
    }

    const data = await res.json()
    return {
      id: data.id as number,
      name: data.name as string,
      cloneUrl: data.clone_url as string,
      htmlUrl: data.html_url as string,
    }
  },
}
```

---

### `src/lib/assembler/coolify.ts`
```typescript
export const coolifyClient = {
  async createApplication(opts: {
    name: string
    gitRepository: string
    gitBranch: string
    port: number
    domain: string
    environmentVariables: Record<string, string>
  }) {
    const base = process.env.COOLIFY_BASE_URL!
    const token = process.env.COOLIFY_API_TOKEN!

    const res = await fetch(`${base}/api/v1/applications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: opts.name,
        git_repository: opts.gitRepository,
        git_branch: opts.gitBranch,
        build_pack: 'nixpacks',
        ports_exposes: String(opts.port),
        fqdn: opts.domain,
        environment_variables: Object.entries(opts.environmentVariables)
          .map(([key, value]) => ({ key, value })),
      }),
    })

    if (!res.ok) {
      throw new Error(`Coolify createApplication failed: ${res.status} ${await res.text()}`)
    }

    const data = await res.json()
    return { id: data.uuid as string }
  },

  async deploy(appId: string) {
    const base = process.env.COOLIFY_BASE_URL!
    const token = process.env.COOLIFY_API_TOKEN!

    const res = await fetch(`${base}/api/v1/applications/${appId}/deploy`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      throw new Error(`Coolify deploy failed: ${res.status} ${await res.text()}`)
    }
  },
}
```

---

### `src/lib/assembler/deploy.ts`
```typescript
import { giteaClient } from './gitea'
import { coolifyClient } from './coolify'
import { exec } from 'child_process'
import { promisify } from 'util'
import type { FrontendSlotMap as SlotMap } from '@/types/denovo'
import type { JobResult } from './types'

const execAsync = promisify(exec)

export async function deployToGitea(
  workdir: string,
  slots: SlotMap,
  appId: string
): Promise<JobResult> {
  // Slug from APP_NAME — lowercase, hyphens
  const slug = slots.APP_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const repo = await giteaClient.createRepo({
    org: process.env.GITEA_APPS_ORG!,
    name: slug,
    description: `Generated by DeNovo — ${slots.APP_NAME}`,
    private: true,
  })

  // Push assembled code to Gitea
  const token = process.env.GITEA_API_TOKEN!
  await execAsync(`git init`, { cwd: workdir })
  await execAsync(`git add .`, { cwd: workdir })
  await execAsync(`git commit -m "feat: initial scaffold — ${slots.APP_NAME}"`, { cwd: workdir })
  await execAsync(`git remote add origin "${repo.cloneUrl}"`, { cwd: workdir })
  await execAsync(`git push -u origin main`, {
    cwd: workdir,
    env: { ...process.env, GIT_ASKPASS: 'echo', GIT_USERNAME: 'denovo', GIT_PASSWORD: token },
  })

  // Create + trigger Coolify deployment
  const app = await coolifyClient.createApplication({
    name: slots.APP_NAME,
    gitRepository: repo.cloneUrl,
    gitBranch: 'main',
    port: 3000,
    domain: `https://${slug}.yourdomain.com`,
    environmentVariables: {
      NEXT_PUBLIC_APP_NAME: slots.APP_NAME,
      NEXT_PUBLIC_APP_URL: `https://${slug}.yourdomain.com`,
    },
  })

  await coolifyClient.deploy(app.id)

  return {
    type: 'deploy',
    giteaUrl: repo.htmlUrl,       // matches frontend JobStatus.result.giteaUrl
    coolifyAppId: app.id,
    domain: `${slug}.yourdomain.com`,
  }
}
```

---

### `src/lib/assembler/download.ts`
```typescript
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'
import * as Minio from 'minio'
import type { FrontendSlotMap as SlotMap } from '@/types/denovo'
import type { JobResult } from './types'

function getMinioClient() {
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: parseInt(process.env.MINIO_PORT ?? '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  })
}

const BUCKET = () => process.env.MINIO_BUCKET ?? 'denovo-downloads'

export async function packageDownload(
  workdir: string,
  slots: SlotMap
): Promise<JobResult> {
  const client = getMinioClient()
  const bucket = BUCKET()

  // Ensure bucket exists
  const exists = await client.bucketExists(bucket)
  if (!exists) await client.makeBucket(bucket)

  const slug = slots.APP_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const filename = `${slug}-${Date.now()}.zip`
  const zipPath = path.join('/tmp', filename)

  // Create zip archive
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })
    output.on('close', resolve)
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(workdir, slug)
    archive.finalize()
  })

  // Upload to MinIO
  await client.fPutObject(bucket, filename, zipPath, {
    'Content-Type': 'application/zip',
  })

  // Presigned URL — 1 hour
  const downloadUrl = await client.presignedGetObject(bucket, filename, 3600)

  // Clean up local zip
  fs.unlinkSync(zipPath)

  return {
    type: 'download',
    downloadUrl,
  }
}
```

---

### `src/lib/assembler/index.ts`
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database, JobStage } from '@/types/database'
import type { FrontendSlotMap as SlotMap } from '@/types/denovo'
import { cloneTemplate } from './clone'
import { substituteTokens } from './substitute'
import { injectSnippets } from './inject'
import { generateSchemaExtras } from './schema'
import { generateEnvFile } from './env'
import { deployToGitea } from './deploy'
import { packageDownload } from './download'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'

const supabase = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

// Safe log append — reads current log, appends, writes back
// Does NOT use RPC (append_job_log doesn't exist in this schema)
async function appendLog(jobId: string, entry: string): Promise<void> {
  const db = supabase()
  const { data } = await db
    .from('assemble_jobs')
    .select('log')
    .eq('id', jobId)
    .single()

  const current = data?.log ?? []
  await db
    .from('assemble_jobs')
    .update({ log: [...current, entry], updated_at: new Date().toISOString() })
    .eq('id', jobId)
}

async function setStage(
  jobId: string,
  stage: JobStage,
  progress: number,
  logEntry?: string
): Promise<void> {
  const db = supabase()

  await db
    .from('assemble_jobs')
    .update({ stage, progress, updated_at: new Date().toISOString() })
    .eq('id', jobId)

  if (logEntry) await appendLog(jobId, logEntry)
}

export async function runAssembly(
  jobId: string,
  appId: string,
  slots: SlotMap,
  outputType: 'deploy' | 'download'
): Promise<void> {
  const workdir = path.join('/tmp/denovo', randomUUID())
  const db = supabase()

  try {
    // Step 1: Clone
    await setStage(jobId, 'cloning', 10, '→ Cloning template...')
    await cloneTemplate(slots.TEMPLATE, workdir)
    await appendLog(jobId, `✓ Template cloned: ${slots.TEMPLATE}`)

    // Step 2: Token substitution
    await setStage(jobId, 'substituting', 25, '→ Substituting tokens...')
    const fileCount = await substituteTokens(workdir, slots)
    await appendLog(jobId, `✓ Substituted tokens across ${fileCount} files`)

    // Step 3: Snippet injection
    await setStage(jobId, 'injecting', 45, '→ Injecting snippets...')
    await injectSnippets(workdir, slots.SNIPPETS)
    await appendLog(jobId, `✓ Injected snippets: [${slots.SNIPPETS.join(', ')}]`)

    // Step 4: Schema extras
    await setStage(jobId, 'schema', 60, '→ Generating schema extras...')
    await generateSchemaExtras(workdir, slots.SCHEMA_EXTRAS)
    await appendLog(jobId, '✓ Schema extras applied')

    // Step 5: Env file (no separate stage — runs during outputting)
    await generateEnvFile(workdir, slots)

    // Step 6: Output
    await setStage(
      jobId,
      'outputting',
      80,
      outputType === 'deploy' ? '→ Deploying to infrastructure...' : '→ Packaging zip...'
    )

    let result
    if (outputType === 'deploy') {
      result = await deployToGitea(workdir, slots, appId)
      await appendLog(jobId, `✓ Deployed → ${result.domain}`)
    } else {
      result = await packageDownload(workdir, slots)
      await appendLog(jobId, '✓ Download package ready')
    }

    // Done — write result to job AND update app record
    await db
      .from('assemble_jobs')
      .update({
        stage: 'done',
        progress: 100,
        result,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    await db
      .from('apps')
      .update({
        status: outputType === 'deploy' ? 'deploying' : 'downloaded',
        ...(result.type === 'deploy'
          ? {
              gitea_repo_url: result.giteaUrl ?? null,
              coolify_app_id: result.coolifyAppId ?? null,
              coolify_domain: result.domain ?? null,
            }
          : {
              download_url: result.downloadUrl ?? null,
              download_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', appId)

  } catch (error) {
    await db
      .from('assemble_jobs')
      .update({
        stage: 'error',
        error: String(error),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    await db
      .from('apps')
      .update({ status: 'failed', error_message: String(error) })
      .eq('id', appId)

  } finally {
    await fs.rm(workdir, { recursive: true, force: true })
  }
}
```

---

### `src/app/api/denovo/assemble/route.ts`

Read the existing file first. Preserve its auth pattern and Supabase client setup.
Only replace the stub body with the real implementation below.

```typescript
import { createServerSupabase } from '@/lib/supabase/server'  // use whatever exists
import { NextResponse } from 'next/server'
import { runAssembly } from '@/lib/assembler'
import type { AssembleRequest } from '@/types/denovo'
import type { Database } from '@/types/database'

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: AssembleRequest = await request.json()
  const { sessionId, appId, outputType } = body

  // Fetch SlotMap from sessions table — do NOT expect it passed in the request
  const { data: session } = await supabase
    .from('sessions')
    .select('slot_map')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session?.slot_map) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Check credits
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('credits_remaining')
    .eq('user_id', user.id)
    .single()

  if (!sub || sub.credits_remaining < 1) {
    return NextResponse.json({ error: 'INSUFFICIENT_CREDITS' }, { status: 402 })
  }

  // Deduct credit
  await supabase
    .from('subscriptions')
    .update({ credits_remaining: sub.credits_remaining - 1 })
    .eq('user_id', user.id)

  // Create job — note: no user_id on assemble_jobs table
  const serviceClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: job, error: jobError } = await serviceClient
    .from('assemble_jobs')
    .insert({
      app_id: appId,
      stage: 'cloning',    // first real stage — 'queued' doesn't exist
      progress: 0,
    })
    .select()
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }

  // Update app status
  await supabase
    .from('apps')
    .update({ status: 'assembling', output_type: outputType })
    .eq('id', appId)

  // Fire and forget — runs in background
  runAssembly(job.id, appId, session.slot_map as any, outputType).catch(console.error)

  return NextResponse.json({
    jobId: job.id,
    estimatedSeconds: outputType === 'deploy' ? 45 : 15,
  })
}
```

⚠️ Read the existing route file before writing this — match its exact import for the Supabase server client. If it uses `createServerSupabase`, keep that. If it uses `createClient`, keep that. Do not guess.

---

### `src/app/api/denovo/assemble/[jobId]/route.ts`

Read the existing file first. Only replace the stub body.

```typescript
import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // assemble_jobs has no user_id — verify ownership via apps table
  const { data: job } = await supabase
    .from('assemble_jobs')
    .select('*, apps!inner(user_id)')
    .eq('id', jobId)
    .eq('apps.user_id', user.id)
    .single()

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(job)
}
```

---

## Step 5 — Build

```bash
npm run build
```

Fix every TypeScript error before moving on. Zero errors required.

Common issues:
- `import * as Minio from 'minio'` — not default import
- `glob` v10 uses named export: `import { glob } from 'glob'`
- Next.js 15: `params` in route handlers must be awaited
- Check the actual Supabase client factory name in `src/lib/supabase/server.ts`
  and use that exact name — do not assume `createServerSupabase`

---

## Step 6 — Runtime Verification

After build passes, verify the pipeline actually runs:

```bash
# 1. Confirm MinIO is reachable
node -e "
const Minio = require('minio');
const c = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});
c.bucketExists('denovo-downloads').then(e => console.log('MinIO OK, bucket exists:', e)).catch(console.error);
"

# 2. Confirm Gitea is reachable
curl -s -H "Authorization: token $GITEA_API_TOKEN" \
  $GITEA_BASE_URL/api/v1/version | grep version

# 3. Confirm assemble_jobs table exists
curl -s \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "https://jomualvckaudlcqrfvxv.supabase.co/rest/v1/assemble_jobs?limit=1"
```

All three must return successful responses before you stop.

---

## Step 7 — Add Env Vars to Coolify

After confirming everything works locally, add all MINIO_* vars to the
DeNovo app in Coolify and trigger a redeploy.

---

## Graceful Degradation Rules

- Gitea not configured → fall back to download, log the reason
- Coolify not configured → create Gitea repo, return partial result with giteaUrl only
- Snippet folder missing → log warning, skip, continue
- SCHEMA_EXTRAS empty → skip the AI call entirely
- Never crash the pipeline — always catch, set stage to 'error', log the message

---

## What You Are NOT Doing

- ❌ Cloudflare, DNS, tunnels, Traefik
- ❌ Building templates or snippets
- ❌ Changing DeNovo port from 4010
- ❌ Calling supabase.rpc() — the function doesn't exist

---

## When Done — Report Exactly

1. ✅/❌ Existing files read before any writing began
2. ✅/❌ All 11 assembler files written with correct types
3. ✅/❌ MinIO reachable + bucket confirmed
4. ✅/❌ Gitea API responding
5. ✅/❌ assemble_jobs table confirmed in Supabase
6. ✅/❌ `npm run build` — zero errors
7. ✅/❌ Runtime verification — all 3 curl/node checks passed
8. List any env vars still needing real values

Then stop.
