# DeNovo — Reviews & Ratings Snippet Brief
## Star ratings, text reviews, aggregate scores. One review per order.
## Adds to existing harness on port 6001.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Add to port 6001. Stop there.

---

## Database Schema (add to existing)

```sql
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  reviewer_id uuid references profiles(id) on delete cascade,
  reviewee_id uuid references profiles(id) on delete cascade,
  order_id uuid unique,         -- one review per order
  rating int check (rating between 1 and 5) not null,
  title text,
  body text,
  is_public boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Aggregate rating view
create or replace view listing_ratings as
  select
    listing_id,
    count(*) as review_count,
    round(avg(rating)::numeric, 1) as average_rating,
    count(*) filter (where rating = 5) as five_star,
    count(*) filter (where rating = 4) as four_star,
    count(*) filter (where rating = 3) as three_star,
    count(*) filter (where rating = 2) as two_star,
    count(*) filter (where rating = 1) as one_star
  from reviews
  where is_public = true
  group by listing_id;

alter table reviews enable row level security;
create policy "public read reviews" on reviews
  for select using (is_public = true);
create policy "own reviews" on reviews
  for all using (auth.uid() = reviewer_id);
```

---

## New Files to Add

```
src/
├── app/
│   └── api/
│       └── reviews/
│           ├── route.ts              # GET list, POST create
│           └── [id]/route.ts        # PUT edit, DELETE remove
└── components/
    └── reviews/
        ├── ReviewForm.tsx            # Submit a review
        ├── ReviewList.tsx            # Display reviews
        ├── ReviewItem.tsx            # Single review
        ├── StarRating.tsx            # Interactive star picker
        ├── RatingDisplay.tsx         # Read-only rating display
        └── RatingBreakdown.tsx       # 5-star breakdown bar chart
```

---

## Implementation Details

### `src/app/api/reviews/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const listingId = searchParams.get('listing_id')
  const revieweeId = searchParams.get('reviewee_id')

  const supabase = await createClient()

  let query = supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(id, display_name, avatar_url)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (listingId) query = query.eq('listing_id', listingId)
  if (revieweeId) query = query.eq('reviewee_id', revieweeId)

  const { data } = await query

  // Get aggregate
  const { data: aggregate } = await supabase
    .from('listing_ratings')
    .select('*')
    .eq('listing_id', listingId)
    .single()

  return NextResponse.json({ reviews: data, aggregate })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listingId, revieweeId, orderId, rating, title, body } = await request.json()

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
  }

  // Cannot review yourself
  if (revieweeId === user.id) {
    return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      listing_id: listingId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      order_id: orderId,
      rating,
      title,
      body,
    })
    .select()
    .single()

  if (error?.code === '23505') {
    return NextResponse.json({ error: 'Already reviewed this order' }, { status: 409 })
  }

  return NextResponse.json(data)
}
```

### `src/components/reviews/StarRating.tsx`
```typescript
'use client'
import { useState } from 'react'

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const [hover, setHover] = useState(0)
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }

  return (
    <div className={`flex gap-1 ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          {star <= (hover || value) ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  )
}
```

### `src/components/reviews/RatingDisplay.tsx`
```typescript
export function RatingDisplay({
  rating,
  count,
  showCount = true,
}: {
  rating: number
  count: number
  showCount?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-yellow-400">{'⭐'.repeat(Math.round(rating))}</span>
      <span className="font-medium">{rating.toFixed(1)}</span>
      {showCount && (
        <span className="text-white/40 text-sm">({count} reviews)</span>
      )}
    </div>
  )
}
```

---

## Verification Checklist
- [ ] Review created with valid rating (1-5)
- [ ] Duplicate order review returns 409
- [ ] Cannot review yourself
- [ ] Aggregate rating calculates correctly
- [ ] Star rating component interactive and read-only modes work
- [ ] Reviews list shows reviewer name + avatar
- [ ] RLS prevents seeing private reviews
- [ ] `npm run build` passes clean

---

## When Done — Report Exactly
1. ✅/❌ reviews table + listing_ratings view created
2. ✅/❌ POST creates review with validation
3. ✅/❌ GET returns reviews + aggregate
4. ✅/❌ Duplicate prevention works
5. ✅/❌ Star components render correctly
6. ✅/❌ `npm run build` passes clean
