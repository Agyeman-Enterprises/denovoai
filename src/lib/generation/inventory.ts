import { callLiteLLM } from '@/lib/litellm';
import { INVENTORY_SYSTEM_PROMPT } from './system-prompt';

export interface ScreenSpec {
  name: string;
  purpose: string;
  screen_type: 'main' | 'alternative' | 'error' | 'empty' | 'confirmation' | 'mobile' | 'onboarding';
}

export async function generateInventory(appDescription: string, sessionContext?: string): Promise<ScreenSpec[]> {
  const userContent = [
    `App description: ${appDescription}`,
    sessionContext ? `Additional context: ${sessionContext}` : '',
    'Generate the complete screen inventory for this app.',
  ].filter(Boolean).join('\n\n');

  // Tier 2 (kimi) — cheap inventory pass, no heavy reasoning needed
  const raw = await callLiteLLM({
    model: 'kimi',
    max_tokens: 2048,
    messages: [
      { role: 'system', content: INVENTORY_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
  });

  let parsed: { screens: ScreenSpec[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fallback: try extracting JSON from the response
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('inventory: failed to parse JSON from LLM response');
    parsed = JSON.parse(match[0]);
  }

  if (!Array.isArray(parsed.screens) || parsed.screens.length === 0) {
    throw new Error('inventory: LLM returned empty screens array');
  }

  // Sort by name (numeric prefix ensures ordering)
  return parsed.screens.sort((a, b) => a.name.localeCompare(b.name));
}
