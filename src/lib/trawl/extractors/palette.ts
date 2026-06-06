import type { Page } from 'playwright';
import type { PaletteExtracted } from '../types';

export async function extractPalette(page: Page): Promise<PaletteExtracted[]> {
  const domColors = await page.evaluate(() => {
    const results: Array<{ hex: string; context: string }> = [];

    function rgbToHex(rgb: string): string | null {
      const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return null;
      const r = parseInt(match[1]!, 10);
      const g = parseInt(match[2]!, 10);
      const b = parseInt(match[3]!, 10);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const bodyHex = rgbToHex(bodyBg);
    if (bodyHex && bodyHex !== '#000000') results.push({ hex: bodyHex, context: 'background' });

    const bodyColor = getComputedStyle(document.body).color;
    const textHex = rgbToHex(bodyColor);
    if (textHex) results.push({ hex: textHex, context: 'text' });

    const buttons = document.querySelectorAll('button, a[href], [role="button"]');
    const seen = new Set<string>();
    buttons.forEach((el) => {
      const style = getComputedStyle(el);
      const bg = rgbToHex(style.backgroundColor);
      if (bg && bg !== '#000000' && bg !== '#ffffff' && !seen.has(bg)) {
        seen.add(bg);
        results.push({ hex: bg, context: 'interactive' });
      }
    });

    const headers = document.querySelectorAll('h1, h2, h3');
    headers.forEach((el) => {
      const style = getComputedStyle(el);
      const color = rgbToHex(style.color);
      if (color && !seen.has(color)) {
        seen.add(color);
        results.push({ hex: color, context: 'heading' });
      }
    });

    return results;
  });

  const palette: PaletteExtracted[] = [];
  const total = domColors.length || 1;

  for (let i = 0; i < domColors.length && i < 8; i++) {
    const entry = domColors[i]!;
    let role: PaletteExtracted['role'] = 'other';

    if (entry.context === 'background') role = 'background';
    else if (entry.context === 'text') role = 'text';
    else if (entry.context === 'interactive' && i === 0) role = 'primary';
    else if (entry.context === 'interactive') role = 'secondary';
    else if (entry.context === 'heading') role = 'accent';

    palette.push({
      hex: entry.hex.toLowerCase(),
      role,
      frequency: Math.round((1 / total) * 100) / 100,
    });
  }

  return palette;
}
