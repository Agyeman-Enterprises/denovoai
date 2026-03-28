# DeNovo — Admin Panel Snippet Brief
## User management, content moderation, platform oversight.
## Adds to existing harness on port 6001.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Add to port 6001. Stop there.

---

## What This Adds

A complete admin panel accessible only to users with role='admin'.
Covers user management, content moderation, and platform stats.

---

## Database Schema (add to existing)

```sql
-- Audit log
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,       -- 'ban_user', 'delete_listing', etc.
  entity_type text,           -- 'user', 'listing', 'order'
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table audit_logs enable row level security;
create policy "admin read audit logs" on audit_logs
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
```

---

## New Files to Add

```
src/app/admin/
├── layout.tsx              # Admin layout — role gate
├── page.tsx                # Overview: stats, recent activity
├── users/
│   ├── page.tsx            # User list: search, filter, ban
│   └── [id]/page.tsx       # User detail: profile, orders, activity
├── content/
│   └── page.tsx            # Content moderation queue
└── logs/
    └── page.tsx            # Audit log viewer
```

---

## Implementation Details

### `src/app/admin/layout.tsx` — hard gate, server-side
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="flex gap-6 text-sm">
          <a href="/admin">Overview</a>
          <a href="/admin/users">Users</a>
          <a href="/admin/content">Content</a>
          <a href="/admin/logs">Audit Log</a>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
```

### `src/app/admin/page.tsx` — platform stats
```typescript
// Fetch and display:
// - Total users (count from profiles)
// - New users this week
// - Active subscriptions (count from subscriptions where status='active')
// - Total revenue (sum from purchases + subscriptions)
// - Recent signups (last 10 profiles)
// - Recent activity (last 10 audit_logs)
```

### `src/app/admin/users/page.tsx` — user management
```typescript
// Features:
// - List all users with search by email/name
// - Filter by role (user, admin)
// - Filter by subscription status
// - Ban user (sets role to 'banned', logs to audit_log)
// - Promote to admin (sets role to 'admin', logs to audit_log)
// - View user detail link
```

### Admin actions (use service role key — bypasses RLS)
```typescript
// Ban user
await supabaseAdmin.from('profiles')
  .update({ role: 'banned' })
  .eq('id', userId)

await supabaseAdmin.from('audit_logs').insert({
  actor_id: adminId,
  action: 'ban_user',
  entity_type: 'user',
  entity_id: userId,
  metadata: { reason },
})

// All admin mutations go through service role client
// Log every action to audit_logs without exception
```

### proxy.ts addition — protect /admin routes
```typescript
// Add to existing proxy.ts
if (request.nextUrl.pathname.startsWith('/admin')) {
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }
  // Role check happens in admin/layout.tsx server-side
}
```

---

## Verification Checklist
- [ ] `/admin` redirects non-admin users to `/dashboard`
- [ ] `/admin` redirects unauthenticated users to `/auth/login`
- [ ] User list loads with search working
- [ ] Ban user updates role and creates audit log entry
- [ ] Promote to admin updates role and creates audit log entry
- [ ] Audit log shows all actions with actor, action, timestamp
- [ ] Stats on overview page are accurate
- [ ] `npm run build` passes clean

---

## When Done — Report Exactly
1. ✅/❌ audit_logs table created
2. ✅/❌ Admin role gate works — non-admins cannot access
3. ✅/❌ User management — ban + promote work with audit trail
4. ✅/❌ Overview stats load correctly
5. ✅/❌ `npm run build` passes clean
