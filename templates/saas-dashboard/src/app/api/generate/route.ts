import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// SNIPPET SEAM: AI generation
// In production, this calls Claude/OpenAI to generate output from input_data.
// For the template baseline, it returns a stub output.

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await request.json();

  const { data: item } = await supabase.from("items").select("*").eq("id", itemId).eq("user_id", user.id).single();
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // Stub — replace with actual AI generation
  const output = {
    generated: true,
    timestamp: new Date().toISOString(),
    content: `Generated output for "${item.title}". Replace this stub with real AI generation.`,
  };

  await supabase.from("items").update({ output_data: output, status: "active", updated_at: new Date().toISOString() }).eq("id", itemId);

  return NextResponse.json({ output });
}
