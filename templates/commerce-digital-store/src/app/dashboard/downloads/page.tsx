import { createClient } from "@/lib/supabase/server";

export default async function DownloadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, order_id, products(title, download_url, product_type), orders!inner(customer_id, status)")
    .eq("orders.customer_id", user!.id)
    .in("orders.status", ["paid", "fulfilled"])
    .limit(50);

  const digital = (items || []).filter((i: Record<string, unknown>) => {
    const product = i.products as Record<string, unknown> | null;
    return product?.product_type === "digital" && product?.download_url;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">My Downloads</h1>

      {digital.length === 0 && (
        <p className="mt-8 text-sm text-white/30">No digital downloads yet.</p>
      )}

      {digital.length > 0 && (
        <div className="mt-6 space-y-2">
          {digital.map((item: Record<string, unknown>) => {
            const product = item.products as Record<string, unknown>;
            return (
              <div key={item.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-sm font-medium">{product.title as string}</p>
                <a
                  href={`/api/downloads/${item.order_id}`}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-80"
                  style={{ background: "#8B5CF6" }}
                >
                  Download
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
