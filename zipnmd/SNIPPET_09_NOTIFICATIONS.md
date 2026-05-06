# DeNovo — Notifications Snippet Brief
## In-app notifications. Real-time. Read/unread. Notification centre.
## Adds to existing harness on port 6001.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Add to port 6001. Stop there.

---

## Database Schema (add to existing)

```sql
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,         -- 'order', 'message', 'review', 'system'
  title text not null,
  body text,
  link text,                  -- optional URL to navigate to
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_unread_idx
  on notifications(user_id, read, created_at desc);

alter table notifications enable row level security;
create policy "own notifications" on notifications
  for all using (auth.uid() = user_id);
```

---

## New Files to Add

```
src/
├── app/
│   ├── dashboard/
│   │   └── notifications/
│   │       └── page.tsx              # Full notification list
│   └── api/
│       └── notifications/
│           ├── route.ts              # GET list, POST create
│           └── [id]/
│               └── read/route.ts    # Mark as read
└── components/
    └── notifications/
        ├── NotificationBell.tsx      # Bell icon with unread count
        ├── NotificationDropdown.tsx  # Dropdown with recent notifications
        └── NotificationItem.tsx      # Single notification row
```

---

## Implementation Details

### `src/app/api/notifications/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (unreadOnly) query = query.eq('read', false)

  const { data, error } = await query
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return NextResponse.json({ notifications: data, unreadCount: count })
}

export async function POST(request: Request) {
  // Create notification — service role only in production
  // For testing, allow authenticated users
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, type, title, body, link } = await request.json()

  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId ?? user.id, type, title, body, link })
    .select()
    .single()

  return NextResponse.json(data)
}
```

### `src/app/api/notifications/[id]/read/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
```

### `src/components/notifications/NotificationBell.tsx`
```typescript
'use client'
import { useState, useEffect } from 'react'
import { NotificationDropdown } from './NotificationDropdown'
import { createClient } from '@/lib/supabase/client'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchCount = async () => {
      const res = await fetch('/api/notifications?unread=true&limit=1')
      const data = await res.json()
      setUnreadCount(data.unreadCount ?? 0)
    }

    fetchCount()

    // Real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, () => fetchCount())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/10"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-violet-500 text-white
                           text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <NotificationDropdown onClose={() => setOpen(false)} />
      )}
    </div>
  )
}
```

### `src/components/notifications/NotificationDropdown.tsx`
```typescript
'use client'
import { useState, useEffect } from 'react'
import { NotificationItem } from './NotificationItem'

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/notifications?limit=10')
      .then(r => r.json())
      .then(d => setNotifications(d.notifications ?? []))
  }, [])

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  return (
    <div className="absolute right-0 top-10 w-80 bg-zinc-900 border border-white/10
                    rounded-xl shadow-xl z-50">
      <div className="p-4 border-b border-white/10 flex justify-between">
        <span className="font-medium">Notifications</span>
        <a href="/dashboard/notifications" className="text-sm text-violet-400">
          See all
        </a>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 && (
          <p className="p-4 text-center text-white/40 text-sm">
            No notifications
          </p>
        )}
        {notifications.map(n => (
          <NotificationItem
            key={n.id}
            notification={n}
            onRead={() => markRead(n.id)}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## Verification Checklist
- [ ] Notifications table created with RLS
- [ ] GET endpoint returns correct notifications for user
- [ ] POST endpoint creates notification
- [ ] Mark as read updates database
- [ ] Bell shows correct unread count
- [ ] Real-time subscription fires on new notification
- [ ] Dropdown shows recent notifications
- [ ] Unread notifications are visually distinct
- [ ] `npm run build` passes clean

---

## When Done — Report Exactly
1. ✅/❌ notifications table created
2. ✅/❌ GET/POST/read endpoints work
3. ✅/❌ Bell component shows real unread count
4. ✅/❌ Real-time fires on insert
5. ✅/❌ `npm run build` passes clean
