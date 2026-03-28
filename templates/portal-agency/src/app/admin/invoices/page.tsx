"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function InvoiceManagementPage() {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("invoices").select("*, profiles(display_name)").order("created_at", { ascending: false });
      setInvoices(data || []);
    }
    load();
  }, [supabase]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Invoices</h1>
      <div className="mt-6 space-y-2">
        {invoices.map(inv => (
          <div key={inv.id as string} className="flex items-center justify-between rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <p className="text-sm font-medium">${((inv.amount_cents as number) / 100).toFixed(2)}</p>
              <p className="text-xs text-white/25">{String((inv.profiles as Record<string, unknown>)?.display_name || 'Unknown') || "Unknown"}</p>
            </div>
            <span className={`text-xs ${(inv.status as string) === "paid" ? "text-green-400" : (inv.status as string) === "overdue" ? "text-red-400" : "text-white/30"}`}>{inv.status as string}</span>
          </div>
        ))}
        {invoices.length === 0 && <p className="text-sm text-white/25">No invoices yet.</p>}
      </div>
    </div>
  );
}
