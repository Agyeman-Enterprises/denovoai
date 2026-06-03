'use client'

import { useEffect, useState } from 'react'
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
 * Client-side hook for the current user's global role (via /api/auth/me).
 *
 * @example
 *   const { isAdmin } = useRole()
 */
export function useRole(): UseRoleResult {
  const [role, setRole] = useState<AppRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { user: { role: AppRole | null } | null }) => {
        if (cancelled) return
        setRole(d.user?.role ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setRole(null)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

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
