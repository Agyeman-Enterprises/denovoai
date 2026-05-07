'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/access', label: 'Access' },
  { href: '/admin/billing', label: 'Billing' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/support', label: 'Support' },
  { href: '/admin/notifications', label: 'Notifications' },
  { href: '/admin/audit-log', label: 'Audit log' },
  { href: '/admin/sessions', label: 'Sessions' },
  { href: '/admin/flags', label: 'Feature flags' },
  { href: '/admin/jobs', label: 'Jobs' },
  { href: '/admin/webhooks', label: 'Webhooks' },
  { href: '/admin/errors', label: 'Errors' },
  { href: '/admin/health', label: 'Health' },
  { href: '/admin/env', label: 'Env check' },
  { href: '/admin/settings', label: 'Settings' },
]

interface AdminShellProps {
  children: React.ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      <nav className="w-56 border-r bg-muted/30 flex flex-col p-4 gap-1 shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Admin
        </p>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
              pathname === item.href
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}
