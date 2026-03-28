"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-white">D</span>
            </div>
            <span className="text-lg font-bold">DeNovo</span>
          </Link>

          {user && (
            <div className="hidden items-center gap-1 sm:flex">
              <Link
                href="/studio"
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive("/studio")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Studio
              </Link>
              <Link
                href="/dashboard"
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive("/dashboard")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Dashboard
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link href="/pricing">
                <Button variant="ghost" size="sm">Pricing</Button>
              </Link>
              <Link href="/auth/login">
                <Button size="sm">Sign In</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/studio">
                <Button size="sm">New App</Button>
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
