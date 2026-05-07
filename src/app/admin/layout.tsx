import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth check
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/auth/login')

  // Server-side role check
  const admin = createServiceClient()
  const { data: role } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .is('org_id', null)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .maybeSingle()

  if (!role) redirect('/')

  return <AdminShell>{children}</AdminShell>
}
