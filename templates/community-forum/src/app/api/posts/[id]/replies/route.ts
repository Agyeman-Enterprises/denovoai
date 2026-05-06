import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: replies, error } = await supabase
    .from("replies")
    .select("id, body, created_at, author_id, profiles(display_name, avatar_url)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ replies: replies || [] });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { body } = await request.json() as { body: string };

  if (!body || !body.trim()) {
    return NextResponse.json({ error: "Reply body is required" }, { status: 400 });
  }

  const { data: reply, error } = await supabase
    .from("replies")
    .insert({ post_id: id, body, author_id: user.id })
    .select("id, body, created_at, author_id, profiles(display_name, avatar_url)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reply }, { status: 201 });
}
