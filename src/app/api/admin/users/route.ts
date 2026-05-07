import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data: role } = await admin
    .from('user_roles').select('role').eq('user_id', user.id).is('org_id', null)
    .in('role', ['owner', 'admin']).limit(1).maybeSingle()
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') ?? '1')
  const perPage = Math.min(Number(searchParams.get('per_page') ?? '50'), 100)

  const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ users: data.users, total: data.total })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data: role } = await admin
    .from('user_roles').select('role').eq('user_id', user.id).is('org_id', null)
    .in('role', ['owner', 'admin']).limit(1).maybeSingle()
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({})) as { email?: string; password?: string }
  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user: data.user }, { status: 201 })
}
