import type { Page } from 'playwright';
import type { LayoutPatternId } from '../types';

interface LayoutSignals {
  sections: string[];
  parts: string[];
  whitespace: string;
  alignment: string;
  viewportRatio: number;
  hasSidebar: boolean;
  heroFraction: number;
  has2Col: boolean;
  has3Col: boolean;
  hasBento: boolean;
}

function classifyToCanonical(signals: LayoutSignals, sourceType?: string): LayoutPatternId {
  const s = signals.sections;
  const has = (name: string) => s.includes(name);

  if (sourceType === 'mobile-screen') return 'mobile-app-screen';
  if (has('sidebar') && signals.viewportRatio < 3 && !has('hero')) return 'dashboard-app';
  if (has('sidebar') && has('blog')) return 'docs-sidebar';
  if (has('sidebar') && has('gallery') && !has('hero')) return 'e-commerce-catalog';
  if (has('gallery') && !has('hero') && !has('features')) return 'e-commerce-pdp';
  if (s.length <= 1 && !has('hero')) return 'error-page';
  if (!has('hero') && signals.alignment === 'centered' && signals.whitespace === 'airy') return 'form-auth';

  if (has('hero')) {
    const hasPricing = has('pricing');
    const hasTestimonials = has('testimonials');
    const hasFeatures = has('features') || has('benefits');
    const hasBlog = has('blog');
    const hasCta = has('cta');
    const hasGallery = has('gallery');

    if (hasGallery && signals.viewportRatio >= 4) return 'portfolio-case-study';
    if (s.length >= 5 && (hasBlog || (hasPricing && hasTestimonials && hasFeatures && hasCta))) return 'marketing-hub';
    if (hasPricing && hasFeatures) return 'saas-landing-full';
    if (hasPricing && !hasFeatures) return 'pricing-page';
    if (hasFeatures && !hasPricing) return 'hero-features';
    if (hasBlog) return 'editorial-index';
    return 'hero-minimal';
  }

  if (has('blog') && signals.viewportRatio >= 3) return 'editorial-article';
  if (has('blog')) return 'editorial-index';
  if (has('gallery')) return 'portfolio-grid';
  if (has('pricing')) return 'pricing-page';
  return 'hero-minimal';
}

