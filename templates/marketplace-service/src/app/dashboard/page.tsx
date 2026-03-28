import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("display_name, role").eq("id", user!.id).single();
  const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true }).or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`);
  const { count: listingCount } = await supabase.from("listings").select("*", { count: "exact", head: true }).eq("seller_id", user!.id);

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome, {profile?.display_name || user!.email}</h1>
      <p className="mt-1 text-sm text-white/40">Role: {profile?.role || "buyer"}</p>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/40">Orders</p>
          <p className="mt-1 text-2xl font-bold">{orderCount || 0}</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/40">Listings</p>
          <p className="mt-1 text-2xl font-bold">{listingCount || 0}</p>
        </div>
      </div>
      <form action="/auth/signout" method="POST" className="mt-8">
        <button type="submit" className="text-xs text-white/30 hover:text-white/50">Sign Out</button>
      </form>
    </div>
  );
}
