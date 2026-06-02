import { callLiteLLM } from '@/lib/litellm';
import { createServerSupabase } from '@/lib/supabase/server';
import { Client as MinioClient } from 'minio';
import type { SlotMap } from '@/types/denovo';

function getMinioClient() {
  return new MinioClient({
    endPoint:  process.env.MINIO_ENDPOINT!,
    port:      parseInt(process.env.MINIO_PORT ?? '443'),
    useSSL:    process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  });
}

async function readFromMinio(bucket: string, path: string): Promise<string> {
  const minio = getMinioClient();
  const stream = await minio.getObject(bucket, path);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export async function extractSlotmapFromScreens(sessionId: string): Promise<Partial<SlotMap>> {
  const supabase = await createServerSupabase();
  const bucket = process.env.MINIO_BUCKET_DESIGNS ?? 'ae-design-screens';

  // Load active variants for this session (up to 6 screens — enough context without blowing the token budget)
  const { data: variants } = await supabase
    .schema('design')
    .from('variants')
    .select('storage_path, screens(name, screen_type)')
    .eq('is_active', true)
    .limit(6);

  if (!variants || variants.length === 0) return {};

  // Read TSX content for each variant
  const screenSamples: string[] = [];
  for (const v of variants) {
    if (!v.storage_path) continue;
    try {
      const code = await readFromMinio(bucket, v.storage_path);
      const screensVal = v.screens as unknown;
      const screenName = (screensVal as { name: string } | null)?.name ?? 'screen';
      // Trim to first 800 chars per screen — enough for color/structure analysis
      screenSamples.push(`=== ${screenName} ===\n${code.slice(0, 800)}`);
    } catch {
      // MinIO read failed — skip this screen
    }
  }

  if (screenSamples.length === 0) return {};

  const prompt = `Analyze these generated React/Tailwind UI screens and extract design metadata for the DeNovo slot map.

SCREENS:
${screenSamples.join('\n\n')}

Extract ONLY what you can directly observe in the code. Look for:
1. PRIMARY_COLOR — the dominant brand color (hex, from className like bg-[#...] or text-[#...] or from common Tailwind brand colors like bg-blue-600 → #2563eb)
2. APP_NAME — if visible in the code as text/heading content
3. SNIPPETS — which modules are clearly implemented: auth, stripe-connect, stripe-simple, reviews, messaging, bookings, file-upload, search-filter, notifications, admin-panel
4. SCHEMA_EXTRAS — custom field names you see used (column names, property names in mock data)

Return ONLY valid JSON (no markdown, no explanation):
{
  "PRIMARY_COLOR": "#hex or null",
  "APP_NAME": "name or null",
  "SNIPPETS": ["snippet-name", ...],
  "SCHEMA_EXTRAS": ["field_name", ...]
}`;

  // Tier 5 (sonnet) — needs code comprehension
  const raw = await callLiteLLM({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  }).catch(() => null);

  if (!raw) return {};

  try {
    const extracted = JSON.parse(raw) as {
      PRIMARY_COLOR?: string | null;
      APP_NAME?: string | null;
      SNIPPETS?: string[];
      SCHEMA_EXTRAS?: string[];
    };

    const result: Partial<SlotMap> = {};
    if (extracted.PRIMARY_COLOR && extracted.PRIMARY_COLOR !== 'null') {
      result.PRIMARY_COLOR = extracted.PRIMARY_COLOR;
    }
    if (extracted.APP_NAME && extracted.APP_NAME !== 'null') {
      result.APP_NAME = extracted.APP_NAME;
    }
    if (Array.isArray(extracted.SNIPPETS) && extracted.SNIPPETS.length > 0) {
      result.SNIPPETS = extracted.SNIPPETS;
    }
    if (Array.isArray(extracted.SCHEMA_EXTRAS) && extracted.SCHEMA_EXTRAS.length > 0) {
      result.SCHEMA_EXTRAS = extracted.SCHEMA_EXTRAS;
    }
    return result;
  } catch {
    return {};
  }
}
