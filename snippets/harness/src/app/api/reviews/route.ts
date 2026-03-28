import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entity_id");
  const supabase = await createClient();

  let qb = supabase.from("reviews").select("*, profiles(display_name, avatar_url)").order("created_at", { ascending: false });
  if (entityId) qb = qb.eq("entity_id", entityId);

  const { data } = await qb.limit(50);
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entityType, entityId, rating, title, body } = await request.json();

  const { data, error } = await supabase.from("reviews").insert({
    user_id: user.id, entity_type: entityType, entity_id: entityId, rating, title, body,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
