import { PostHog } from 'posthog-node'

let _client: PostHog | null = null

function getClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null
  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    })
  }
  return _client
}

/**
 * Track a server-side event (server components, API routes, server actions).
 * Fire-and-forget — does not block the request.
 */
export function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): void {
  const client = getClient()
  if (!client) return
  client.capture({ distinctId, event, properties: properties ?? {} })
}

/** Flush pending events — call in graceful shutdown handlers. */
export async function flushAnalytics(): Promise<void> {
  await _client?.shutdown()
  _client = null
}
