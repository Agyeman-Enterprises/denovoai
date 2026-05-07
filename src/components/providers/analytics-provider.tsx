'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

const POSTHOG_KEY  = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'
const HIPAA_MODE   = process.env.NEXT_PUBLIC_HIPAA_MODE === 'true'

/**
 * Add to root layout.tsx inside <body>.
 * HIPAA mode: disables session recording and person profiles.
 *
 * @example
 * // app/layout.tsx
 * <AnalyticsProvider />
 */
export function AnalyticsProvider() {
  const initialised = useRef(false)
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!POSTHOG_KEY || initialised.current) return
    initialised.current = true

    posthog.init(POSTHOG_KEY, {
      api_host:                  POSTHOG_HOST,
      capture_pageview:          false, // manual pageview below
      capture_pageleave:         true,
      // HIPAA-safe mode: strip all PII
      disable_session_recording: HIPAA_MODE,
      person_profiles:           HIPAA_MODE ? 'never' : 'identified_only',
      persistence:               'localStorage',
    })
  }, [])

  // Manual pageview on route change
  useEffect(() => {
    if (!POSTHOG_KEY) return
    posthog.capture('$pageview', { $current_url: window.location.href })
  }, [pathname, searchParams])

  return null
}
