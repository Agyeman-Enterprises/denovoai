import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params
  const admin = serviceClient()

  const { data } = await admin
    .schema('denovo')
    .from('runs')
    .select('id, status, phase, phase_label, app_name, primary_color, deploy_url, error, updated_at')
    .eq('id', runId)
    .single()

  if (!data) {
    return NextResponse.json({ status: 'pending', phase: 'queued', phaseLabel: 'Waiting to start...' })
  }

  return NextResponse.json({
    id: data.id,
    status: data.status,
    phase: data.phase,
    phaseLabel: data.phase_label,
    appName: data.app_name,
    primaryColor: data.primary_color,
    deployUrl: data.deploy_url ?? null,
    error: data.error ?? null,
    updatedAt: data.updated_at,
  })
}
