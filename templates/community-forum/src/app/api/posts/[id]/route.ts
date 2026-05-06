import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select("id, title, body, category, status, created_at, author_id, profiles(display_name, avatar_url)")
    .eq("id", id)
    .single();

  if (error || !post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get reaction count
  const { count: reactionCount } = await supabase
    .from("reactions")
    .select("*", { count: "exact", head: true })
    .eq("post_id", id);

  return NextResponse.json({ post: { ...post, reaction_count: reactionCount ?? 0 } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Owner check
  const { data: existing } = await supabase.from("posts").select("author_id").eq("id", id).single();
  if (!existing || (existing.author_id as string) !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates = await request.json() as Record<string, unknown>;
  const allowed: Record<string, unknown> = {};
  if (updates.title) allowed.title = updates.title;
  if (updates.body) allowed.body = updates.body;
  if (updates.category) allowed.category = updates.category;

  const { data: post, error } = await supabase
    .from("posts")
    .update(allowed)
    .eq("id", id)
    .select("id, title, body, category, created_at, author_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Owner check
  const { data: existing } = await supabase.from("posts").select("author_id").eq("id", id).single();
  if (!existing || (existing.author_id as string) !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("posts")
    .update({ status: "removed" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
