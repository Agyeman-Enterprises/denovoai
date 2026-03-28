import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: records } = await supabase.from("records").select("status, priority").eq("is_archived", false);

  const statusCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = {};

  (records || []).forEach((r: Record<string, unknown>) => {
    const s = r.status as string;
    const p = r.priority as string;
    statusCounts[s] = (statusCounts[s] || 0) + 1;
    priorityCounts[p] = (priorityCounts[p] || 0) + 1;
  });

  return NextResponse.json({ statusCounts, priorityCounts, total: records?.length || 0 });
}
