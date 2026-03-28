import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, amount_cents, created_at")
    .eq("customer_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <h1 className="text-2xl font-bold">My Orders</h1>

      {(!orders || orders.length === 0) && (
        <div className="mt-8 text-center">
          <p className="text-sm text-white/30">No orders yet.</p>
          <Link href="/shop" className="mt-2 inline-block text-sm text-violet-400 hover:text-violet-300">Browse {"{{PRODUCT_NOUN_PLURAL}}"}</Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-6 space-y-2">
          {orders.map((o: Record<string, unknown>) => (
            <Link
              key={o.id as string}
              href={`/order/${o.id}`}
              className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-white/[0.02]"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div>
                <p className="text-sm font-medium">Order #{(o.id as string).slice(0, 8)}</p>
                <p className="text-xs text-white/25">{new Date(o.created_at as string).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-violet-400">${((o.amount_cents as number) / 100).toFixed(2)}</p>
                <span className="text-[10px] text-white/30">{(o.status as string).toUpperCase()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
