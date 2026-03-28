import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("bookings").select("*").or(`client_id.eq.${user.id},provider_id.eq.${user.id}`).order("start_time", { ascending: true });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { providerId, startTime, endTime, notes } = await request.json();

  const { data, error } = await supabase.from("bookings").insert({
    client_id: user.id, provider_id: providerId, start_time: startTime, end_time: endTime, notes, status: "pending",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
