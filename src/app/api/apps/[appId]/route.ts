import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: app } = await supabase
    .from("apps")
    .select("*")
    .eq("id", appId)
    .eq("user_id", user.id)
    .single();

  if (!app) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  return NextResponse.json(app);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("apps")
    .delete()
    .eq("id", appId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
