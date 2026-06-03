'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const orange = "#F5530A";
const bg = "#08080D";
const sidebarBg = "#0A0A12";
const border = "rgba(255,255,255,0.07)";
const muted = "rgba(255,255,255,0.4)";

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/access', label: 'Access' },
  { href: '/admin/billing', label: 'Billing' },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/support', label: 'Support' },
  { href: '/admin/notifications', label: 'Notifications' },
  { href: '/admin/audit-log', label: 'Audit Log' },
  { href: '/admin/sessions', label: 'Sessions' },
  { href: '/admin/flags', label: 'Feature Flags' },
  { href: '/admin/jobs', label: 'Jobs' },
  { href: '/admin/webhooks', label: 'Webhooks' },
  { href: '/admin/errors', label: 'Errors' },
  { href: '/admin/health', label: 'Health' },
  { href: '/admin/env', label: 'Env Check' },
  { href: '/admin/settings', label: 'Settings' },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ display: "flex", minHeight: "100svh", background: bg, color: "#fff" }}>
      {/* Sidebar */}
      <nav style={{ width: 220, borderRight: `1px solid ${border}`, background: sidebarBg, display: "flex", flexDirection: "column", padding: "20px 12px", gap: 2, flexShrink: 0, position: "sticky", top: 0, height: "100svh", overflowY: "auto" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", padding: "4px 10px", marginBottom: 16 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 8, fontWeight: 800, color: "#fff" }}>AE</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>AE Studio</span>
        </Link>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", padding: "0 10px", marginBottom: 8 }}>Admin</p>
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href} style={{
            padding: "7px 10px", borderRadius: 8, fontSize: 13, textDecoration: "none", transition: "all 0.15s",
            background: pathname === item.href ? "rgba(245,83,10,0.1)" : "transparent",
            color: pathname === item.href ? orange : muted,
            fontWeight: pathname === item.href ? 600 : 400,
            borderLeft: pathname === item.href ? `2px solid ${orange}` : "2px solid transparent",
          }}>
            {item.label}
          </Link>
        ))}
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${border}` }}>
          <Link href="/dashboard" style={{ display: "block", padding: "7px 10px", fontSize: 13, color: muted, textDecoration: "none" }} data-testid="nav-dashboard">← Back to Dashboard</Link>
        </div>
      </nav>

      {/* Content */}
      <main style={{ flex: 1, overflow: "auto", padding: "clamp(24px,4vw,40px) clamp(20px,4vw,48px)" }}>
        {children}
      </main>
    </div>
  )
}
