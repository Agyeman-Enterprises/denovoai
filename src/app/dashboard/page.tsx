"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Database } from "@/types/database";

type AppRow = Database["public"]["Tables"]["apps"]["Row"];

const STATUS_BADGE: Record<string, { variant: "default" | "success" | "warning" | "destructive" | "secondary"; label: string }> = {
  parsing: { variant: "default", label: "Parsing" },
  confirming: { variant: "default", label: "Confirming" },
  assembling: { variant: "warning", label: "Assembling" },
  deploying: { variant: "warning", label: "Deploying" },
  live: { variant: "success", label: "Live" },
  downloaded: { variant: "secondary", label: "Downloaded" },
  failed: { variant: "destructive", label: "Failed" },
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data } = await supabase
        .from("apps")
        .select("*")
        .order("created_at", { ascending: false });

      setApps(data || []);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  return (
    <>
      <Navbar />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Apps</h1>
            <Link href="/studio" data-testid="nav-studio">
              <Button>New App</Button>
            </Link>
          </div>

          {loading ? (
            <p className="mt-8 text-muted-foreground">Loading...</p>
          ) : apps.length === 0 ? (
            <Card className="mt-8 text-center py-12">
              <p className="text-muted-foreground">No apps yet.</p>
              <Link href="/studio" data-testid="nav-studio">
                <Button className="mt-4">Build Your First App</Button>
              </Link>
            </Card>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {apps.map((app) => {
                const status = STATUS_BADGE[app.status] || STATUS_BADGE.parsing;
                return (
                  <Link key={app.id} href={`/dashboard/app/${app.id}`}>
                    <Card className="transition-colors hover:border-primary/50 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{app.name}</h3>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary">{app.template}</Badge>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Created {new Date(app.created_at).toLocaleDateString()}
                      </p>
                      {app.status === "failed" && app.error_message && (
                        <p className="mt-2 text-xs text-red-400 truncate">{app.error_message}</p>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
