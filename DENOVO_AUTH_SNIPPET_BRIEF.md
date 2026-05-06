# DeNovo — Auth Snippet Build Brief
## The foundation every DeNovo app depends on.
## Must work 100% of the time. No exceptions.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE

NEVER:
- Modify Cloudflare DNS, tunnel routes, or ingress rules
- Call any Cloudflare API
- Run `cloudflared` commands
- Touch Traefik config

Your job ends at: all three auth methods work, app runs on port 6001,
build passes clean. Owner handles Cloudflare manually.

---

## Context

DeNovo is an AI-powered app factory. It generates deployable apps from
templates + snippets. This is the Auth Snippet — a standalone,
battle-tested implementation that will be extracted and dropped into
every app DeNovo generates.

It must work perfectly out of the box. Zero auth failures.
Zero broken callbacks. Zero session bugs. Zero compromise.

This is NOT a prototype. This is production-grade reference code.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js latest stable (`npx create-next-app@latest`) |
| Auth | Supabase Auth via `@supabase/ssr` (NOT `@supabase/auth-helpers`) |
| Styling | Tailwind CSS |
| Language | TypeScript strict mode |
| Port | 6001 |
| Deployment | Hetzner via Coolify |

**Critical:** Use `@supabase/ssr` not the deprecated `@supabase/auth-helpers-nextjs`.
**Critical:** Next.js 16 uses `proxy.ts` not `middleware.ts`. Use proxy.ts.

---

## Supabase Project

```
NEXT_PUBLIC_SUPABASE_URL=https://jomualvckaudlcqrfvxv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXVhbHZja2F1ZGxjcXJmdnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NjUwNDIsImV4cCI6MjA4ODM0MTA0Mn0.nlMkdRyIMQ18Uf6MThIJn1kbN63VdArQ-p5Mw-_4Z-A
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvbXVhbHZja2F1ZGxjcXJmdnh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc2NTA0MiwiZXhwIjoyMDg4MzQxMDQyfQ.3Hoz8-brzx8eX4kibH_hVcRdz645dn5HfVoAtUvbA9c
```

---

## Supabase Dashboard — Owner Must Set Before Testing

In Supabase → Authentication → URL Configuration set:
```
Site URL:       http://localhost:6001
Redirect URLs:  http://localhost:6001/auth/callback
                https://snippet-harness.agyemanenterprises.com/auth/callback
```

For Google OAuth — in Supabase → Authentication → Providers → Google:
Owner provides Client ID and Secret from Google Cloud Console.

---

## Database Schema

Apply this first:

```sql
-- Profiles (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text check (role in ('user', 'admin')) default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- RLS
alter table profiles enable row level security;
create policy "users read own profile"
  on profiles for select using (auth.uid() = id);
create policy "users update own profile"
  on profiles for update using (auth.uid() = id);
```

---

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Public landing — sign in CTA
│   ├── layout.tsx                  # Root layout
│   ├── globals.css
│   │
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx            # Login page — all 3 methods
│   │   ├── callback/
│   │   │   └── route.ts            # Exchange code for session
│   │   ├── confirm/
│   │   │   └── route.ts            # Magic link confirmation
│   │   └── signout/
│   │       └── route.ts            # Sign out handler
│   │
│   ├── dashboard/
│   │   ├── layout.tsx              # Protected layout
│   │   └── page.tsx                # Protected dashboard
│   │
│   └── api/
│       └── health/
│           └── route.ts            # Health check
│
├── lib/
│   └── supabase/
│       ├── client.ts               # Browser client
│       ├── server.ts               # Server client (cookies)
│       └── middleware.ts           # Session refresh helper
│
└── proxy.ts                        # Next.js 16 route protection
```

---

## Implementation Details

### `src/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `src/lib/supabase/server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

### `proxy.ts` (Next.js 16 — NOT middleware.ts)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — critical, do not remove
  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from login
  if (user && request.nextUrl.pathname === '/auth/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### `src/app/auth/callback/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
```

### `src/app/auth/signout/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/auth/login', request.url))
}
```

---

## Login Page — All Three Methods

`src/app/auth/login/page.tsx` must implement:

### Method 1: Magic Link
```typescript
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
})
```
Show success message: "Check your email for a magic link."

### Method 2: Google OAuth
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

### Method 3: Email + Password
```typescript
// Sign up
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
})

// Sign in
const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

---

## Protected Dashboard

`src/app/dashboard/layout.tsx` — verify session server-side:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <>{children}</>
}
```

`src/app/dashboard/page.tsx` — show user info + sign out:
```typescript
// Show: user email, user id, profile display_name
// Sign out button → POST /auth/signout
```

---

## Health Check

`src/app/api/health/route.ts`:
```typescript
export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'denovo-snippet-harness',
    version: '1.0.0'
  })
}
```

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:6001
```

---

## Coolify Config

- Port: **6001**
- Health check: `/api/health`
- Domain: `https://snippet-harness.agyemanenterprises.com` (owner adds to Cloudflare manually)
- Do NOT configure Cloudflare

---

## Build Verification

All must pass:
```bash
npm run build   # zero errors, zero type errors
```

Manually test each flow before declaring done:
- [ ] Magic link email sends and callback works
- [ ] Google OAuth redirects and returns session
- [ ] Email/password signup confirms and logs in
- [ ] Email/password signin works
- [ ] `/dashboard` redirects to login when not authenticated
- [ ] `/auth/login` redirects to dashboard when already authenticated
- [ ] Sign out clears session and redirects to login
- [ ] Hard refresh on `/dashboard` while logged in keeps session

---

## What You Are NOT Doing

- ❌ Cloudflare — not even to look at it
- ❌ Building a full app — this is a snippet reference only
- ❌ Adding features beyond auth
- ❌ Using `@supabase/auth-helpers-nextjs` — it's deprecated
- ❌ Using `middleware.ts` — Next.js 16 uses `proxy.ts`
- ❌ Changing the port from 6001

---

## When Done — Report Exactly

1. ✅/❌ Schema applied and trigger created
2. ✅/❌ Magic link — sends email, callback works, lands on dashboard
3. ✅/❌ Google OAuth — redirects, returns, lands on dashboard
4. ✅/❌ Email/password — signup and signin both work
5. ✅/❌ Route protection — unauthenticated blocked, authenticated redirected
6. ✅/❌ Sign out — clears session, redirects to login
7. ✅/❌ `npm run build` passes clean
8. Port running on: must be **6001**

Then stop. Do not attempt Cloudflare or DNS configuration.
