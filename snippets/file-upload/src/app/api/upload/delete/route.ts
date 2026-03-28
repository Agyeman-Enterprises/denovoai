import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path, bucket } = await request.json();

  const { data: upload } = await supabase
    .from("file_uploads")
    .select("id")
    .eq("path", path)
    .eq("user_id", user.id)
    .single();

  if (!upload) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.storage.from(bucket).remove([path]);
  await supabase.from("file_uploads").delete().eq("path", path);

  return NextResponse.json({ success: true });
}
