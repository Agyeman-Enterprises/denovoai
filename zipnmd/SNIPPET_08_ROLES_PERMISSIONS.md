# DeNovo — Roles & Permissions Snippet Brief
## Fine-grained access control. Role-based and resource-based.
## Adds to existing harness on port 6001.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Add to port 6001. Stop there.

---

## What This Adds

Role-based access control (RBAC) at both the UI and API level.
Works in combination with Supabase RLS for database-level enforcement.
Roles: user, moderator, admin, banned.
Resource permissions: own, team, public.

---

## Database Schema (add to existing)

```sql
-- Extend profiles role check
alter table profiles
  drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check
  check (role in ('user', 'moderator', 'admin', 'banned'));

-- Team memberships (for multi-tenant apps)
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('owner', 'admin', 'member', 'viewer')) default 'member',
  invited_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique(team_id, user_id)
);

alter table team_members enable row level security;
create policy "team members see own teams" on team_members
  for select using (auth.uid() = user_id);
```

---

## New Files to Add

```
src/
├── lib/
│   └── permissions/
│       ├── roles.ts              # Role definitions + checks
│       ├── guards.ts             # Server-side permission guards
│       └── hooks.ts              # Client-side permission hooks
└── components/
    └── permissions/
        ├── RoleGate.tsx          # Show/hide UI based on role
        └── PermissionGate.tsx    # Show/hide based on permission
```

---

## Implementation Details

### `src/lib/permissions/roles.ts`
```typescript
export type Role = 'user' | 'moderator' | 'admin' | 'banned'
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

export const ROLE_HIERARCHY: Record<Role, number> = {
  banned: -1,
  user: 0,
  moderator: 1,
  admin: 2,
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function isBanned(role: Role): boolean {
  return role === 'banned'
}

export function canModerate(role: Role): boolean {
  return hasRole(role, 'moderator')
}

export function isAdmin(role: Role): boolean {
  return hasRole(role, 'admin')
}

// Resource ownership check
export function isOwner(resourceUserId: string, currentUserId: string): boolean {
  return resourceUserId === currentUserId
}

export function canEditResource(
  resourceUserId: string,
  currentUserId: string,
  currentRole: Role
): boolean {
  return isOwner(resourceUserId, currentUserId) || isAdmin(currentRole)
}

export function canDeleteResource(
  resourceUserId: string,
  currentUserId: string,
  currentRole: Role
): boolean {
  return isOwner(resourceUserId, currentUserId) || isAdmin(currentRole)
}
```

### `src/lib/permissions/guards.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasRole, type Role } from './roles'

export async function requireRole(
  requiredRole: Role,
  redirectTo = '/dashboard'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !hasRole(profile.role as Role, requiredRole)) {
    redirect(redirectTo)
  }

  return { user, role: profile.role as Role }
}

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return user
}

// API route guard — returns error response instead of redirecting
export async function apiRequireRole(requiredRole: Role) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized', status: 401, user: null, role: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !hasRole(profile.role as Role, requiredRole)) {
    return { error: 'Forbidden', status: 403, user: null, role: null }
  }

  return { error: null, status: 200, user, role: profile.role as Role }
}
```

### `src/lib/permissions/hooks.ts`
```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Role, hasRole } from './roles'

export function useRole() {
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setRole(data?.role as Role ?? 'user')
          setLoading(false)
        })
    })
  }, [])

  return {
    role,
    loading,
    isAdmin: role ? hasRole(role, 'admin') : false,
    isModerator: role ? hasRole(role, 'moderator') : false,
    isBanned: role === 'banned',
  }
}
```

### `src/components/permissions/RoleGate.tsx`
```typescript
'use client'
import { useRole } from '@/lib/permissions/hooks'
import { type Role, hasRole } from '@/lib/permissions/roles'

export function RoleGate({
  requiredRole,
  children,
  fallback = null,
}: {
  requiredRole: Role
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { role, loading } = useRole()

  if (loading) return null
  if (!role || !hasRole(role, requiredRole)) return <>{fallback}</>
  return <>{children}</>
}
```

---

## Usage Examples (add to dashboard page)

```typescript
// Server-side page protection
import { requireRole } from '@/lib/permissions/guards'

export default async function ModeratorPage() {
  await requireRole('moderator')
  // Only moderators and admins reach here
  return <div>Moderator content</div>
}

// Client-side UI gating
import { RoleGate } from '@/components/permissions/RoleGate'

<RoleGate requiredRole="admin">
  <button>Delete User</button>
</RoleGate>

// API route protection
import { apiRequireRole } from '@/lib/permissions/guards'

export async function DELETE(request: Request) {
  const { error, status } = await apiRequireRole('admin')
  if (error) return NextResponse.json({ error }, { status })
  // Admin-only logic
}
```

---

## Verification Checklist
- [ ] `requireRole('admin')` redirects non-admins
- [ ] `requireRole('moderator')` allows admins and moderators
- [ ] `apiRequireRole` returns 401/403 correctly
- [ ] `RoleGate` shows/hides UI correctly
- [ ] `useRole` hook returns correct role for current user
- [ ] Banned users cannot access any protected routes
- [ ] `canEditResource` returns true for owner and admin only
- [ ] `npm run build` passes clean

---

## When Done — Report Exactly
1. ✅/❌ Role hierarchy works correctly
2. ✅/❌ Server guards redirect correctly
3. ✅/❌ API guards return correct status codes
4. ✅/❌ Client hooks return correct role
5. ✅/❌ RoleGate component shows/hides correctly
6. ✅/❌ `npm run build` passes clean
