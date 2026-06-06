import type { SourceConfig } from './types';

const GALLERY_CONFIGS: Record<string, SourceConfig> = {
  'awwwards.com':        { type: 'landing-page', rate_limit_ms: 5000, source_hub: 'awwwards' },
  'land-book.com':       { type: 'landing-page', rate_limit_ms: 5000, source_hub: 'land-book' },
  'cssdesignawards.com': { type: 'landing-page', rate_limit_ms: 5000, source_hub: 'cssda' },
  'siteinspire.com':     { type: 'landing-page', rate_limit_ms: 5000, source_hub: 'siteinspire' },
  'thefwa.com':          { type: 'landing-page', rate_limit_ms: 5000, source_hub: 'fwa' },
  'dribbble.com':        { type: 'design-shot',  rate_limit_ms: 3000, source_hub: 'dribbble' },
  'behance.net':         { type: 'design-shot',  rate_limit_ms: 3000, source_hub: 'behance' },
  'lapa.ninja':          { type: 'landing-page', rate_limit_ms: 5000, source_hub: 'lapa' },
  'saaspages.xyz':       { type: 'landing-page', rate_limit_ms: 5000, source_hub: 'saaspages' },
  'saaslandingpage.com': { type: 'landing-page', rate_limit_ms: 5000, source_hub: 'saaslandingpage' },
  'cofolios.com':        { type: 'landing-page', rate_limit_ms: 5000, source_hub: 'cofolios' },
  'mobbin.com':          { type: 'mobile-screen', rate_limit_ms: 3000, source_hub: 'mobbin' },
  'pageflows.com':       { type: 'mobile-screen', rate_limit_ms: 3000, source_hub: 'pageflows' },
  'hoverstat.es':        { type: 'landing-page', rate_limit_ms: 5000, source_hub: 'hoverstates' },
};

const BRAND_CONFIGS: Record<string, SourceConfig> = {
  'linear.app':       { type: 'brand-page', rate_limit_ms: 3000 },
  'stripe.com':       { type: 'brand-page', rate_limit_ms: 3000 },
  'notion.so':        { type: 'brand-page', rate_limit_ms: 3000 },
  'figma.com':        { type: 'brand-page', rate_limit_ms: 3000 },
  'vercel.com':       { type: 'brand-page', rate_limit_ms: 3000 },
  'supabase.com':     { type: 'brand-page', rate_limit_ms: 3000 },
  'apple.com':        { type: 'brand-page', rate_limit_ms: 4000 },
  'pentagram.com':    { type: 'brand-page', rate_limit_ms: 4000 },
  'locomotive.ca':    { type: 'brand-page', rate_limit_ms: 4000 },
  'activetheory.net': { type: 'brand-page', rate_limit_ms: 5000 },
};

const DEFAULT_CONFIG: SourceConfig = { type: 'landing-page', rate_limit_ms: 4000 };

export function getDomainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function getSourceConfig(domain: string): SourceConfig {
  return GALLERY_CONFIGS[domain] ?? BRAND_CONFIGS[domain] ?? DEFAULT_CONFIG;
}
