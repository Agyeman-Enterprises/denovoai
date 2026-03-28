import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkAndIncrementUsage } from "@/lib/usage";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check usage limit
  try {
    const usage = await checkAndIncrementUsage(user.id);
    if (!usage.allowed) {
      return NextResponse.json({
        error: "USAGE_LIMIT_REACHED",
        message: `You've used ${usage.count}/${usage.limit} {{PRIMARY_ENTITY_PLURAL}} this month. Upgrade to continue.`,
        usage,
      }, { status: 402 });
    }
  } catch {
    return NextResponse.json({ error: "Usage check failed" }, { status: 500 });
  }

  const body = await request.json();
  const { data, error } = await supabase
    .from("items")
    .insert({
      user_id: user.id,
      title: body.title || "Untitled",
      input_data: body.input_data || {},
      output_data: {},
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log usage event
  await supabase.from("usage_events").insert({
    user_id: user.id,
    action: "create_item",
    metadata: { item_id: data.id },
  });

  return NextResponse.json(data);
}
