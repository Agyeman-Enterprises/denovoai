import { requireAuthServer } from '@/lib/require-auth-server'

/**
 * Protected route group layout.
 * All routes nested inside (protected)/ require authentication.
 * Unauthenticated users are redirected to /auth/login.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuthServer()
  return <>{children}</>
}
