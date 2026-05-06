import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user already reacted
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("post_id", id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Remove reaction (toggle off)
    await supabase.from("reactions").delete().eq("id", existing.id);
    return NextResponse.json({ action: "removed" });
  }

  // Add reaction
  const { error } = await supabase
    .from("reactions")
    .insert({ post_id: id, user_id: user.id, reaction: "like" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ action: "added" });
}
