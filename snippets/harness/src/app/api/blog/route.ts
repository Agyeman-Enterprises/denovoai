import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "published";
  const supabase = await createClient();

  const { data } = await supabase.from("blog_posts").select("id, title, slug, excerpt, status, published_at, created_at, profiles(display_name)").eq("status", status).order("published_at", { ascending: false }).limit(20);

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, slug, content, excerpt, status: postStatus } = await request.json();

  const { data, error } = await supabase.from("blog_posts").insert({
    author_id: user.id, title, slug, content, excerpt, status: postStatus || "draft",
    published_at: postStatus === "published" ? new Date().toISOString() : null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
