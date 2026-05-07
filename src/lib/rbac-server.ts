import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AppRole = 'owner' | 'admin' | 'member' | 'viewer'

const ROLE_HIERARCHY: Record<AppRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
}

/** Returns the authenticated user's highest role for the given org (or global). */
export async function getUserRole(userId: string, orgId?: string): Promise<AppRole | null> {
  const supabase = await createClient()
  let query = supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  if (orgId) {
    query = query.eq('org_id', orgId)
  } else {
    query = query.is('org_id', null)
  }

  const { data } = await query

  if (!data?.length) return null

  // Return the highest-ranked role
  return data.reduce<AppRole>((best, row) => {
    const r = row.role as AppRole
    return ROLE_HIERARCHY[r] > ROLE_HIERARCHY[best] ? r : best
  }, 'viewer')
}

/** True if `role` meets or exceeds `minimum`. */
export function hasRole(role: AppRole | null, minimum: AppRole): boolean {
  if (!role) return false
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum]
}

/**
 * Server-side role guard. Redirects if user lacks the required role.
 * Use in Server Component layouts or pages.
 *
 * @example — require admin in app/(admin)/layout.tsx:
 *   const { user, role } = await requireRole('admin')
 */
export async function requireRole(
  minimum: AppRole,
  options: { orgId?: string; redirectTo?: string } = {}
): Promise<{ userId: string; role: AppRole }> {
  const { orgId, redirectTo = '/' } = options
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) redirect('/auth/login')

  const role = await getUserRole(user.id, orgId)

  if (!hasRole(role, minimum)) redirect(redirectTo)

  return { userId: user.id, role: role! }
}
