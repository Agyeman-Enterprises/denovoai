"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

const orange = "#F5530A";
const border = "rgba(255,255,255,0.07)";
const muted  = "rgba(255,255,255,0.45)";

export function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

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
              <button onClick={handleLogout} style={{
                background: "transparent", border: "none",
                cursor: "pointer", fontSize: 13, color: muted,
              }}>Sign Out</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
