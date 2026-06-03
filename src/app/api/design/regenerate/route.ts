import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireUserId, UnauthorizedError, unauthorizedResponse } from '@/lib/session';
import { generateScreen } from '@/lib/generation/generate-screen';
import { retrieveDesignTokens } from '@/lib/design-memory/design-retrieval';
import type { ScreenSpec } from '@/lib/generation/inventory';

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) return unauthorizedResponse();
    throw e;
  }

  const { variantId, instruction } = await request.json();
  if (!variantId) return NextResponse.json({ error: 'Missing variantId' }, { status: 400 });

  // variant → screen → session, scoped to the session's owner.
  const rows = await sql<{
    screen_id: string; session_id: string; name: string; purpose: string;
    screen_type: ScreenSpec['screen_type']; slot_map: Record<string, unknown>;
  }[]>`
    SELECT v.screen_id, s.session_id, s.name, s.purpose, s.screen_type, ss.slot_map
    FROM design.variants v
    JOIN design.screens s   ON s.id = v.screen_id
    JOIN public.sessions ss ON ss.id = s.session_id
    WHERE v.id = ${variantId} AND ss.user_id = ${userId}`;

  const row = rows[0];
  if (!row) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });

  const slotMap = row.slot_map ?? {};
  const appDesc = [slotMap['APP_NAME'], slotMap['TAGLINE']].filter(Boolean).join(' — ');
  const template = String(slotMap['TEMPLATE'] ?? 'saas');

  const spec: ScreenSpec = {
    name: row.name,
    purpose: instruction ? `${row.purpose}. Edit instruction: ${instruction}` : row.purpose,
    screen_type: row.screen_type,
  };

  const tokens = await retrieveDesignTokens({ domain: 'saas', brandIntent: 'modern' }).catch(() => null);

  // Deactivate existing variants for this screen
  await sql`UPDATE design.variants SET is_active = false WHERE screen_id = ${row.screen_id}`;

  const result = await generateScreen(row.session_id, row.screen_id, spec, appDesc || template, tokens);

  return NextResponse.json({ variantId: result.variantId, htmlPreview: result.htmlPreview });
}
