import { createServerSupabase } from '@/lib/supabase/server';
import { generateInventory } from './inventory';
import { generateScreen } from './generate-screen';
import { retrieveDesignTokens } from '@/lib/design-memory/design-retrieval';
import type { ScreenSpec } from './inventory';
import type { DesignTokens, ProductSpec } from '@/lib/trawl/types';

export interface GenerationProgress {
  total: number;
  completed: number;
  failed: number;
  screens: Array<{ name: string; status: 'pending' | 'done' | 'failed'; variantId?: string }>;
}

// Infer a ProductSpec from the SlotMap template type
function slotMapToProductSpec(template: string): ProductSpec {
  const domainMap: Record<string, ProductSpec['domain']> = {
    marketplace:   'ecommerce',
    saas:          'saas',
    directory:     'saas',
    community:     'saas',
    ecommerce:     'ecommerce',
    'client-portal': 'saas',
    'internal-tool': 'saas',
    'content-media': 'general',
  };
  return {
    domain: domainMap[template] ?? 'general',
    brandIntent: 'modern',
  };
}

export async function generateAllScreens(sessionId: string): Promise<GenerationProgress> {
  const supabase = await createServerSupabase();

  // Load session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('slot_map, messages')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) throw new Error(`generateAllScreens: session ${sessionId} not found`);

  const slotMap = (session.slot_map as Record<string, unknown>) ?? {};
  const messages = (session.messages as Array<{ role: string; content: string }>) ?? [];

  // Build app description from slot map + conversation
  const appName    = String(slotMap['APP_NAME'] ?? 'My App');
  const tagline    = String(slotMap['TAGLINE'] ?? '');
  const template   = String(slotMap['TEMPLATE'] ?? 'saas');
  const appDesc    = [appName, tagline, `Template: ${template}`].filter(Boolean).join(' — ');

  // Pull conversation context (last 3 user messages)
  const userMsgs = messages
    .filter(m => m.role === 'user')
    .slice(-3)
    .map(m => m.content)
    .join('\n');

  // Stage 1: generate screen inventory (Tier 2 — cheap)
  const specs: ScreenSpec[] = await generateInventory(appDesc, userMsgs);

  // Insert screen rows
  const { data: insertedScreens, error: insertError } = await supabase
    .schema('design')
    .from('screens')
    .insert(
      specs.map((s, i) => ({
        session_id:  sessionId,
        name:        s.name,
        purpose:     s.purpose,
        screen_type: s.screen_type,
        position:    i,
      }))
    )
    .select('id, name');

  if (insertError || !insertedScreens) throw new Error(`generateAllScreens: screen insert failed: ${insertError?.message}`);

  const screenMap = new Map<string, string>(
    (insertedScreens as Array<{ id: string; name: string }>).map(s => [s.name, s.id])
  );

  // Fetch trawl-grounded design tokens (null-safe — falls back to defaults)
  const productSpec = slotMapToProductSpec(template);
  let tokens: DesignTokens | null = null;
  try {
    tokens = await retrieveDesignTokens(productSpec);
  } catch {
    // trawl_sources empty or unavailable — generation continues without tokens
  }

  // Stage 2: generate each screen in parallel (Tier 5 — sonnet)
  const progress: GenerationProgress = {
    total:     specs.length,
    completed: 0,
    failed:    0,
    screens:   specs.map(s => ({ name: s.name, status: 'pending' })),
  };

  await Promise.all(
    specs.map(async (spec, i) => {
      const screenId = screenMap.get(spec.name);
      if (!screenId) { progress.failed++; return; }

      try {
        const result = await generateScreen(sessionId, screenId, spec, appDesc, tokens);
        progress.screens[i] = { name: spec.name, status: 'done', variantId: result.variantId };
        progress.completed++;
      } catch (err) {
        console.error(`[generation] Failed ${spec.name}:`, (err as Error).message);
        progress.screens[i] = { name: spec.name, status: 'failed' };
        progress.failed++;
      }
    })
  );

  // Advance session stage to 'design'
  await supabase
    .from('sessions')
    .update({ stage: 'design', updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  return progress;
}
