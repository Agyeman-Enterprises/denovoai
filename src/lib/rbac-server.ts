import { redirect } from 'next/navigation'
import { userRoles } from '@/lib/db'
import { getSessionUser } from '@/lib/session'

export type AppRole = 'owner' | 'admin' | 'member' | 'viewer'

const ROLE_HIERARCHY: Record<AppRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
}

/** Returns the user's highest role for the given org (or global if orgId omitted). */
export async function getUserRole(userId: string, orgId?: string): Promise<AppRole | null> {
  const rows = await userRoles.forUser(userId)
  const scoped = rows.filter((r) => (orgId ? r.org_id === orgId : r.org_id === null))
  if (!scoped.length) return null
  return scoped.reduce<AppRole>(
    (best, row) => (ROLE_HIERARCHY[row.role] > ROLE_HIERARCHY[best] ? row.role : best),
    'viewer',
  )
}

/** True if `role` meets or exceeds `minimum`. */
export function hasRole(role: AppRole | null, minimum: AppRole): boolean {
  if (!role) return false
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum]
}

/**
 * Server-side role guard. Redirects if the user lacks the required role.
 * Use in Server Component layouts or pages.
 */
export async function requireRole(
  minimum: AppRole,
  options: { orgId?: string; redirectTo?: string } = {},
): Promise<{ userId: string; role: AppRole }> {
  const { orgId, redirectTo = '/' } = options
  const user = await getSessionUser()
  if (!user) redirect('/auth/login')

  const role = await getUserRole(user.id, orgId)
  if (!hasRole(role, minimum)) redirect(redirectTo)

  return { userId: user.id, role: role! }
}
