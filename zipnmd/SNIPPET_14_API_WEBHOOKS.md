# DeNovo — API + Webhooks Snippet Brief
## Public REST API, API keys, rate limiting, outbound webhooks.
## Adds to existing harness on port 6001.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Add to port 6001. Stop there.

---

## Dependencies to Install
```bash
npm install crypto uuid
```

---

## Database Schema (add to existing)

```sql
-- API keys
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  key_hash text unique not null,   -- hashed — never store plain
  key_prefix text not null,        -- first 8 chars for display e.g. "dnv_sk_a"
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Webhook endpoints (outbound)
create table if not exists webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  url text not null,
  secret text not null,             -- for signing payloads
  events text[] not null,           -- ['order.created', 'order.completed']
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Webhook delivery log
create table if not exists webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid references webhook_endpoints(id) on delete cascade,
  event text not null,
  payload jsonb not null,
  response_status int,
  response_body text,
  delivered_at timestamptz,
  failed boolean default false,
  created_at timestamptz default now()
);

-- API rate limiting (simple token bucket per user)
create table if not exists rate_limit_buckets (
  user_id uuid primary key references profiles(id) on delete cascade,
  tokens int default 100,
  last_refill timestamptz default now()
);

alter table api_keys enable row level security;
alter table webhook_endpoints enable row level security;
alter table webhook_deliveries enable row level security;

create policy "own api keys" on api_keys for all using (auth.uid() = user_id);
create policy "own webhook endpoints" on webhook_endpoints for all using (auth.uid() = user_id);
create policy "own webhook deliveries" on webhook_deliveries
  for select using (
    exists (
      select 1 from webhook_endpoints w
      where w.id = endpoint_id and w.user_id = auth.uid()
    )
  );
```

---

## New Files to Add

```
src/
├── app/
│   ├── dashboard/
│   │   └── api-keys/
│   │       └── page.tsx              # Manage API keys + webhooks
│   └── api/
│       ├── v1/
│       │   └── [...path]/route.ts    # Public API handler
│       └── webhooks/
│           ├── route.ts              # Manage webhook endpoints
│           └── deliver/route.ts     # Internal — trigger delivery
└── lib/
    └── api/
        ├── keys.ts                   # API key generation + verification
        ├── ratelimit.ts              # Rate limiting logic
        └── webhooks.ts              # Webhook delivery logic
```

---

## Implementation Details

### `src/lib/api/keys.ts`
```typescript
import crypto from 'crypto'

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw = `dnv_sk_${crypto.randomBytes(24).toString('hex')}`
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  const prefix = raw.slice(0, 12)
  return { key: raw, hash, prefix }
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function verifyApiKey(key: string, supabase: any) {
  const hash = hashApiKey(key)

  const { data } = await supabase
    .from('api_keys')
    .select('*, profiles(id, role)')
    .eq('key_hash', hash)
    .eq('is_active', true)
    .single()

  if (!data) return null
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null

  // Update last used
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return data
}
```

### `src/lib/api/webhooks.ts`
```typescript
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export function signWebhookPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export async function deliverWebhook(
  userId: string,
  event: string,
  data: any
) {
  const { data: endpoints } = await supabaseAdmin
    .from('webhook_endpoints')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [event])

  for (const endpoint of endpoints ?? []) {
    const payload = JSON.stringify({
      event,
      created_at: new Date().toISOString(),
      data,
    })
    const signature = signWebhookPayload(payload, endpoint.secret)

    let responseStatus: number | null = null
    let responseBody: string | null = null
    let failed = false

    try {
      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
        },
        body: payload,
        signal: AbortSignal.timeout(10000), // 10s timeout
      })
      responseStatus = res.status
      responseBody = await res.text()
      failed = res.status >= 400
    } catch (err) {
      failed = true
      responseBody = String(err)
    }

    await supabaseAdmin.from('webhook_deliveries').insert({
      endpoint_id: endpoint.id,
      event,
      payload: data,
      response_status: responseStatus,
      response_body: responseBody,
      delivered_at: new Date().toISOString(),
      failed,
    })
  }
}
```

### API key management routes
```typescript
// POST /api/v1/keys — create new API key
// Returns the key ONCE — never again
const { key, hash, prefix } = generateApiKey()
await supabase.from('api_keys').insert({
  user_id: user.id,
  name,
  key_hash: hash,
  key_prefix: prefix,
})
return NextResponse.json({ key }) // Show once, then never again

// DELETE /api/v1/keys/[id] — revoke key
await supabase.from('api_keys')
  .update({ is_active: false })
  .eq('id', keyId)
  .eq('user_id', user.id)
```

---

## Verification Checklist
- [ ] API key generated — shown once only, hash stored
- [ ] API key verification works against hash
- [ ] Expired/inactive keys rejected
- [ ] Webhook endpoint created with secret
- [ ] Webhook delivery fires to correct URL
- [ ] Signature verification works
- [ ] Failed deliveries logged correctly
- [ ] API key management page shows prefix, not full key
- [ ] `npm run build` passes clean

---

## When Done — Report Exactly
1. ✅/❌ API key tables created
2. ✅/❌ Key generation + verification works
3. ✅/❌ Webhook delivery fires and logs result
4. ✅/❌ Signature signing + verification works
5. ✅/❌ `npm run build` passes clean
