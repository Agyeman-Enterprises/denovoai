import { chromium } from 'playwright';
import type { TrawlSourceInsert } from './types';
import { TrawlRepository } from '../design-memory/trawl-repository';
import type { TrawlRequest, TrawlResult } from './types';
import { getDomainFromUrl, getSourceConfig } from './source-registry';
import { extractPalette } from './extractors/palette';
import { extractFonts } from './extractors/fonts';
import { extractLayout } from './extractors/layout';
import { extractSpacing } from './extractors/spacing';
import { extractDesignDNA } from './extractors/vibe';
import { captureScreenshot } from './screenshot';

const VIEWPORT_MAP = {
  'desktop-1440': { width: 1440, height: 900 },
  'mobile-375':   { width: 375,  height: 812 },
  'tablet-768':   { width: 768,  height: 1024 },
} as const;

export async function crawlUrl(
  url: string,
  request: TrawlRequest,
  repo: TrawlRepository
): Promise<TrawlResult> {
  const start = Date.now();
  const domain = getDomainFromUrl(url);

  if (!domain) {
    return { url, status: 'SKIPPED', metadata_completeness: 0, error: 'Invalid URL', duration_ms: Date.now() - start };
  }

  const config = getSourceConfig(domain);
  const viewport = VIEWPORT_MAP[request.viewport];
  const timeout = request.options?.timeout_ms ?? 30000;

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport });
    const ua = request.options?.user_agent ?? config.user_agent_override;
    if (ua) await page.setExtraHTTPHeaders({ 'User-Agent': ua });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    await page.waitForTimeout(1500);
    const waitSel = request.options?.wait_for_selector ?? config.wait_for_selector;
    if (waitSel) {
      await page.waitForSelector(waitSel, { timeout: 5000 }).catch(() => {});
    }

    const [palette, fonts, layout, spacing] = await Promise.all([
      extractPalette(page),
      extractFonts(page),
      extractLayout(page),
      extractSpacing(page),
    ]);

    const { vibe_tags, archetype } = extractDesignDNA(palette, fonts);

    let filled = 0;
    if (palette.length > 0)               filled++;
    if (fonts.length > 0)                 filled++;
    if (layout.layout_type !== 'single-page' && layout.layout_type !== '') filled++;
    if (vibe_tags.length > 0)             filled++;
    if (spacing.spacing_scale.length > 0) filled++;
    if (archetype !== 'neutral')          filled++;
    const completeness = Math.round((filled / 6) * 100) / 100;

    const sourceInsert: TrawlSourceInsert = {
      source_url: url,
      source_domain: domain,
      source_type: config.type,
      palette,
      fonts,
      layout_type:       layout.layout_type,
      layout_freeform:   layout.layout_freeform,
      layout_pattern_id: layout.layout_pattern_id,
      layout_data:       layout.layout_data,
      vibe_tags,
      archetype,
      spacing_data: spacing,
      source_hub: config.source_hub,
      captured_at: new Date().toISOString(),
      captured_by: 'trawl-pipeline-v1',
      primary_color_hex: palette.find(p => p.role === 'primary')?.hex ?? palette[0]?.hex,
      primary_font_family: fonts.find(f => f.role === 'body')?.family ?? fonts[0]?.family,
      metadata_completeness: completeness,
    };

    const source = await repo.insertSource(sourceInsert);

    let screenshot_id: string | undefined;
    if (request.capture_screenshot) {
      const shot = await captureScreenshot(page);
      const screenshotRow = await repo.insertScreenshot({
        source_id: source.id,
        aenio_bucket: 'designai-trawl-cache',
        aenio_path: `${domain}/${new Date().toISOString().slice(0, 7)}/${source.id}.png`,
        aenio_size_bytes: shot.size_bytes,
        perceptual_hash: shot.perceptual_hash,
        width_px: shot.width_px,
        height_px: shot.height_px,
        viewport: request.viewport,
        captured_at: new Date().toISOString(),
      });
      screenshot_id = screenshotRow.id;
    }

    return {
      url, status: 'SUCCESS', source_id: source.id, screenshot_id,
      metadata_completeness: completeness, duration_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      url, status: 'FAILED', metadata_completeness: 0,
      error: (err as Error).message, duration_ms: Date.now() - start,
    };
  } finally {
    await browser.close();
  }
}
