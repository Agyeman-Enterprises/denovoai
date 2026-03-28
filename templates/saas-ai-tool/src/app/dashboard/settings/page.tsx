"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
    }
    load();
  }, [supabase]);

  if (!profile) return <p className="text-white/40">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
          <span className="text-white/40">Name</span>
          <span>{(profile.display_name as string) || "\u2014"}</span>
        </div>
        <div className="flex justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 8 }}>
          <span className="text-white/40">Role</span>
          <span>{profile.role as string}</span>
        </div>
      </div>
      <form action="/auth/signout" method="POST" className="mt-8">
        <button type="submit" className="text-xs text-white/30 hover:text-white/50">Sign Out</button>
      </form>
    </div>
  );
}
