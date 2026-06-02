import { callLiteLLM } from '@/lib/litellm';
import { createServerSupabase } from '@/lib/supabase/server';
import { SCREEN_GENERATION_SYSTEM_PROMPT } from './system-prompt';
import type { ScreenSpec } from './inventory';
import type { DesignTokens } from '@/lib/trawl/types';
import { Client as MinioClient } from 'minio';

function getMinioClient() {
  return new MinioClient({
    endPoint:  process.env.MINIO_ENDPOINT!,
    port:      parseInt(process.env.MINIO_PORT ?? '443'),
    useSSL:    process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  });
}

const DESIGNS_BUCKET = () => process.env.MINIO_BUCKET_DESIGNS ?? 'ae-design-screens';

export interface GeneratedScreen {
  screen: ScreenSpec;
  variantId: string;
  storagePath: string;
  htmlPreview: string;
}

function buildScreenPrompt(
  screen: ScreenSpec,
  appDescription: string,
  tokens: DesignTokens | null,
): string {
  const lines = [
    `App: ${appDescription}`,
    `Screen: ${screen.name}`,
    `Purpose: ${screen.purpose}`,
    `Type: ${screen.screen_type}`,
  ];

  if (tokens) {
    lines.push('');
    lines.push('Design tokens from real-world design references:');
    lines.push(`Primary color: ${tokens.colors.primary}`);
    lines.push(`Background: ${tokens.colors.background}`);
    lines.push(`Heading font: ${tokens.typography.heading?.fontFamily ?? 'Inter'}`);
    lines.push(`Body font: ${tokens.typography.body?.fontFamily ?? 'Inter'}`);
    lines.push(`Border radius: ${tokens.radii.md ?? '8px'}`);
  }

  lines.push('');
  lines.push('Generate the complete React component for this screen.');

  return lines.join('\n');
}

function tsxToHtmlPreview(tsx: string): string {
  // Strip imports and export statement for a lightweight HTML preview shell
  const bodyMatch = tsx.match(/return\s*\(([\s\S]*?)\);?\s*\}/);
  const body = bodyMatch?.[1]?.trim() ?? tsx;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"></script></head><body>${body}</body></html>`;
}

export async function generateScreen(
  sessionId: string,
  screenId: string,
  screen: ScreenSpec,
  appDescription: string,
  tokens: DesignTokens | null,
): Promise<GeneratedScreen> {
  const prompt = buildScreenPrompt(screen, appDescription, tokens);

  // Tier 5 (sonnet) — code generation requires quality
  const tsx = await callLiteLLM({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      { role: 'system', content: SCREEN_GENERATION_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });

  // Generate lightweight HTML preview — Tier 2 (kimi), cheap render pass
  const htmlPreview = await callLiteLLM({
    model: 'kimi',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Convert this React/Tailwind TSX component to a plain HTML page with inline Tailwind CDN. Return ONLY the full HTML document, no explanation:\n\n${tsx}`,
      },
    ],
  }).catch(() => tsxToHtmlPreview(tsx));

  // Store TSX in MinIO
  const minio = getMinioClient();
  const bucket = DESIGNS_BUCKET();
  const exists = await minio.bucketExists(bucket);
  if (!exists) await minio.makeBucket(bucket);

  const storagePath = `${sessionId}/screens/${screen.name}.tsx`;
  const buf = Buffer.from(tsx, 'utf-8');
  await minio.putObject(bucket, storagePath, buf, buf.length, { 'Content-Type': 'text/plain' });

  // Insert variant row
  const supabase = await createServerSupabase();
  const { data: variant, error } = await supabase
    .schema('design')
    .from('variants')
    .insert({
      screen_id:    screenId,
      storage_path: storagePath,
      html_preview: htmlPreview,
      is_active:    true,
      prompt_used:  prompt,
      model_used:   'claude-sonnet-4-6',
    })
    .select('id')
    .single();

  if (error) throw new Error(`generateScreen: variant insert failed: ${error.message}`);

  return {
    screen,
    variantId: (variant as { id: string }).id,
    storagePath,
    htmlPreview,
  };
}
