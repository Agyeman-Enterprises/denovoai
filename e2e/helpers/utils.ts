import { Page } from '@playwright/test'

export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
}

export async function expectNoConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = []
  page.on('pageerror', err => errors.push(err.message))
  await page.waitForLoadState('networkidle')
  return errors
}
