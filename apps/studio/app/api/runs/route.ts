import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import fs from 'node:fs'
import path from 'node:path'
import type { Database } from '@/types/database.types'

const FREE_RUN_LIMIT = 3

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getUserClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  )
}

async function updateRunStatus(runId: string, patch: Record<string, unknown>) {
  const admin = serviceClient()
  await admin
    .schema('denovo')
    .from('runs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', runId)
}

function writeScaffold(workspaceDir: string, spec: Record<string, string>) {
  // package.json
  fs.writeFileSync(path.join(workspaceDir, 'package.json'), JSON.stringify({
    name: 'denovo-generated-app',
    version: '0.1.0',
    private: true,
    scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
    dependencies: {
      next: '14.2.5',
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      '@supabase/supabase-js': '^2.45.4',
      '@supabase/ssr': '^0.5.1',
      'lucide-react': '^0.460.0',
      clsx: '^2.1.1',
      'tailwind-merge': '^2.5.4',
    },
    devDependencies: {
      '@types/node': '^22',
      '@types/react': '^18',
      '@types/react-dom': '^18',
      autoprefixer: '^10.4.20',
      postcss: '^8.4.47',
      tailwindcss: '^3.4.14',
      typescript: '^5',
    },
  }, null, 2))

  // next.config.js
  fs.writeFileSync(path.join(workspaceDir, 'next.config.js'),
    `/** @type {import('next').NextConfig} */\nconst nextConfig = { reactStrictMode: true }\nmodule.exports = nextConfig\n`)

  // tsconfig.json
  fs.writeFileSync(path.join(workspaceDir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2021', lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true, skipLibCheck: true, strict: false, noEmit: true,
      esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler',
      resolveJsonModule: true, isolatedModules: true, jsx: 'preserve', incremental: true,
      plugins: [{ name: 'next' }], paths: { '@/*': ['./*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
    exclude: ['node_modules'],
  }, null, 2))

  // postcss.config.js
  fs.writeFileSync(path.join(workspaceDir, 'postcss.config.js'),
    `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }\n`)

  // tailwind.config.ts
  fs.writeFileSync(path.join(workspaceDir, 'tailwind.config.ts'),
    `import type { Config } from 'tailwindcss'\nconst config: Config = {\n  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],\n  plugins: [],\n}\nexport default config\n`)

  // app/globals.css
  const appDir = path.join(workspaceDir, 'app')
  fs.mkdirSync(appDir, { recursive: true })
  fs.writeFileSync(path.join(appDir, 'globals.css'),
    `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n:root {\n  --primary: ${spec.primaryColor || '#6366f1'};\n  --primary-fg: ${spec.primaryFg || '#ffffff'};\n  --secondary: ${spec.secondaryColor || '#e0e7ff'};\n  --accent: ${spec.accentColor || '#818cf8'};\n  --sidebar-bg: ${spec.sidebarBg || '#f8fafc'};\n  --border: #e2e8f0;\n  --background: #ffffff;\n}\n* { box-sizing: border-box; }\nbody { font-family: 'Inter', system-ui, sans-serif; background: var(--background); color: #0f172a; -webkit-font-smoothing: antialiased; }\n`)

  // app/layout.tsx
  fs.writeFileSync(path.join(appDir, 'layout.tsx'),
    `import type { Metadata } from 'next'\nimport './globals.css'\nexport const metadata: Metadata = { title: '${spec.displayName || 'App'}', description: '${spec.tagline || 'Built with DeNovo'}' }\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (<html lang="en"><body>{children}</body></html>)\n}\n`)

  // lib/supabase/client.ts
  const libSupabaseDir = path.join(workspaceDir, 'lib', 'supabase')
  fs.mkdirSync(libSupabaseDir, { recursive: true })
  fs.writeFileSync(path.join(libSupabaseDir, 'client.ts'),
    `import { createBrowserClient } from '@supabase/ssr'\nexport function createClient() {\n  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)\n}\n`)

  // lib/utils.ts
  fs.writeFileSync(path.join(workspaceDir, 'lib', 'utils.ts'),
    `import { type ClassValue, clsx } from 'clsx'\nimport { twMerge } from 'tailwind-merge'\nexport function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }\n`)

  // .env.local with brand vars (Vercel will inject Supabase/Stripe keys at deploy time)
  const envLines = [
    `NEXT_PUBLIC_APP_NAME="${spec.displayName || 'App'}"`,
    `NEXT_PUBLIC_PRIMARY_COLOR="${spec.primaryColor || '#6366f1'}"`,
    `NEXT_PUBLIC_PRIMARY_FG="${spec.primaryFg || '#ffffff'}"`,
    `NEXT_PUBLIC_SECONDARY_COLOR="${spec.secondaryColor || '#e0e7ff'}"`,
    `NEXT_PUBLIC_ACCENT_COLOR="${spec.accentColor || '#818cf8'}"`,
    `NEXT_PUBLIC_SIDEBAR_BG="${spec.sidebarBg || '#f8fafc'}"`,
    `NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
    `APP_MAIN_TABLE=${spec.mainTable || 'items'}`,
  ]
  fs.writeFileSync(path.join(workspaceDir, '.env.local'), envLines.join('\n'))
}

async function runPipeline(runId: string, prompt: string) {
  const workspaceDir = `/tmp/denovo-${runId}`
  try {
    await updateRunStatus(runId, { phase: 'intent', phase_label: 'Analyzing your idea...' })
    const { interpretPrompt } = await import('@/../../services/prompt-engine/index.js')
    const intent = await interpretPrompt(prompt)
    const productSpec = intent.productSpec

    await updateRunStatus(runId, {
      phase: 'codegen',
      phase_label: 'Generating screens with AI...',
      app_name: productSpec.displayName,
      primary_color: productSpec.primaryColor,
    })

    // Write base Next.js project scaffold before generating screens
    fs.mkdirSync(workspaceDir, { recursive: true })
    writeScaffold(workspaceDir, productSpec)

    const { generateAllScreens } = await import('@/../../services/code-generator/index.js')
    await generateAllScreens(workspaceDir, productSpec)

    await updateRunStatus(runId, { phase: 'deploy', phase_label: 'Deploying to Vercel...' })

    const { deployToVercel } = await import('@/../../services/deployer/vercel.js')
    const deployResult = await deployToVercel(workspaceDir, productSpec)

    await updateRunStatus(runId, {
      status: deployResult.deployed ? 'complete' : 'built',
      phase: 'complete',
      phase_label: deployResult.url ? 'Live! 🎉' : 'Built',
      deploy_url: deployResult.url ?? null,
      completed_at: new Date().toISOString(),
    })
  } catch (err) {
    await updateRunStatus(runId, {
      status: 'error',
      phase: 'error',
      phase_label: 'Build failed',
      error: err instanceof Error ? err.message : String(err),
    })
  } finally {
    // Clean up ephemeral workspace from /tmp
    try { fs.rmSync(workspaceDir, { recursive: true, force: true }) } catch {}
  }
}

// GET /api/runs
export async function GET() {
  const supabase = await getUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ runs: [] })

  const { data } = await supabase
    .schema('denovo')
    .from('runs')
    .select('id, prompt, mode, status, phase, phase_label, app_name, primary_color, deploy_url, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ runs: data ?? [] })
}

// POST /api/runs
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const prompt = String(body?.prompt ?? '').trim()
  if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 })

  const supabase = await getUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const month = new Date().toISOString().slice(0, 7)
  const { data: subData } = await supabase.schema('denovo').from('subscriptions').select('plan').eq('user_id', user.id).single()
  const plan = subData?.plan ?? 'free'

  if (plan === 'free') {
    const { data: countData } = await supabase.schema('denovo').from('run_counts').select('count').eq('user_id', user.id).eq('month', month).single()
    if ((countData?.count ?? 0) >= FREE_RUN_LIMIT) {
      return NextResponse.json({ error: 'run_limit_reached', limit: FREE_RUN_LIMIT }, { status: 402 })
    }
  }

  const runId = `run-${Date.now()}`

  const { data: run, error } = await supabase
    .schema('denovo')
    .from('runs')
    .insert({ id: runId, user_id: user.id, prompt, mode: 'auto', status: 'running' })
    .select('id, prompt, mode, status, created_at')
    .single()

  if (error || !run) return NextResponse.json({ error: 'Failed to create run' }, { status: 500 })

  await supabase.schema('denovo').from('run_counts').upsert(
    { user_id: user.id, month, count: 1 },
    { onConflict: 'user_id,month', ignoreDuplicates: false },
  )

  waitUntil(runPipeline(runId, prompt))

  return NextResponse.json({
    id: run.id,
    prompt: run.prompt,
    status: 'running',
    phase: 'intent',
    phase_label: 'Analyzing your idea...',
    createdAt: run.created_at,
  })
}
