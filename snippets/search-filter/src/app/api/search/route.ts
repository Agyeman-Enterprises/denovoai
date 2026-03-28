import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category");
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const sort = searchParams.get("sort") ?? "relevance";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  let qb = supabase.from("listings").select("*", { count: "exact" }).eq("status", "active");

  if (query.trim()) {
    qb = qb.textSearch("search_vector", query, { type: "websearch", config: "english" });
  }

  if (category) qb = qb.eq("category", category);
  if (minPrice) qb = qb.gte("price_cents", parseInt(minPrice));
  if (maxPrice) qb = qb.lte("price_cents", parseInt(maxPrice));

  switch (sort) {
    case "price_asc": qb = qb.order("price_cents", { ascending: true }); break;
    case "price_desc": qb = qb.order("price_cents", { ascending: false }); break;
    case "newest": qb = qb.order("created_at", { ascending: false }); break;
    default: if (!query.trim()) qb = qb.order("created_at", { ascending: false });
  }

  const { data, count, error } = await qb.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ results: data, total: count, page, limit, pages: Math.ceil((count ?? 0) / limit) });
}
