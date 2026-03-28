import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: Request) {
  const { event, payload } = await request.json();

  const { data: endpoints } = await supabase.from("webhook_endpoints").select("*").eq("active", true).contains("events", [event]);

  for (const ep of endpoints || []) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto.createHmac("sha256", ep.secret).update(`${timestamp}.${JSON.stringify(payload)}`).digest("hex");

    try {
      await fetch(ep.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-webhook-signature": `t=${timestamp},v1=${signature}`, "x-webhook-event": event },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      // Log delivery failure — in production store in webhook_deliveries table
    }
  }

  return NextResponse.json({ delivered: (endpoints || []).length });
}
