"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Database } from "@/types/database";

type AppRow = Database["public"]["Tables"]["apps"]["Row"];

export default function AppDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params.appId as string;
  const supabase = createClient();
  const [app, setApp] = useState<AppRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data } = await supabase
        .from("apps")
        .select("*")
        .eq("id", appId)
        .single();

      setApp(data);
      setLoading(false);
    }
    load();
  }, [appId, supabase, router]);

  const handleDelete = async () => {
    if (!confirm("Delete this app? This cannot be undone.")) return;
    await fetch(`/api/apps/${appId}`, { method: "DELETE" });
    router.push("/dashboard");
  };

  if (loading) return <><Navbar /><div className="flex flex-1 items-center justify-center"><p className="text-muted-foreground">Loading...</p></div></>;
  if (!app) return <><Navbar /><div className="flex flex-1 items-center justify-center"><p className="text-muted-foreground">App not found.</p></div></>;

  const slots = app.slot_map as Record<string, unknown>;

  return (
    <>
      <Navbar />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground" data-testid="nav-dashboard">&larr; Back to Dashboard</Link>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{app.name}</h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge>{app.template}</Badge>
                <Badge variant={app.status === "live" ? "success" : app.status === "failed" ? "destructive" : "secondary"}>
                  {app.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="font-semibold mb-3">Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Slug</dt><dd>{app.slug}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Output</dt><dd>{app.output_type || "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Credits used</dt><dd>{app.credits_used}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Created</dt><dd>{new Date(app.created_at).toLocaleString()}</dd></div>
              </dl>
            </Card>

            <Card>
              <h3 className="font-semibold mb-3">Links</h3>
              <div className="space-y-2">
                {app.coolify_domain && (
                  <a href={app.coolify_domain} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full" size="sm">Open App</Button>
                  </a>
                )}
                {app.gitea_repo_url && (
                  <a href={app.gitea_repo_url} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full" size="sm">View Repo</Button>
                  </a>
                )}
                {app.download_url && (
                  <a href={app.download_url} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full" size="sm">Download</Button>
                  </a>
                )}
              </div>
            </Card>
          </div>

          {app.error_message && (
            <Card className="mt-4 border-destructive/30">
              <h3 className="font-semibold text-red-400 mb-2">Error</h3>
              <p className="text-sm text-muted-foreground">{app.error_message}</p>
            </Card>
          )}

          {slots && Object.keys(slots).length > 0 && (
            <Card className="mt-4">
              <h3 className="font-semibold mb-3">Slot Map</h3>
              <pre className="text-xs text-muted-foreground overflow-auto max-h-48 bg-muted rounded-lg p-3">
                {JSON.stringify(slots, null, 2)}
              </pre>
            </Card>
          )}

          <div className="mt-8">
            <Button variant="destructive" size="sm" onClick={handleDelete}>Delete App</Button>
          </div>
        </div>
      </main>
    </>
  );
}
