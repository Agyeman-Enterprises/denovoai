"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import Link from "next/link";

const orange = "#F5530A";
const border = "rgba(255,255,255,0.07)";
const muted  = "rgba(255,255,255,0.45)";

interface MeUser { id: string; email: string | null; role: string | null }

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<MeUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { user: MeUser | null }) => { if (!cancelled) setUser(d.user); })
      .catch(() => { if (!cancelled) setUser(null); });
    return () => { cancelled = true; };
  }, [pathname]);

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      borderBottom: `1px solid ${border}`,
      background: "rgba(8,8,13,0.88)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: "0 clamp(20px,4vw,48px)",
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>

        {/* Logo — navbar variant: Æ icon + "Design Studio" */}
        <Logo variant="navbar" size="sm" />

        {/* Nav links */}
        {!user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {[
              { label: "Work",     href: "/#work" },
              { label: "Process",  href: "/#process" },
              { label: "Pricing",  href: "/pricing" },
              { label: "Studio",   href: "/auth/login" },
            ].map(n => (
              <Link key={n.label} href={n.href} style={{
                padding: "6px 14px", borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                color: muted, textDecoration: "none",
              }}>{n.label}</Link>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {[
              { label: "Studio",    href: "/studio" },
              { label: "Dashboard", href: "/dashboard" },
            ].map(n => (
              <Link key={n.label} href={n.href} style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                color: pathname === n.href ? "#fff" : muted, textDecoration: "none",
                background: pathname === n.href ? "rgba(255,255,255,0.06)" : "transparent",
              }}>{n.label}</Link>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!user ? (
            <>
              <Link href="/auth/login" style={{ fontSize: 13, color: muted, textDecoration: "none" }}>Sign In</Link>
              <Link href="/auth/login" style={{
                background: orange, color: "#fff",
                padding: "8px 20px", borderRadius: 8,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 0 16px rgba(245,83,10,0.25)",
              }}>Start a project</Link>
            </>
          ) : (
            <>
              <Link href="/studio" data-testid="nav-studio" style={{
                background: orange, color: "#fff",
                padding: "8px 20px", borderRadius: 8,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
              }}>New project</Link>
              <form action="/auth/signout" method="post" style={{ margin: 0 }}>
                <button type="submit" data-testid="sign-out" style={{
                  background: "transparent", border: "none",
                  cursor: "pointer", fontSize: 13, color: muted,
                }}>Sign Out</button>
              </form>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
