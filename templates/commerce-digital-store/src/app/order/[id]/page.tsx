import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, products(title, download_url, product_type))")
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-white/30">Order not found.</p>
        <Link href="/dashboard" className="text-sm text-violet-400">Back to Dashboard</Link>
      </div>
    );
  }

  const items = (order.order_items || []) as Record<string, unknown>[];

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="text-lg font-bold text-white">{"{{APP_NAME}}"}</Link>
        <Link href="/dashboard" className="text-sm text-white/40 hover:text-white/70">Dashboard</Link>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <div className="mt-2 flex items-center gap-3">
          <span className="rounded-md px-2 py-0.5 text-xs font-medium" style={{
            background: order.status === "paid" || order.status === "fulfilled" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
            color: order.status === "paid" || order.status === "fulfilled" ? "#34d399" : "rgba(255,255,255,0.4)",
          }}>
            {(order.status as string).toUpperCase()}
          </span>
          <span className="text-xs text-white/25">{new Date(order.created_at as string).toLocaleDateString()}</span>
        </div>

        <div className="mt-8 space-y-3">
          {items.map((item: Record<string, unknown>) => {
            const product = item.products as Record<string, unknown> | null;
            return (
              <div key={item.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <p className="text-sm font-medium">{product?.title as string}</p>
                  <p className="text-xs text-white/30">Qty: {item.quantity as number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-violet-400">${((item.price_cents as number) / 100).toFixed(2)}</p>
                  {product?.product_type === "digital" && !!(product?.download_url) && (order.status === "paid" || order.status === "fulfilled") ? (
                    <a href={`/api/downloads/${order.id}`} className="text-xs text-emerald-400 hover:text-emerald-300">Download</a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl p-4 text-right" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="text-sm text-white/40">Total: </span>
          <span className="text-lg font-bold text-violet-400">${((order.amount_cents as number) / 100).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
