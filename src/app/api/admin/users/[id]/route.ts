import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const admin = createServiceClient()
  const { data: role } = await admin
    .from('user_roles').select('role').eq('user_id', user.id).is('org_id', null)
    .in('role', ['owner', 'admin']).limit(1).maybeSingle()
  return role ? admin : null
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 403 })

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({})) as {
    ban_duration?: string
    email?: string
    user_metadata?: Record<string, unknown>
  }

  const { data, error } = await admin.auth.admin.updateUserById(id, {
    ...(body.ban_duration ? { ban_duration: body.ban_duration } : {}),
    ...(body.email ? { email: body.email } : {}),
    ...(body.user_metadata ? { user_metadata: body.user_metadata } : {}),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user: data.user })
}
