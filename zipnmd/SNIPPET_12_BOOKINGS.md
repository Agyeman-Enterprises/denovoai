# DeNovo — Bookings Snippet Brief
## Date/time picker, availability slots, calendar view, confirmations.
## Adds to existing harness on port 6001.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Add to port 6001. Stop there.

---

## Dependencies to Install
```bash
npm install react-day-picker date-fns
```

---

## Database Schema (add to existing)

```sql
-- Availability rules (recurring weekly schedule)
create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  listing_id uuid,
  day_of_week int check (day_of_week between 0 and 6), -- 0=Sun, 6=Sat
  start_time time not null,
  end_time time not null,
  slot_duration_minutes int default 60,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Blocked dates (holidays, time off)
create table if not exists availability_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  listing_id uuid,
  blocked_date date not null,
  reason text,
  created_at timestamptz default now()
);

-- Bookings
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  buyer_id uuid references profiles(id) on delete cascade,
  seller_id uuid references profiles(id) on delete cascade,
  order_id uuid,
  scheduled_date date not null,
  start_time time not null,
  end_time time not null,
  duration_minutes int not null,
  status text check (status in (
    'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
  )) default 'pending',
  notes text,
  cancellation_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists bookings_seller_date_idx
  on bookings(seller_id, scheduled_date);
create index if not exists bookings_buyer_idx
  on bookings(buyer_id);

alter table availability_rules enable row level security;
alter table availability_blocks enable row level security;
alter table bookings enable row level security;

create policy "public read availability" on availability_rules
  for select using (is_active = true);
create policy "own availability rules" on availability_rules
  for all using (auth.uid() = user_id);
create policy "own availability blocks" on availability_blocks
  for all using (auth.uid() = user_id);
create policy "parties see bookings" on bookings
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "buyers create bookings" on bookings
  for insert with check (auth.uid() = buyer_id);
create policy "parties update bookings" on bookings
  for update using (auth.uid() = buyer_id or auth.uid() = seller_id);
```

---

## New Files to Add

```
src/
├── app/
│   ├── dashboard/
│   │   └── bookings/
│   │       ├── page.tsx              # My bookings list
│   │       └── availability/
│   │           └── page.tsx          # Set my availability
│   └── api/
│       └── bookings/
│           ├── route.ts              # GET list, POST create
│           ├── [id]/route.ts         # GET detail, PATCH status
│           └── availability/
│               └── route.ts          # GET available slots for a date
└── components/
    └── bookings/
        ├── BookingCalendar.tsx       # Date picker showing availability
        ├── TimeSlotPicker.tsx        # Available time slots for a date
        ├── BookingForm.tsx           # Full booking form
        └── BookingCard.tsx           # Booking summary card
```

---

## Implementation Details

### `src/app/api/bookings/availability/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sellerId = searchParams.get('seller_id')!
  const listingId = searchParams.get('listing_id')
  const date = searchParams.get('date')! // YYYY-MM-DD

  const supabase = await createClient()
  const dayOfWeek = new Date(date + 'T00:00:00').getDay()

  // Get availability rules for this day
  let rulesQuery = supabase
    .from('availability_rules')
    .select('*')
    .eq('user_id', sellerId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)

  if (listingId) rulesQuery = rulesQuery.eq('listing_id', listingId)

  const { data: rules } = await rulesQuery

  // Check if date is blocked
  const { data: block } = await supabase
    .from('availability_blocks')
    .select('id')
    .eq('user_id', sellerId)
    .eq('blocked_date', date)
    .single()

  if (block || !rules?.length) {
    return NextResponse.json({ slots: [] })
  }

  // Get existing bookings for this date
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('seller_id', sellerId)
    .eq('scheduled_date', date)
    .in('status', ['pending', 'confirmed'])

  // Generate available slots
  const slots: { start: string; end: string; available: boolean }[] = []

  for (const rule of rules ?? []) {
    const [startH, startM] = rule.start_time.split(':').map(Number)
    const [endH, endM] = rule.end_time.split(':').map(Number)
    const duration = rule.slot_duration_minutes

    let current = startH * 60 + startM
    const end = endH * 60 + endM

    while (current + duration <= end) {
      const slotStart = `${String(Math.floor(current/60)).padStart(2,'0')}:${String(current%60).padStart(2,'0')}`
      const slotEnd = `${String(Math.floor((current+duration)/60)).padStart(2,'0')}:${String((current+duration)%60).padStart(2,'0')}`

      const isBooked = existingBookings?.some(b =>
        b.start_time <= slotStart && b.end_time > slotStart
      )

      slots.push({ start: slotStart, end: slotEnd, available: !isBooked })
      current += duration
    }
  }

  return NextResponse.json({ slots })
}
```

### `src/app/api/bookings/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listingId, sellerId, date, startTime, endTime, durationMinutes, notes } =
    await request.json()

  // Verify slot is still available
  const { data: conflict } = await supabase
    .from('bookings')
    .select('id')
    .eq('seller_id', sellerId)
    .eq('scheduled_date', date)
    .eq('start_time', startTime)
    .in('status', ['pending', 'confirmed'])
    .single()

  if (conflict) {
    return NextResponse.json({ error: 'Slot no longer available' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: sellerId,
      scheduled_date: date,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: durationMinutes,
      notes,
    })
    .select()
    .single()

  return NextResponse.json(data)
}
```

---

## Verification Checklist
- [ ] Availability rules created for a seller
- [ ] Available slots returned correctly for a date
- [ ] Blocked dates return empty slots
- [ ] Already-booked slots not returned as available
- [ ] Booking created successfully
- [ ] Concurrent booking conflict detected (409)
- [ ] Booking status updates work (confirm, cancel)
- [ ] `npm run build` passes clean

---

## When Done — Report Exactly
1. ✅/❌ All tables created with RLS
2. ✅/❌ Availability slots generate correctly
3. ✅/❌ Booking creation with conflict check works
4. ✅/❌ Calendar + time slot components render
5. ✅/❌ `npm run build` passes clean
