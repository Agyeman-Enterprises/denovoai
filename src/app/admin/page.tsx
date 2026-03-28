"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/navbar";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/database";

type AppRow = Database["public"]["Tables"]["apps"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setAuthorized(true);

      // Use service client via API for admin data (RLS would block)
      // For now, show what the user's own RLS allows + indicate admin mode
      const { data: appsData } = await supabase.from("apps").select("*").order("created_at", { ascending: false }).limit(50);
      const { data: usersData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50);

      setApps(appsData || []);
      setUsers(usersData || []);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  if (!authorized || loading) {
    return (
      <>
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">{loading ? "Loading..." : "Checking access..."}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-bold">Admin Panel</h1>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card>
              <CardTitle>Total Users</CardTitle>
              <p className="mt-2 text-3xl font-bold">{users.length}</p>
            </Card>
            <Card>
              <CardTitle>Total Apps</CardTitle>
              <p className="mt-2 text-3xl font-bold">{apps.length}</p>
            </Card>
            <Card>
              <CardTitle>Live Apps</CardTitle>
              <p className="mt-2 text-3xl font-bold">{apps.filter((a) => a.status === "live").length}</p>
            </Card>
          </div>

          {/* Recent Apps */}
          <Card className="mt-6">
            <CardTitle>Recent Apps</CardTitle>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Template</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => (
                    <tr key={app.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 font-medium">{app.name}</td>
                      <td className="py-2 pr-4"><Badge variant="secondary">{app.template}</Badge></td>
                      <td className="py-2 pr-4">
                        <Badge variant={app.status === "live" ? "success" : app.status === "failed" ? "destructive" : "default"}>
                          {app.status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Users */}
          <Card className="mt-6">
            <CardTitle>Users</CardTitle>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2 pr-4">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 font-medium">{u.display_name || "—"}</td>
                      <td className="py-2 pr-4"><Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge></td>
                      <td className="py-2 pr-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
