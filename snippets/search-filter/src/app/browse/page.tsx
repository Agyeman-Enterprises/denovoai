"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { FilterPanel } from "@/components/search/FilterPanel";
import { SortSelect } from "@/components/search/SortSelect";

const CATEGORIES = ["Design", "Development", "Marketing", "Photography", "Writing"];

export default function BrowsePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (minPrice) params.set("min_price", (parseInt(minPrice) * 100).toString());
    if (maxPrice) params.set("max_price", (parseInt(maxPrice) * 100).toString());
    params.set("sort", sort);
    params.set("page", page.toString());

    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();
    setResults(data.results || []);
    setTotal(data.total || 0);
    setPages(data.pages || 0);
    setLoading(false);
  }, [query, category, minPrice, maxPrice, sort, page]);

  useEffect(() => { search(); }, [search]);

  return (
    <div className="min-h-screen bg-[#06060f] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-white">Browse</h1>

        <div className="mt-6">
          <SearchBar value={query} onChange={(v) => { setQuery(v); setPage(1); }} />
        </div>

        <div className="mt-4 flex flex-col gap-6 md:flex-row">
          <div className="w-full md:w-64 shrink-0">
            <FilterPanel
              categories={CATEGORIES}
              selectedCategory={category}
              onCategoryChange={(c) => { setCategory(c); setPage(1); }}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={(v) => { setMinPrice(v); setPage(1); }}
              onMaxPriceChange={(v) => { setMaxPrice(v); setPage(1); }}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-white/40">{total} results</p>
              <SortSelect value={sort} onChange={(v) => { setSort(v); setPage(1); }} />
            </div>

            {loading ? (
              <p className="text-sm text-white/25">Searching...</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-white/25">No results found.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((r) => (
                  <div key={r.id as string} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h3 className="text-sm font-semibold text-white/80">{r.title as string}</h3>
                    <p className="mt-1 text-xs text-white/30 line-clamp-2">{r.description as string}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-violet-400">${((r.price_cents as number) / 100).toFixed(0)}</span>
                      <span className="text-xs text-white/20">{r.category as string}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`rounded-lg px-3 py-1.5 text-xs ${p === page ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-white/40"}`}>{p}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
