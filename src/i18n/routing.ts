import { defineRouting } from 'next-intl/routing'

/**
 * AE i18n routing config.
 *
 * To integrate with AE proxy.ts (required — AE does NOT use middleware.ts):
 * Add to app/proxy.ts:
 *
 *   import createMiddleware from 'next-intl/middleware'
 *   import { routing } from '@/i18n/routing'
 *
 *   const intlMiddleware = createMiddleware(routing)
 *   // call intlMiddleware(request) before or after supabase session refresh
 *
 * Extend `locales` to support additional languages.
 */
export const routing = defineRouting({
  locales:       ['en', 'es', 'fr'],
  defaultLocale: 'en',
  localePrefix:  'as-needed', // only prefix non-default locales
})

export type Locale = (typeof routing.locales)[number]
