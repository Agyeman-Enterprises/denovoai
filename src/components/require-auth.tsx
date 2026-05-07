'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface RequireAuthProps {
  /** Route to redirect unauthenticated users. Default: /auth/login */
  redirectTo?: string
  children: React.ReactNode
  /** Fallback UI shown while checking session */
  fallback?: React.ReactNode
}

/**
 * Client-side route guard. Redirects to `redirectTo` if no active session.
 * Use in pages that need client-side protection (e.g., inside client components).
 * For server-side protection, use the server layout guard pattern instead.
 *
 * @example
 * export default function DashboardPage() {
 *   return <RequireAuth><Dashboard /></RequireAuth>
 * }
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
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace(redirectTo)
      } else {
        setAuthenticated(true)
      }
      setChecked(true)
    }
    check()
  }, [router, redirectTo])

  if (!checked || !authenticated) return <>{fallback}</>
  return <>{children}</>
}
