import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("conversations").select("*, messages(content, created_at)").or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`).order("updated_at", { ascending: false }).limit(20);

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipientId, message } = await request.json();

  const { data: conv } = await supabase.from("conversations").insert({ participant_a: user.id, participant_b: recipientId }).select().single();
  if (!conv) return NextResponse.json({ error: "Failed" }, { status: 500 });

  await supabase.from("messages").insert({ conversation_id: conv.id, sender_id: user.id, content: message });

  return NextResponse.json(conv);
}
