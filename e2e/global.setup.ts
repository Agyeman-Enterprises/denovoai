import { FullConfig } from '@playwright/test'

// denovoai has no authentication.
// The webServer block in playwright.config.ts handles server health.
// This setup is intentionally minimal.
async function globalSetup(_config: FullConfig) {
  console.log('✓ Global setup: denovoai (no auth)')
}

export default globalSetup
