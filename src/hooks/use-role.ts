'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AppRole } from '@/lib/rbac-server'

interface UseRoleResult {
  role: AppRole | null
  loading: boolean
  isOwner: boolean
  isAdmin: boolean
  isMember: boolean
  isViewer: boolean
  hasRole: (minimum: AppRole) => boolean
}

const ROLE_HIERARCHY: Record<AppRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
}

/**
 * Client-side hook to get the current user's role.
 *
 * @example
 *   const { isAdmin } = useRole()
 *   const { role } = useRole({ orgId: org.id })
 */
export function useRole(options: { orgId?: string } = {}): UseRoleResult {
  const { orgId } = options
  const [role, setRole] = useState<AppRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchRole() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) { setRole(null); setLoading(false) }
        return
      }

      let query = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      if (orgId) {
        query = query.eq('org_id', orgId) as typeof query
      } else {
        query = query.is('org_id', null) as typeof query
      }

      const { data } = await query

      if (cancelled) return

      if (!data?.length) {
        setRole(null)
      } else {
        const best = data.reduce<AppRole>((acc, row) => {
          const r = row.role as AppRole
          return ROLE_HIERARCHY[r] > ROLE_HIERARCHY[acc] ? r : acc
        }, 'viewer')
        setRole(best)
      }
      setLoading(false)
    }

    fetchRole()
    return () => { cancelled = true }
  }, [orgId])

  const hasRoleFn = (minimum: AppRole) =>
    role !== null && ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum]

  return {
    role,
    loading,
    isOwner: role === 'owner',
    isAdmin: hasRoleFn('admin'),
    isMember: hasRoleFn('member'),
    isViewer: hasRoleFn('viewer'),
    hasRole: hasRoleFn,
  }
}
