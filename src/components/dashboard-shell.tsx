"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const orange = "#F5530A";
const border = "rgba(255,255,255,0.07)";
const muted = "rgba(255,255,255,0.4)";

/** Authenticated app chrome (header + nav + sign out). Sign-out POSTs to the
 *  OIDC signout route which clears the session cookie. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const nav: [string, string][] = [
    ["Dashboard", "/dashboard"],
    ["Billing", "/dashboard/billing"],
  ];

  return (
    <div style={{ minHeight: "100svh", background: "#08080D", color: "#fff" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(20px,4vw,48px)", height: 56, borderBottom: `1px solid ${border}`, background: "rgba(8,8,13,0.9)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>AE</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>AE Studio</span>
          </Link>
          <nav style={{ display: "flex", gap: 4 }}>
            {nav.map(([l, h]) => (
              <Link key={l} href={h} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 13, color: pathname === h ? "#fff" : muted, textDecoration: "none", background: pathname === h ? "rgba(255,255,255,0.05)" : "transparent" }}>{l}</Link>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/studio" data-testid="nav-studio" style={{ background: orange, color: "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>New Project</Link>
          <form action="/auth/signout" method="post" style={{ display: "inline" }}>
            <button type="submit" style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 13, color: muted }} data-testid="submit-btn">Sign Out</button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
