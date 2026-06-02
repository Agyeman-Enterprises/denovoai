import type { PaletteExtracted, FontExtracted } from '../types';

export interface DesignDNA {
  vibe_tags: string[];
  archetype: string;
}

const RE_SERIF = /garamond|caslon|didot|bodoni|georgia|times|palatino|baskerville|freight|tiempos|editorial|chronicle|canela|cormorant|playfair|minion|sabon|trajan|brioso|domaine|feijoa|le.?monde|austin|portrait|signifier/i;
const RE_MONO  = /mono|code|courier|inconsolata|jetbrains|fira|source.?code|ibm.?plex.?mono|space.?mono|roboto.?mono|cascadia|hack|dank|operator/i;
const RE_GEOM_SANS = /inter|dm.?sans|plus.?jakarta|outfit|satoshi|cabinet|clash|general.?sans|manrope|neue.?haas|helvetica.?neue|aktiv|circular|brown|graphik|apercu|gt.?walsheim|matter|sohne|lausanne|euclid|roobert/i;
const RE_DISPLAY = /display|poster|condensed|extended|compressed|wide|ultra|black|heavy|impact|bebas|druk|dharma/i;

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = d / (l > 0.5 ? 2 - max - min : max + min);
  const h =
    max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6
    : max === g ? ((b - r) / d + 2) / 6
    : ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function deriveArchetype(tags: Set<string>): string {
  if (tags.has('glassmorphism')) return 'glassmorphism';
  if (tags.has('brutalist')) return 'brutalist';
  if (tags.has('dark-mode') && tags.has('serif-led')) return 'dark-luxury';
  if (tags.has('editorial') && tags.has('serif-led')) return 'editorial';
  if (tags.has('organic')) return 'organic-biophilic';
  if (tags.has('dark-mode') && tags.has('gradient-heavy')) return 'dark-gradient';
  if (tags.has('typographic')) return 'typographic';
  if (tags.has('geometric')) return 'geometric';
  if (tags.has('dark-mode') && tags.has('bold-display')) return 'dark-bold';
  if (tags.has('colorful') && tags.has('bold-color')) return 'maximalist';
  if (tags.has('dark-mode')) return 'dark-mode';
  if (tags.has('editorial')) return 'editorial';
  if (tags.has('light-minimal') || tags.has('airy')) return 'minimal';
  return 'neutral';
}

export function extractDesignDNA(palette: PaletteExtracted[], fonts: FontExtracted[]): DesignDNA {
  const tags = new Set<string>();

  const bg = palette.find(p => p.role === 'background');
  const bgHsl = bg ? hexToHsl(bg.hex) : null;
  if (bgHsl) {
    if (bgHsl.l < 0.15) tags.add('dark-mode');
    else if (bgHsl.l > 0.9 && bgHsl.s < 0.08) tags.add('light-minimal');
    if (bgHsl.l > 0.88 && bgHsl.s < 0.05) tags.add('airy');
  }

  const chromatic = palette.filter(p => (hexToHsl(p.hex)?.s ?? 0) > 0.12);
  if (chromatic.length <= 1) tags.add('monochromatic');
  if (chromatic.length >= 4) tags.add('colorful');

  const primary = palette.find(p => p.role === 'primary') ?? palette[0];
  if (primary) {
    const hsl = hexToHsl(primary.hex);
    if (hsl) {
      if (hsl.s > 0.68) tags.add('bold-color');
      else if (hsl.s < 0.18) tags.add('muted');
      if (hsl.h >= 15 && hsl.h <= 52) tags.add('warm-toned');
      else if (hsl.h >= 185 && hsl.h <= 265) tags.add('cool-toned');
      if (tags.has('dark-mode') && hsl.h >= 240 && hsl.h <= 300 && hsl.s > 0.35) tags.add('glassmorphism');
    }
  }

  const hues = palette
    .map(p => hexToHsl(p.hex))
    .filter((h): h is NonNullable<typeof h> => h !== null && h.s > 0.25)
    .map(h => h.h)
    .sort((a, b) => a - b);
  if (hues.length >= 3) {
    const spread = hues[hues.length - 1] - hues[0];
    if (spread > 25 && spread < 130) tags.add('gradient-heavy');
  }

  const heading = fonts.find(f => f.role === 'heading' || f.role === 'display');
  const body = fonts.find(f => f.role === 'body');
  if (heading) {
    const fam = heading.family.toLowerCase();
    const isSerif   = RE_SERIF.test(fam) && !fam.includes('sans');
    const isMono    = RE_MONO.test(fam);
    const isGeom    = RE_GEOM_SANS.test(fam);
    const isDisplay = RE_DISPLAY.test(fam);
    if (isSerif) { tags.add('serif-led'); tags.add('editorial'); }
    if (isMono)    tags.add('brutalist');
    if (isGeom)    tags.add('sans-modern');
    if (isDisplay) tags.add('display-type');
    if (heading.weight >= 800) tags.add('bold-display');
    if (heading.weight <= 200 && !isSerif) tags.add('airy');
  }

  if (heading && body) {
    const hFam = heading.family.toLowerCase();
    const bFam = body.family.toLowerCase();
    const hSerif = RE_SERIF.test(hFam) && !hFam.includes('sans');
    const bSans  = !(RE_SERIF.test(bFam) && !bFam.includes('sans'));
    if (hSerif && bSans) tags.add('editorial');
  }

  const families = new Set(fonts.map(f => f.family.toLowerCase()));
  if (families.size === 1 && palette.length <= 3) tags.add('typographic');

  if (tags.has('warm-toned') && tags.has('light-minimal')) tags.add('organic');
  if (tags.has('cool-toned') && tags.has('sans-modern'))   tags.add('geometric');

  return { vibe_tags: Array.from(tags).slice(0, 8), archetype: deriveArchetype(tags) };
}

export const extractVibeTags = (palette: PaletteExtracted[], fonts: FontExtracted[]) =>
  extractDesignDNA(palette, fonts).vibe_tags;
