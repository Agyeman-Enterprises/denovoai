# DeNovo — Search & Filter Snippet Brief
## Full-text search, faceted filters, sorting. Postgres-native.
## Adds to existing harness on port 6001.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Add to port 6001. Stop there.

---

## What This Adds

Full-text search and faceted filtering using Postgres tsvector.
No Algolia. No Elasticsearch. No external dependencies.
Supabase full-text search is fast enough for 99% of use cases.

---

## Database Schema (add to existing)

```sql
-- Add search vector to listings table
-- If listings table doesn't exist yet, create a test one
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  category text,
  tags text[] default '{}',
  price_cents int,
  status text default 'active',
  location text,
  metadata jsonb default '{}',
  search_vector tsvector,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update search vector on insert/update
create or replace function update_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.category, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.tags, ' '), '')), 'C');
  return new;
end;
$$ language plpgsql;

drop trigger if exists listings_search_vector_update on listings;
create trigger listings_search_vector_update
  before insert or update on listings
  for each row execute function update_search_vector();

-- GIN index for fast full-text search
create index if not exists listings_search_idx
  on listings using gin(search_vector);

-- Index for common filter columns
create index if not exists listings_category_idx on listings(category);
create index if not exists listings_status_idx on listings(status);
create index if not exists listings_price_idx on listings(price_cents);

-- RLS
alter table listings enable row level security;
create policy "public read active listings" on listings
  for select using (status = 'active');
create policy "owners manage own listings" on listings
  for all using (auth.uid() = user_id);

-- Seed test data
insert into listings (user_id, title, description, category, tags, price_cents, status)
select
  (select id from profiles limit 1),
  'Test Listing ' || i,
  'Description for listing ' || i,
  (array['Design', 'Development', 'Marketing', 'Photography', 'Writing'])[floor(random()*5+1)],
  array['tag1', 'tag2'],
  (random() * 10000)::int,
  'active'
from generate_series(1, 50) i;
```

---

## New Files to Add

```
src/
├── app/
│   ├── browse/
│   │   └── page.tsx              # Browse + search + filter UI
│   └── api/
│       └── search/
│           └── route.ts          # Search API endpoint
└── components/
    └── search/
        ├── SearchBar.tsx         # Search input with debounce
        ├── FilterPanel.tsx       # Category, price, tags filters
        ├── SortSelect.tsx        # Sort by: relevance, price, date
        └── SearchResults.tsx     # Results grid with pagination
```

---

## Implementation Details

### `src/app/api/search/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category')
  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')
  const tags = searchParams.get('tags')?.split(',').filter(Boolean)
  const sort = searchParams.get('sort') ?? 'relevance'
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = (page - 1) * limit

  const supabase = await createClient()

  let queryBuilder = supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  // Full-text search
  if (query.trim()) {
    queryBuilder = queryBuilder
      .textSearch('search_vector', query, {
        type: 'websearch',
        config: 'english',
      })
  }

  // Filters
  if (category) queryBuilder = queryBuilder.eq('category', category)
  if (minPrice) queryBuilder = queryBuilder.gte('price_cents', parseInt(minPrice))
  if (maxPrice) queryBuilder = queryBuilder.lte('price_cents', parseInt(maxPrice))
  if (tags?.length) queryBuilder = queryBuilder.overlaps('tags', tags)

  // Sort
  switch (sort) {
    case 'price_asc':
      queryBuilder = queryBuilder.order('price_cents', { ascending: true })
      break
    case 'price_desc':
      queryBuilder = queryBuilder.order('price_cents', { ascending: false })
      break
    case 'newest':
      queryBuilder = queryBuilder.order('created_at', { ascending: false })
      break
    default: // relevance — natural order from text search
      if (!query.trim()) {
        queryBuilder = queryBuilder.order('created_at', { ascending: false })
      }
  }

  const { data, count, error } = await queryBuilder
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    results: data,
    total: count,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  })
}
```

### `src/components/search/SearchBar.tsx`
```typescript
'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    params.set('page', '1')
    router.push(`/browse?${params.toString()}`)
  }, 300)

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => {
        setValue(e.target.value)
        handleSearch(e.target.value)
      }}
      placeholder="Search..."
      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg
                 text-white placeholder-white/40 focus:outline-none focus:border-violet-500"
    />
  )
}
```

---

## Verification Checklist
- [ ] Full-text search returns relevant results
- [ ] Category filter narrows results correctly
- [ ] Price range filter works
- [ ] Tags filter works
- [ ] Sort by price asc/desc works
- [ ] Sort by newest works
- [ ] Pagination works (page 1, 2, 3)
- [ ] Empty query returns all results sorted by newest
- [ ] Search with no results returns empty array not error
- [ ] `npm run build` passes clean

---

## When Done — Report Exactly
1. ✅/❌ listings table with tsvector and GIN index created
2. ✅/❌ Search trigger fires on insert/update
3. ✅/❌ Search API returns correct results with filters
4. ✅/❌ Browse page renders results with working search + filter UI
5. ✅/❌ `npm run build` passes clean
