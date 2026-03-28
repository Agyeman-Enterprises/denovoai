# DeNovo — Messaging Snippet Brief
## Real-time buyer/seller chat. Supabase Realtime. Thread-based.
## Adds to existing harness on port 6001.

---

## 🚨 CLOUDFLARE — ABSOLUTE NO-TOUCH ZONE
NEVER touch Cloudflare, DNS, tunnels, Traefik. Add to port 6001. Stop there.

---

## Database Schema (add to existing)

```sql
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid references profiles(id) on delete cascade,
  participant_b uuid references profiles(id) on delete cascade,
  entity_type text,           -- 'order', 'listing', etc.
  entity_id uuid,
  last_message_at timestamptz,
  created_at timestamptz default now(),
  unique(participant_a, participant_b, entity_type, entity_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text not null,
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists messages_conversation_idx
  on messages(conversation_id, created_at asc);

alter table conversations enable row level security;
alter table messages enable row level security;

create policy "participants see conversations" on conversations
  for select using (
    auth.uid() = participant_a or auth.uid() = participant_b
  );

create policy "participants see messages" on messages
  for select using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
      and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

create policy "participants send messages" on messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from conversations c
      where c.id = conversation_id
      and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );
```

---

## New Files to Add

```
src/
├── app/
│   └── dashboard/
│       └── messages/
│           ├── page.tsx              # Conversation list
│           └── [conversationId]/
│               └── page.tsx          # Message thread
└── api/
    └── messages/
        ├── route.ts                  # GET conversations, POST new conversation
        └── [conversationId]/
            └── route.ts              # GET messages, POST send message
```

---

## Implementation Details

### `src/app/api/messages/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('conversations')
    .select(`
      *,
      participant_a_profile:profiles!conversations_participant_a_fkey(id, display_name, avatar_url),
      participant_b_profile:profiles!conversations_participant_b_fkey(id, display_name, avatar_url),
      messages(id, body, sender_id, read, created_at)
    `)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recipientId, entityType, entityId, firstMessage } = await request.json()

  // Get or create conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(participant_a.eq.${user.id},participant_b.eq.${recipientId}),and(participant_a.eq.${recipientId},participant_b.eq.${user.id})`)
    .eq('entity_type', entityType ?? null)
    .eq('entity_id', entityId ?? null)
    .single()

  let conversationId = existing?.id

  if (!conversationId) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        participant_a: user.id,
        participant_b: recipientId,
        entity_type: entityType,
        entity_id: entityId,
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    conversationId = newConv?.id
  }

  if (firstMessage && conversationId) {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: firstMessage,
    })
  }

  return NextResponse.json({ conversationId })
}
```

### `src/app/api/messages/[conversationId]/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  // Mark messages from other party as read
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('read', false)

  return NextResponse.json(data)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body } = await request.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const { data } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, body })
    .select()
    .single()

  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  return NextResponse.json(data)
}
```

### Message Thread Page — Real-time
```typescript
// src/app/dashboard/messages/[conversationId]/page.tsx
// Key implementation:
// 1. Load messages on mount via GET /api/messages/[conversationId]
// 2. Subscribe to Supabase Realtime for new messages
// 3. Send via POST /api/messages/[conversationId]
// 4. Auto-scroll to bottom on new message
// 5. Show sender name + avatar + timestamp per message
// 6. Input box at bottom — send on Enter or button click

// Real-time subscription:
const channel = supabase
  .channel(`messages:${conversationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`,
  }, (payload) => {
    setMessages(prev => [...prev, payload.new])
  })
  .subscribe()
```

---

## Verification Checklist
- [ ] Conversation created between two users
- [ ] Messages send and appear in thread
- [ ] Real-time subscription delivers messages without refresh
- [ ] Messages marked as read when viewed by recipient
- [ ] Conversation list shows most recent first
- [ ] Cannot read conversations you're not part of (RLS)
- [ ] Cannot send messages to conversations you're not part of
- [ ] `npm run build` passes clean

---

## When Done — Report Exactly
1. ✅/❌ conversations + messages tables created with RLS
2. ✅/❌ Conversation create + message send work
3. ✅/❌ Real-time delivers messages live
4. ✅/❌ Read receipts update correctly
5. ✅/❌ `npm run build` passes clean
