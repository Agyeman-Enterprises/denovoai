import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const id = formData.get("id") as string;
  const action = formData.get("action") as string;

  if (!id || !action) return NextResponse.json({ error: "Missing id or action" }, { status: 400 });

  const newStatus = action === "approve" ? "active" : "rejected";
  const { error } = await supabase.from("directory_listings").update({ status: newStatus }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Redirect back to admin
  return NextResponse.redirect(new URL("/admin", request.url));
}
