'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface RequireAuthProps {
  /** Route to redirect unauthenticated users. Default: /auth/login */
  redirectTo?: string
  children: React.ReactNode
  /** Fallback UI shown while checking session */
  fallback?: React.ReactNode
}

/**
 * Client-side route guard. Redirects to `redirectTo` if there is no active
 * session (checked via /api/auth/me). For server-side protection prefer the
 * middleware + `requireAuthServer` layout pattern.
 */
export function RequireAuth({
  redirectTo = '/auth/login',
  children,
  fallback = null,
}: RequireAuthProps) {
  const [checked, setChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { user: unknown | null }) => {
        if (cancelled) return
        if (d.user) {
          setAuthenticated(true)
        } else {
          router.replace(redirectTo)
        }
        setChecked(true)
      })
      .catch(() => {
        if (cancelled) return
        router.replace(redirectTo)
        setChecked(true)
      })
    return () => { cancelled = true }
  }, [router, redirectTo])

  if (!checked || !authenticated) return <>{fallback}</>
  return <>{children}</>
}
