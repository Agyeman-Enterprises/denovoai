import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { extractSlotmapFromScreens } from '@/lib/generation/extract-slotmap';

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await request.json();
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

  // Load existing slot_map
  const { data: session } = await supabase
    .from('sessions')
    .select('slot_map')
    .eq('id', sessionId)
    .single();

  const existingSlots = (session?.slot_map as Record<string, unknown>) ?? {};

  // Extract design insights from generated screens (non-blocking — empty result is fine)
  const designSlots = await extractSlotmapFromScreens(sessionId).catch(() => ({}));

  // Merge: design findings override parse guesses for visual tokens (color, name)
  // but don't override existing explicit values that are more complete (SNIPPETS, SCHEMA_EXTRAS get merged)
  const ds = designSlots as Record<string, unknown>;
  const existingSnippets = (existingSlots['SNIPPETS'] as string[] | undefined) ?? [];
  const designSnippets = (ds['SNIPPETS'] as string[] | undefined) ?? [];
  const mergedSnippets = [...new Set([...existingSnippets, ...designSnippets])];

  const existingExtras = (existingSlots['SCHEMA_EXTRAS'] as string[] | undefined) ?? [];
  const designExtras = (ds['SCHEMA_EXTRAS'] as string[] | undefined) ?? [];
  const mergedExtras = [...new Set([...existingExtras, ...designExtras])];

  const mergedSlots = {
    ...existingSlots,
    ...designSlots,
    SNIPPETS: mergedSnippets.length > 0 ? mergedSnippets : existingSlots['SNIPPETS'],
    SCHEMA_EXTRAS: mergedExtras.length > 0 ? mergedExtras : existingSlots['SCHEMA_EXTRAS'],
  };

  await supabase
    .from('sessions')
    .update({ slot_map: mergedSlots, stage: 'confirming', updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  return NextResponse.json({ ok: true, nextStep: `/studio/confirm/${sessionId}`, slots: mergedSlots });
}
