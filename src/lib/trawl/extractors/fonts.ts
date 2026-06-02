import type { Page } from 'playwright';
import type { FontExtracted } from '../types';

export async function extractFonts(page: Page): Promise<FontExtracted[]> {
  const rawFonts = await page.evaluate(() => {
    const fontMap = new Map<string, {
      count: number;
      tag: string;
      size: string;
      weight: number;
      letterSpacing: string;
      lineHeight: string;
    }>();

    const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, li, td, th, label, button, code, pre');
    elements.forEach(el => {
      const style = getComputedStyle(el);
      const family = style.fontFamily.split(',')[0]?.trim().replace(/['"]/g, '') ?? 'sans-serif';
      const weight = parseInt(style.fontWeight, 10) || 400;
      const size = style.fontSize;
      const tag = el.tagName.toLowerCase();
      const key = `${family}__${weight}`;

      const existing = fontMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        fontMap.set(key, { count: 1, tag, size, weight, letterSpacing: style.letterSpacing, lineHeight: style.lineHeight });
      }
    });

    return Array.from(fontMap.entries()).map(([key, data]) => {
      const parts = key.split('__');
      const family = parts.slice(0, -1).join('__');
      return { family, ...data };
    });
  });

  rawFonts.sort((a, b) => b.count - a.count);

  const classified: FontExtracted[] = rawFonts.slice(0, 10).map(f => {
    let role: FontExtracted['role'] = 'other';
    if (/^h[1-3]$/.test(f.tag)) role = 'heading';
    else if (f.tag === 'p' || f.tag === 'span' || f.tag === 'li' || f.tag === 'td') role = 'body';
    else if (f.tag === 'code' || f.tag === 'pre') role = 'mono';
    else if (f.size && parseInt(f.size) >= 48) role = 'display';

    return {
      family: f.family,
      weight: f.weight,
      role,
      size: f.size,
      tracking: f.letterSpacing !== 'normal' ? f.letterSpacing : undefined,
      leading: f.lineHeight !== 'normal' ? f.lineHeight : undefined,
    };
  });

  const heading = classified.find(f => f.role === 'heading' || f.role === 'display');
  const body = classified.find(f => f.role === 'body');
  if (heading && body && heading.family !== body.family) {
    heading.pairing = `${heading.family} / ${body.family}`;
  }

  return classified;
}
