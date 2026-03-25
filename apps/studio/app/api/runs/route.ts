import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
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

async function runPipeline(runId: string, prompt: string) {
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

    const { generateAllScreens } = await import('@/../../services/code-generator/index.js')
    const workspaceDir = `/tmp/denovo-${runId}`
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
  }
}

// GET /api/runs
export async function GET() {
  const supabase = await getUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ runs: [] }, { status: 401 })

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
