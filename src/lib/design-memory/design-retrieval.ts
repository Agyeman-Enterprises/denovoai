import type { DesignTokens, ProductSpec, TrawlSource, PaletteEntry, FontEntry } from '../trawl/types';
import { TrawlRepository } from './trawl-repository';

function specToVibeTags(spec: ProductSpec): string[] {
  const domainTags: Record<string, string[]> = {
    healthcare: ['medical', 'clinical', 'health', 'professional', 'clean'],
    saas:       ['productivity', 'software', 'dashboard', 'enterprise', 'clean'],
    ecommerce:  ['shop', 'retail', 'commerce', 'product', 'conversion'],
    analytics:  ['data', 'metrics', 'dashboard', 'enterprise', 'minimal'],
    crm:        ['crm', 'enterprise', 'professional', 'workflow'],
    education:  ['education', 'learning', 'academic', 'clean'],
    general:    ['app', 'software', 'clean'],
  };
  const intentTags: Record<string, string[]> = {
    minimal:  ['minimal', 'clean', 'whitespace', 'simple'],
    modern:   ['modern', 'contemporary', 'fresh', 'sleek'],
    bold:     ['bold', 'impactful', 'strong', 'vibrant'],
    premium:  ['premium', 'luxury', 'refined', 'elegant'],
    playful:  ['playful', 'fun', 'vibrant', 'energetic'],
  };
  return [
    ...(domainTags[spec.domain] ?? domainTags['general']!),
    ...(intentTags[spec.brandIntent] ?? []),
  ];
}

function synthesizeTokensFromSources(sources: TrawlSource[], spec: ProductSpec): DesignTokens {
  const ranked = [...sources].sort((a, b) => (b.metadata_completeness ?? 0) - (a.metadata_completeness ?? 0));

  let primary = '#1F6FEB';
  let background = '#ffffff';
  let surface = '#f8fafc';
  let text = '#0f172a';
  let textMuted = '#64748b';
  let border = '#e2e8f0';

  for (const src of ranked) {
    const primaryEntry = (src.palette as PaletteEntry[]).find((p) => p.role === 'primary');
    const bgEntry = (src.palette as PaletteEntry[]).find((p) => p.role === 'background');
    if (primaryEntry?.hex) primary = primaryEntry.hex;
    if (bgEntry?.hex) background = bgEntry.hex;
    if (primaryEntry?.hex) break;
  }

  if (spec.brandIntent === 'bold') {
    background = '#0f172a'; surface = '#1e293b'; text = '#f8fafc'; textMuted = '#94a3b8'; border = '#334155';
  }
  if (spec.brandIntent === 'premium') {
    background = '#fafaf9'; surface = '#ffffff';
  }

  let headingFamily = 'Inter, sans-serif';
  let bodyFamily = 'Inter, sans-serif';
  const monoFamily = 'ui-monospace, SFMono-Regular, monospace';

  for (const src of ranked) {
    const fonts = src.fonts as FontEntry[];
    const headingFont = fonts.find((f) => f.role === 'heading');
    const bodyFont = fonts.find((f) => f.role === 'body');
    if (headingFont?.family) headingFamily = `'${headingFont.family}', sans-serif`;
    if (bodyFont?.family) bodyFamily = `'${bodyFont.family}', sans-serif`;
    if (headingFont?.family || bodyFont?.family) break;
  }

  const radiiMap: Record<string, { sm: string; md: string; lg: string; full: string }> = {
    minimal:  { sm: '2px',  md: '4px',  lg: '8px',  full: '9999px' },
    modern:   { sm: '4px',  md: '8px',  lg: '12px', full: '9999px' },
    bold:     { sm: '4px',  md: '8px',  lg: '16px', full: '9999px' },
    premium:  { sm: '2px',  md: '6px',  lg: '10px', full: '9999px' },
    playful:  { sm: '8px',  md: '16px', lg: '24px', full: '9999px' },
  };
  const radii = radiiMap[spec.brandIntent] ?? radiiMap['modern']!;

  return {
    colors: { primary, background, surface, text, 'text-muted': textMuted, border },
    typography: {
      heading: { fontFamily: headingFamily, fontSize: '24px', fontWeight: '700', lineHeight: '1.25' },
      body:    { fontFamily: bodyFamily,    fontSize: '16px', fontWeight: '400', lineHeight: '1.6' },
      mono:    { fontFamily: monoFamily,    fontSize: '14px', fontWeight: '400' },
    },
    spacing: { base: '8px', sm: '4px', md: '16px', lg: '24px', xl: '32px' },
    radii,
    shadows: {
      sm: '0 1px 2px rgba(0,0,0,0.06)',
      md: '0 4px 6px rgba(0,0,0,0.08)',
      lg: '0 10px 15px rgba(0,0,0,0.10)',
    },
  };
}

export async function retrieveDesignTokens(spec: ProductSpec): Promise<DesignTokens | null> {
  let repo: TrawlRepository;
  try {
    repo = new TrawlRepository();
  } catch {
    return null;
  }

  const tags = specToVibeTags(spec);
  let sources: TrawlSource[] = [];
  try {
    sources = await repo.findByVibe(tags, 10);
  } catch {
    return null;
  }

  if (sources.length === 0) return null;
  return synthesizeTokensFromSources(sources, spec);
}

export function tokensToCssGlobals(tokens: DesignTokens): string {
  const { colors, typography, spacing, radii, shadows } = tokens;

  const colorVars = Object.entries(colors).map(([k, v]) => `  --${k}: ${v};`).join('\n');
  const bodyFont = typography['body']?.fontFamily ?? 'Inter, sans-serif';
  const headingFont = typography['heading']?.fontFamily ?? bodyFont;
  const monoFont = typography['mono']?.fontFamily ?? 'ui-monospace, monospace';
  const spacingVars = Object.entries(spacing).map(([k, v]) => `  --spacing-${k}: ${v};`).join('\n');
  const radiiVars = Object.entries(radii).map(([k, v]) => `  --radius-${k}: ${v};`).join('\n');
  const shadowVars = Object.entries(shadows).map(([k, v]) => `  --shadow-${k}: ${v};`).join('\n');

  const fontImports: string[] = [];
  const toGFamilyParam = (family: string) => family.split(',')[0]!.replace(/'/g, '').trim().replace(/\s+/g, '+');
  for (const [role, font] of Object.entries(typography)) {
    const raw = font.fontFamily.split(',')[0]!.replace(/'/g, '').trim();
    if (raw && !raw.startsWith('ui-') && !raw.startsWith('system') && raw !== 'sans-serif' && raw !== 'monospace' && role !== 'mono') {
      fontImports.push(toGFamilyParam(raw));
    }
  }
  const uniqueFonts = [...new Set(fontImports)];
  const gfImport = uniqueFonts.length > 0
    ? `@import url('https://fonts.googleapis.com/css2?${uniqueFonts.map((f) => `family=${f}:wght@400;600;700`).join('&')}&display=swap');\n\n`
    : '';

  return `${gfImport}:root {\n${colorVars}\n  --font-body: ${bodyFont};\n  --font-heading: ${headingFont};\n  --font-mono: ${monoFont};\n${spacingVars}\n${radiiVars}\n${shadowVars}\n}\n\n* {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}\n\nhtml {\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\nbody {\n  font-family: var(--font-body);\n  background: var(--background);\n  color: var(--text);\n  min-height: 100vh;\n}\n`;
}
