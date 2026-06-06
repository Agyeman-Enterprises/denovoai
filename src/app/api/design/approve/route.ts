import { NextResponse } from 'next/server';
import { sessions } from '@/lib/db';
import { requireUserId, UnauthorizedError, unauthorizedResponse } from '@/lib/session';
import { extractSlotmapFromScreens } from '@/lib/generation/extract-slotmap';

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse();
    throw e;
  }

  const { sessionId } = await request.json();
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

  // Load existing slot_map (scoped to user)
  const session = await sessions.getForUser(sessionId, userId);
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const existingSlots = (session.slot_map as Record<string, unknown>) ?? {};

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

  await sessions.updateForUser(sessionId, userId, { slot_map: mergedSlots, stage: 'confirming' });

  return NextResponse.json({ ok: true, nextStep: `/studio/confirm/${sessionId}`, slots: mergedSlots });
}
