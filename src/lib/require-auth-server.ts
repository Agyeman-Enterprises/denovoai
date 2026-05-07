import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface RequireAuthServerOptions {
  /** Route to redirect unauthenticated users. Default: /auth/login */
  redirectTo?: string
}

/**
 * Server-side auth guard for Next.js App Router layouts and pages.
 * Call at the top of a Server Component layout to protect all nested routes.
 * Returns the authenticated user object.
 *
 * @example — in app/(protected)/layout.tsx:
 *   import { requireAuthServer } from '@/lib/require-auth-server'
 *   export default async function ProtectedLayout({ children }) {
 *     const user = await requireAuthServer()
 *     return <>{children}</>
 *   }
 */
export async function requireAuthServer({ redirectTo = '/auth/login' }: RequireAuthServerOptions = {}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect(redirectTo)
  }

  return user
}
