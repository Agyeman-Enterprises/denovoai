import type { Metadata } from 'next'

const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'My App'

/** Normalise a URL to remove trailing slashes. */
export function canonicalUrl(path: string): string {
  const base = SITE_URL.replace(/\/$/, '')
  const clean = path.replace(/\/$/, '') || '/'
  return clean === '/' ? base : `${base}${clean}`
}

interface PageMetaOptions {
  title?: string
  description?: string
  image?: string
  path?: string
  noIndex?: boolean
}

/**
 * Generate Next.js Metadata for a page.
 * Merges page-level overrides onto site-wide defaults.
 *
 * @example
 * // app/about/page.tsx
 * export const metadata = generateMetadata({
 *   title: 'About',
 *   description: 'Learn about us.',
 *   path: '/about',
 * })
 */
export function generateMetadata(opts: PageMetaOptions = {}): Metadata {
  const {
    title,
    description = 'A product by Agyeman Enterprises.',
    image = `${SITE_URL}/opengraph-image.png`,
    path = '/',
    noIndex = false,
  } = opts

  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
  const canonical = canonicalUrl(path)

  return {
    title:       fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates:  { canonical },
    openGraph: {
      title:       fullTitle,
      description,
      url:         canonical,
      siteName:    SITE_NAME,
      images:      [{ url: image }],
      type:        'website',
    },
    twitter: {
      card:        'summary_large_image',
      title:       fullTitle,
      description,
      images:      [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true,  follow: true },
  }
}
