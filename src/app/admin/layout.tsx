import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/session'
import { userRoles } from '@/lib/db'
import { AdminShell } from '@/components/admin-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/auth/login')

  const isAdmin = await userRoles.isGlobalAdmin(user.id)
  if (!isAdmin) redirect('/')

  return <AdminShell>{children}</AdminShell>
}
