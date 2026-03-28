import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("provider_id");
  const date = searchParams.get("date");

  if (!providerId || !date) return NextResponse.json({ error: "provider_id and date required" }, { status: 400 });

  const supabase = await createClient();

  const { data: booked } = await supabase.from("bookings").select("start_time, end_time").eq("provider_id", providerId).gte("start_time", `${date}T00:00:00`).lt("start_time", `${date}T23:59:59`).neq("status", "cancelled");

  // Generate available 1-hour slots (9am-5pm) minus booked
  const slots = [];
  for (let h = 9; h < 17; h++) {
    const start = `${date}T${String(h).padStart(2, "0")}:00:00`;
    const end = `${date}T${String(h + 1).padStart(2, "0")}:00:00`;
    const isBooked = (booked || []).some((b: Record<string, unknown>) => b.start_time === start);
    if (!isBooked) slots.push({ start, end });
  }

  return NextResponse.json(slots);
}
