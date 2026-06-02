import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { generateInventory } from '@/lib/generation/inventory';

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await request.json();
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

  const { data: session } = await supabase
    .from('sessions')
    .select('slot_map, messages')
    .eq('id', sessionId)
    .single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const slotMap = (session.slot_map as Record<string, unknown>) ?? {};
  const messages = (session.messages as Array<{ role: string; content: string }>) ?? [];
  const appDesc = [slotMap['APP_NAME'], slotMap['TAGLINE'], `Template: ${slotMap['TEMPLATE']}`]
    .filter(Boolean).join(' — ');
  const userMsgs = messages.filter(m => m.role === 'user').slice(-3).map(m => m.content).join('\n');

  const screens = await generateInventory(appDesc, userMsgs);
  return NextResponse.json({ screens });
}
