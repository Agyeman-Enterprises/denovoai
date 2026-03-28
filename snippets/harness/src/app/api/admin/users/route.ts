import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, action } = await request.json();
  if (!userId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const newRole = action === "ban" ? "banned" : action === "promote" ? "admin" : null;
  if (!newRole) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  await supabaseAdmin.from("profiles").update({ role: newRole }).eq("id", userId);

  await supabaseAdmin.from("audit_logs").insert({
    actor_id: user.id,
    action: `${action}_user`,
    entity_type: "user",
    entity_id: userId,
    metadata: { new_role: newRole },
  });

  return NextResponse.json({ success: true });
}
