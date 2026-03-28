import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true });

  return NextResponse.json(data || []);
}

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await request.json();

  const { data, error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, content }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

  return NextResponse.json(data);
}
