import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { count: users } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: listings } = await supabase.from("listings").select("*", { count: "exact", head: true });
  const { count: orders } = await supabase.from("orders").select("*", { count: "exact", head: true });

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6">
      <h1 className="text-2xl font-bold">Admin &mdash; {"{{APP_NAME}}"}</h1>
      <div className="mt-6 grid grid-cols-3 gap-4 max-w-2xl">
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/40">Users</p>
          <p className="mt-1 text-2xl font-bold">{users ?? 0}</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/40">{"{{LISTING_NOUN_PLURAL}}"}</p>
          <p className="mt-1 text-2xl font-bold">{listings ?? 0}</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/40">Orders</p>
          <p className="mt-1 text-2xl font-bold">{orders ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
