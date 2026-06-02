/**
 * Daily trawl — populates design.trawl_sources with real design museum content.
 * Run: npx tsx scripts/trawl-daily.mts
 *
 * Requires Playwright browsers: npx playwright install chromium
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';

config({ path: fileURLToPath(new URL('../.env.local', import.meta.url)) });

const { runBatch } = await import('../src/lib/trawl/index.js');

const SEED_URLS: string[] = [
  // Gallery / curation hubs
  'https://www.awwwards.com/websites/',
  'https://land-book.com/websites',
  'https://www.cssdesignawards.com',
  'https://www.siteinspire.com',
  'https://www.thefwa.com/winners',
  'https://dribbble.com/shots/popular',
  'https://www.behance.net/galleries',
  'https://www.lapa.ninja',
  'https://saaspages.xyz',
  'https://saaslandingpage.com',
  'https://www.cofolios.com',
  'https://mobbin.com/apps',
  'https://pageflows.com',
  'https://hoverstat.es',

  // Editorial / typographic
  'https://www.nytimes.com',
  'https://www.theatlantic.com',
  'https://www.monocle.com',
  'https://practicaltypography.com',
  'https://www.typewolf.com',

  // Design studios
  'https://www.pentagram.com',
  'https://www.wearecollins.com',
  'https://www.fantasy.co',
  'https://www.instrument.com',
  'https://locomotive.ca',
  'https://www.activetheory.net',
  'https://www.area17.com',
  'https://work.co',
  'https://www.resn.global',

  // Dark mode / immersive
  'https://linear.app',
  'https://vercel.com',
  'https://www.apple.com',
  'https://supabase.com',
  'https://www.spotify.com',

  // Minimal / airy
  'https://notion.so',
  'https://resend.com',
  'https://cal.com',
  'https://dub.co',
  'https://cron.com',

  // Bold / expressive
  'https://mailchimp.com',
  'https://www.duolingo.com',
  'https://www.figma.com',
  'https://basecamp.com',

  // Organic / warm
  'https://www.airbnb.com',
  'https://www.patagonia.com',
  'https://www.kickstarter.com',

  // Luxury
  'https://www.chanel.com',
  'https://www.net-a-porter.com',
  'https://www.rolls-roycemotorcars.com',

  // Brutalist / editorial-stark
  'https://www.bloomberg.com',
  'https://www.balenciaga.com',

  // Geometric / Swiss
  'https://www.muji.com',
  'https://www.stripe.com',

  // Motion-forward
  'https://www.lego.com',
  'https://framer.com',
  'https://webflow.com',

  // Design system references
  'https://tailwindcss.com',
  'https://radix-ui.com',
  'https://ui.shadcn.com',
  'https://posthog.com',
];

async function main() {
  console.log('=======================================================');
  console.log(' AE Design Studio Museum Trawl');
  console.log(` Seed URLs: ${SEED_URLS.length}`);
  console.log('=======================================================');

  const summary = await runBatch(SEED_URLS, {
    concurrency: 3,
    retries: 1,
    trigger: 'daily-cron',
    triggered_by: 'trawl-daily.mts',
    capture_screenshot: false,
  });

  console.log('\n=======================================================');
  console.log(' TRAWL COMPLETE');
  console.log(`  Run ID:   ${summary.run_id}`);
  console.log(`  Status:   ${summary.status}`);
  console.log(`  Success:  ${summary.urls_succeeded}/${summary.urls_requested}`);
  console.log(`  Failed:   ${summary.urls_failed}`);
  console.log(`  Skipped:  ${summary.urls_skipped}`);
  console.log(`  Duration: ${(summary.duration_ms / 1000).toFixed(1)}s`);
  console.log('=======================================================\n');

  if (summary.urls_failed > 0) {
    console.log('Failed URLs:');
    summary.results
      .filter(r => r.status === 'FAILED')
      .forEach(r => console.log(`  FAIL ${r.url}: ${r.error ?? 'unknown'}`));
  }

  process.exit(summary.urls_succeeded === 0 ? 1 : 0);
}

main().catch(err => {
  console.error('[trawl-daily] Fatal:', err);
  process.exit(1);
});
