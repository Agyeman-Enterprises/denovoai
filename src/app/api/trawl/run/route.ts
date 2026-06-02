import { NextResponse } from 'next/server';

// Protected trigger — only callable with CRON_SECRET header.
// Does NOT run Playwright inline (serverless timeout).
// Actual trawl runs via: npx tsx scripts/trawl-daily.mts on Hetzner cron.
// This endpoint records intent and can be used to trigger the Hetzner job via webhook.

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO Phase 5: call Hetzner webhook or queue job to run trawl-daily.mts
  // For now: return acknowledgement — run the script manually on Hetzner
  return NextResponse.json({
    status: 'acknowledged',
    message: 'Trawl triggered. Run: npx tsx scripts/trawl-daily.mts on Hetzner.',
    timestamp: new Date().toISOString(),
  });
}
