import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table") ?? "listings";
  const columns = searchParams.get("columns")?.split(",") ?? ["*"];

  const { data, error } = await supabase.from(table).select(columns.join(",")).limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return new Response("No data", { status: 204 });

  const rows = data as unknown as Record<string, unknown>[];
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map(h => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${table}_export.csv"` },
  });
}
