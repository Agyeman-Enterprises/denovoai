import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { generateScreen } from '@/lib/generation/generate-screen';
import { retrieveDesignTokens } from '@/lib/design-memory/design-retrieval';
import type { ScreenSpec } from '@/lib/generation/inventory';

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { variantId, instruction } = await request.json();
  if (!variantId) return NextResponse.json({ error: 'Missing variantId' }, { status: 400 });

  // Load variant → screen → session
  const { data: variant } = await supabase
    .schema('design')
    .from('variants')
    .select('screen_id, prompt_used')
    .eq('id', variantId)
    .single();

  if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });

  const { data: screen } = await supabase
    .schema('design')
    .from('screens')
    .select('*, sessions(slot_map)')
    .eq('id', variant.screen_id)
    .single();

  if (!screen) return NextResponse.json({ error: 'Screen not found' }, { status: 404 });

  const slotMap = (screen.sessions as { slot_map: Record<string, unknown> })?.slot_map ?? {};
  const appDesc = [slotMap['APP_NAME'], slotMap['TAGLINE']].filter(Boolean).join(' — ');
  const template = String(slotMap['TEMPLATE'] ?? 'saas');

  const spec: ScreenSpec = {
    name: screen.name as string,
    purpose: instruction
      ? `${screen.purpose as string}. Edit instruction: ${instruction}`
      : screen.purpose as string,
    screen_type: screen.screen_type as ScreenSpec['screen_type'],
  };

  const tokens = await retrieveDesignTokens({
    domain: 'saas',
    brandIntent: 'modern',
  }).catch(() => null);

  // Deactivate existing variants for this screen
  await supabase
    .schema('design')
    .from('variants')
    .update({ is_active: false })
    .eq('screen_id', variant.screen_id);

  const result = await generateScreen(
    screen.session_id as string,
    variant.screen_id as string,
    spec,
    appDesc || template,
    tokens,
  );

  return NextResponse.json({ variantId: result.variantId, htmlPreview: result.htmlPreview });
}
