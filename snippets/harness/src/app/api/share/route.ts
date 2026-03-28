import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entityType, entityId } = await request.json();
  const token = crypto.randomBytes(16).toString("hex");
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/shared/${token}`;

  // In production, store share tokens in a table with expiry
  return NextResponse.json({ url, token });
}
