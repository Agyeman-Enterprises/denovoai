import { redirect } from 'next/navigation'
import { getSessionUser, type SessionUser } from '@/lib/session'

interface RequireAuthServerOptions {
  /** Route to redirect unauthenticated users. Default: /auth/login */
  redirectTo?: string
}

/**
 * Server-side auth guard for Next.js App Router layouts and pages.
 * Call at the top of a Server Component layout to protect nested routes.
 * Returns the authenticated user (OIDC sub + email).
 *
 * Note: the middleware (proxy.ts) already verifies the session token's
 * signature on every protected request, so here we only read the claims.
 *
 * @example — in app/(protected)/layout.tsx:
 *   const user = await requireAuthServer()
 */
export async function requireAuthServer(
  { redirectTo = '/auth/login' }: RequireAuthServerOptions = {},
): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect(redirectTo)
  return user
}