export async function extractLayout(page: Page, sourceType?: string): Promise<{
  layout_type: string;
  layout_freeform: string;
  layout_pattern_id: LayoutPatternId;
  layout_data: Record<string, unknown>;
}> {
  const raw = await page.evaluate(() => {
    const parts: string[] = [];
    const sections: string[] = [];

    if (document.querySelector('header, nav, [role="navigation"]')) {
      sections.push('header');
      const nav = document.querySelector('header, nav') as HTMLElement | null;
      const isSticky = nav ? (getComputedStyle(nav).position === 'sticky' || getComputedStyle(nav).position === 'fixed') : false;
      parts.push(isSticky ? 'sticky-header' : 'header');
    }

    const heroEl = document.querySelector('[class*="hero" i], [class*="Hero"], [id*="hero" i]') as HTMLElement | null
      ?? document.querySelector('main > section:first-of-type, main > div > section:first-of-type') as HTMLElement | null;
    if (heroEl) {
      sections.push('hero');
      const heroHeight = heroEl.getBoundingClientRect().height;
      parts.push(heroHeight >= window.innerHeight * 0.65 ? 'fullbleed-hero' : 'hero');
    }

    const seen = new Set<string>();
    document.querySelectorAll('[class*="grid" i], [style*="grid-template-columns"]').forEach(el => {
      const style = getComputedStyle(el);
      const cols = style.gridTemplateColumns;
      if (!cols || cols === 'none') return;
      let colCount = 0;
      const repeatMatch = cols.match(/repeat\((\d+)/);
      if (repeatMatch) { colCount = parseInt(repeatMatch[1], 10); }
      else { colCount = cols.trim().split(/\s+(?=\d|\()/).length; }
      let label = '';
      if (colCount === 2) label = '2-col';
      else if (colCount === 3) label = '3-col';
      else if (colCount === 4) label = '4-col';
      else if (colCount >= 5) label = 'bento-grid';
      if (label && !seen.has(label)) { seen.add(label); parts.push(label); }
    });

    const add = (selector: string, sectionName: string, label: string) => {
      if (document.querySelector(selector) && !sections.includes(sectionName)) {
        sections.push(sectionName); parts.push(label);
      }
    };
    add('[class*="feature" i], [id*="feature" i]',         'features',     'features');
    add('[class*="benefit" i], [id*="benefit" i]',         'benefits',     'benefits');
    add('[class*="testimonial" i], [class*="review" i]',   'testimonials', 'testimonials');
    add('[class*="pricing" i], [id*="pricing" i]',         'pricing',      'pricing-table');
    add('[class*="cta" i], [class*="calltoaction" i]',     'cta',          'cta');
    add('aside, [class*="sidebar" i]',                     'sidebar',      'sidebar');
    add('[class*="gallery" i], [class*="portfolio" i]',    'gallery',      'gallery');
    add('[class*="blog" i], [class*="article" i], article','blog',         'editorial-grid');
    add('footer, [role="contentinfo"]',                    'footer',       'footer');

    const body = document.body;
    const bodyPad = parseFloat(getComputedStyle(body).padding) || 0;
    const mainEl = document.querySelector('main, [role="main"], .container, .wrapper') as HTMLElement | null;
    const mainPad = mainEl ? parseFloat(getComputedStyle(mainEl).paddingLeft) || 0 : 0;
    const totalPad = Math.max(bodyPad, mainPad);
    let whitespace: string;
    if (totalPad >= 80) whitespace = 'airy';
    else if (totalPad >= 24) whitespace = 'comfortable';
    else whitespace = 'dense';

    const textEls = document.querySelectorAll('h1, h2, h3, p');
    let centeredCount = 0;
    textEls.forEach(el => { if (getComputedStyle(el).textAlign === 'center') centeredCount++; });
    const alignment = centeredCount > textEls.length / 2 ? 'centered' : 'left-anchored';
    const viewportRatio = Math.round((body.scrollHeight / window.innerHeight) * 100) / 100;
    const heroEl2 = document.querySelector('[class*="hero" i], [class*="Hero"], [id*="hero" i]') as HTMLElement | null;
    const heroFraction = heroEl2
      ? Math.round((heroEl2.getBoundingClientRect().height / window.innerHeight) * 100) / 100
      : 0;

    return { parts, sections, whitespace, alignment, viewportRatio, heroFraction,
      hasSidebar: sections.includes('sidebar'),
      has2Col: parts.includes('2-col'), has3Col: parts.includes('3-col'), hasBento: parts.includes('bento-grid') };
  });

  const layout_freeform = raw.parts.join(' + ') || 'single-page';
  const signals: LayoutSignals = {
    sections: raw.sections, parts: raw.parts, whitespace: raw.whitespace,
    alignment: raw.alignment, viewportRatio: raw.viewportRatio, hasSidebar: raw.hasSidebar,
    heroFraction: raw.heroFraction, has2Col: raw.has2Col, has3Col: raw.has3Col, hasBento: raw.hasBento,
  };
  const layout_pattern_id = classifyToCanonical(signals, sourceType);

  return {
    layout_type: layout_freeform,
    layout_freeform,
    layout_pattern_id,
    layout_data: {
      sections: raw.sections, pattern: layout_freeform, canonical_pattern: layout_pattern_id,
      whitespace_philosophy: raw.whitespace, alignment: raw.alignment, viewport_ratio: raw.viewportRatio,
      has_sidebar: raw.hasSidebar, has_2col: raw.has2Col, has_3col: raw.has3Col, has_bento: raw.hasBento,
    },
  };
}
