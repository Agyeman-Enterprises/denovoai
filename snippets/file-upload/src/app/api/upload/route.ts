import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const bucket = (formData.get("bucket") as string) ?? "listings";
  const entityType = formData.get("entity_type") as string;
  const entityId = formData.get("entity_id") as string;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

  const ext = file.name.split(".").pop();
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

  await supabase.from("file_uploads").insert({
    user_id: user.id,
    bucket,
    path,
    filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    public_url: publicUrl,
    entity_type: entityType,
    entity_id: entityId,
  });

  return NextResponse.json({ url: publicUrl, path });
}
