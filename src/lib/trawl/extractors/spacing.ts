import type { Page } from 'playwright';
import type { SpacingExtracted } from '../types';

export async function extractSpacing(page: Page): Promise<SpacingExtracted> {
  const raw = await page.evaluate(() => {
    const tokens: Record<string, string> = {};
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          Array.from(sheet.cssRules ?? []).forEach(rule => {
            if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
              const style = rule.style;
              for (let i = 0; i < style.length; i++) {
                const prop = style[i];
                if (prop.startsWith('--') && /radius|spacing|gap|padding|shadow|blur|border/i.test(prop)) {
                  tokens[prop] = style.getPropertyValue(prop).trim();
                }
              }
            }
          });
        } catch { /* cross-origin */ }
      });
    } catch { /* no stylesheets */ }

    const radiiRaw = new Map<string, number>();
    document.querySelectorAll('button, a, input, [class*="card" i], [class*="badge" i], [class*="tag" i], [class*="chip" i], [class*="btn" i], [class*="pill" i]')
      .forEach(el => {
        const r = getComputedStyle(el).borderRadius;
        if (r && r !== '0px' && r !== '0') radiiRaw.set(r, (radiiRaw.get(r) ?? 0) + 1);
      });
    const sortedRadii = Array.from(radiiRaw.entries()).sort((a, b) => b[1] - a[1]).map(([r]) => r).slice(0, 8);

    const shadowsRaw = new Map<string, number>();
    document.querySelectorAll('[class*="card" i], [class*="shadow" i], [class*="panel" i], [class*="modal" i], [class*="dropdown" i], [class*="popup" i]')
      .forEach(el => {
        const s = getComputedStyle(el).boxShadow;
        if (s && s !== 'none') shadowsRaw.set(s, (shadowsRaw.get(s) ?? 0) + 1);
      });
    const sortedShadows = Array.from(shadowsRaw.entries()).sort((a, b) => b[1] - a[1]).map(([s]) => s).slice(0, 4);

    const spacingSet = new Set<number>();
    document.querySelectorAll('section, main, article, [class*="container" i], [class*="wrapper" i], [class*="section" i]')
      .forEach(el => {
        const style = getComputedStyle(el);
        [style.paddingTop, style.paddingBottom, style.paddingLeft, style.paddingRight, style.marginTop, style.marginBottom, style.gap].forEach(v => {
          const n = parseFloat(v);
          if (n > 0 && n <= 320) spacingSet.add(Math.round(n));
        });
      });

    let hasBlur = false;
    document.querySelectorAll('*').forEach(el => {
      const style = getComputedStyle(el);
      if (style.backdropFilter && style.backdropFilter !== 'none') hasBlur = true;
      if (style.filter && style.filter.includes('blur')) hasBlur = true;
    });

    const mainEl = document.querySelector('main, [role="main"]') as HTMLElement | null;
    const mainPad = mainEl ? parseFloat(getComputedStyle(mainEl).paddingLeft) || 0 : 0;

    return { radii: sortedRadii, shadows: sortedShadows, spacingValues: Array.from(spacingSet).sort((a, b) => a - b).slice(0, 16), tokens, hasBlur, mainPad };
  });

  let radius_philosophy: SpacingExtracted['radius_philosophy'] = 'sharp';
  if (raw.radii.length > 0) {
    const dominant = raw.radii[0];
    const val = parseFloat(dominant);
    if (dominant.includes('9999') || dominant.includes('50%')) radius_philosophy = 'pill';
    else if (val >= 20) radius_philosophy = 'rounded';
    else if (val >= 4) radius_philosophy = 'subtle';
    else if (raw.radii.length > 3) radius_philosophy = 'mixed';
    else radius_philosophy = 'sharp';
  }

  let shadow_philosophy: SpacingExtracted['shadow_philosophy'] = 'none';
  if (raw.shadows.length > 0) {
    const s = raw.shadows[0];
    if (raw.shadows.length >= 3) shadow_philosophy = 'layered';
    else if (s.includes('rgba(0, 0, 0, 0') || s.match(/0\.\d[1-3]\d*\)/)) shadow_philosophy = 'soft';
    else if (s.includes('inset') || s.match(/\d+px \d+px 0/)) shadow_philosophy = 'hard';
    else shadow_philosophy = 'soft';
  } else if (raw.hasBlur) {
    shadow_philosophy = 'soft';
  } else {
    shadow_philosophy = 'flat';
  }

  let whitespace_philosophy: SpacingExtracted['whitespace_philosophy'] = 'comfortable';
  if (raw.mainPad >= 80) whitespace_philosophy = 'airy';
  else if (raw.mainPad <= 16) whitespace_philosophy = 'dense';

  return {
    border_radii: raw.radii,
    radius_philosophy,
    shadows: raw.shadows,
    shadow_philosophy,
    spacing_scale: raw.spacingValues,
    tokens: raw.tokens,
    has_blur: raw.hasBlur,
    whitespace_philosophy,
  };
}
