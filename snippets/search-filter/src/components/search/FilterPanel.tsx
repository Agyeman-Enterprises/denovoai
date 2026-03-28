"use client";

interface FilterPanelProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (v: string) => void;
  onMaxPriceChange: (v: string) => void;
}

export function FilterPanel({ categories, selectedCategory, onCategoryChange, minPrice, maxPrice, onMinPriceChange, onMaxPriceChange }: FilterPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-white/40 mb-2">Category</p>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => onCategoryChange("")} className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${!selectedCategory ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-white/40 hover:text-white/60"}`}>All</button>
          {categories.map(c => (
            <button key={c} onClick={() => onCategoryChange(c)} className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${selectedCategory === c ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-white/40 hover:text-white/60"}`}>{c}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-white/40 mb-2">Price Range</p>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={minPrice} onChange={e => onMinPriceChange(e.target.value)} className="w-24 rounded-lg px-3 py-1.5 text-xs text-white" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
          <span className="text-white/25 self-center">—</span>
          <input type="number" placeholder="Max" value={maxPrice} onChange={e => onMaxPriceChange(e.target.value)} className="w-24 rounded-lg px-3 py-1.5 text-xs text-white" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
      </div>
    </div>
  );
}
