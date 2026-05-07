import type { MetadataRoute } from 'next'

const SITE_NAME  = process.env.NEXT_PUBLIC_SITE_NAME  ?? 'My App'
const SHORT_NAME = process.env.NEXT_PUBLIC_SHORT_NAME ?? 'App'
const SITE_URL   = process.env.NEXT_PUBLIC_SITE_URL   ?? 'https://example.com'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             SITE_NAME,
    short_name:       SHORT_NAME,
    description:      `${SITE_NAME} — Built with Agyeman Enterprises`,
    start_url:        '/',
    scope:            '/',
    display:          'standalone',
    background_color: '#09090b',
    theme_color:      '#09090b',
    orientation:      'portrait-primary',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    related_applications: [],
    prefer_related_applications: false,
  }
}
