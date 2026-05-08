"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,15,0.85)" }}>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "#8B5CF6" }}>
              <span className="text-[10px] font-bold text-white">D</span>
            </div>
            <span className="text-base font-bold text-white">DeNovo</span>
          </Link>

          {/* Public nav */}
          {!user && (
            <div className="hidden items-center gap-1 sm:flex">
              {[
                { label: "Build", href: "/#pricing" },
                { label: "Launch", href: "/#pricing" },
                { label: "Templates", href: "/#templates" },
                { label: "Pricing", href: "/#pricing" },
                { label: "FAQ", href: "/#faq" },
              ].map(n => (
                <Link key={n.label} href={n.href} className="rounded-lg px-3 py-1.5 text-xs text-white/40 transition-colors hover:text-white/70">{n.label}</Link>
              ))}
            </div>
          )}

          {/* Authenticated nav */}
          {user && (
            <div className="hidden items-center gap-1 sm:flex">
              {[
                { label: "Studio", href: "/studio" },
                { label: "Dashboard", href: "/dashboard" },
              ].map(n => (
                <Link key={n.label} href={n.href} className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${pathname === n.href ? "text-white bg-white/5" : "text-white/40 hover:text-white/70"}`}>{n.label}</Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link href="/auth/login" className="hidden text-xs text-white/30 hover:text-white/50 transition-colors sm:block">Sign In</Link>
              <Link href="/auth/login" className="inline-flex h-8 items-center rounded-lg px-4 text-xs font-semibold text-white" style={{ background: "#8B5CF6" }}>Start Building</Link>
            </>
          ) : (
            <>
              <Link href="/studio" className="inline-flex h-8 items-center rounded-lg px-4 text-xs font-semibold text-white" style={{ background: "#8B5CF6" }}>New App</Link>
              <button onClick={handleLogout} className="text-xs text-white/30 hover:text-white/50 transition-colors">Sign Out</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
