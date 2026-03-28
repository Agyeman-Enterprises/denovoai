import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { count: totalProducts } = await supabase.from("products").select("*", { count: "exact", head: true });
  const { count: activeProducts } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "active");
  const { count: totalOrders } = await supabase.from("orders").select("*", { count: "exact", head: true });
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, status, amount_cents, email, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const totalRevenue = (recentOrders || []).reduce((sum, o: Record<string, unknown>) => {
    if (o.status === "paid" || o.status === "fulfilled") return sum + (o.amount_cents as number);
    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"} Admin</Link>
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="text-sm text-white/40 hover:text-white/70">Products</Link>
          <Link href="/admin/orders" className="text-sm text-white/40 hover:text-white/70">Orders</Link>
          <Link href="/" className="text-sm text-white/40 hover:text-white/70">View Store</Link>
          <form action="/auth/signout" method="POST"><button type="submit" className="text-xs text-white/20 hover:text-white/40">Sign Out</button></form>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold">Sales Dashboard</h1>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total Products", value: totalProducts ?? 0 },
            { label: "Active Products", value: activeProducts ?? 0 },
            { label: "Total Orders", value: totalOrders ?? 0 },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs text-white/40">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/40">Recent Revenue</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">${(totalRevenue / 100).toFixed(2)}</p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white/60">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-violet-400 hover:text-violet-300">View All</Link>
        </div>

        <div className="mt-3 space-y-1">
          {(recentOrders || []).map((o: Record<string, unknown>) => (
            <div key={o.id as string} className="flex items-center justify-between rounded-lg p-3 text-sm" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div>
                <span className="text-white/70">#{(o.id as string).slice(0, 8)}</span>
                <span className="ml-3 text-xs text-white/25">{o.email as string}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/25">{(o.status as string).toUpperCase()}</span>
                <span className="font-bold text-violet-400">${((o.amount_cents as number) / 100).toFixed(2)}</span>
              </div>
            </div>
          ))}
          {(!recentOrders || recentOrders.length === 0) && <p className="text-xs text-white/25">No orders yet.</p>}
        </div>
      </div>
    </div>
  );
}
