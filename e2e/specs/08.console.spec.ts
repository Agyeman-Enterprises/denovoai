import { test, expect } from '@playwright/test'
import { APP_CONTRACT } from '../contracts/app.contract'

const IGNORED_PATTERNS = [
  /placeholder\.supabase\.co/,
  /ECONNREFUSED/,
  /net::ERR_/,
  /favicon\.ico/,
]

function isIgnored(msg: string): boolean {
  return IGNORED_PATTERNS.some(p => p.test(msg))
}

test.describe('console + network health', () => {
  test('no uncaught JS errors on home load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => {
      if (!isIgnored(err.message)) errors.push(err.message)
    })
    await page.goto(APP_CONTRACT.routes.root)
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })

  test('no 500 responses on home load', async ({ page }) => {
    const failures: string[] = []
    page.on('response', res => {
      if (res.status() >= 500 && !isIgnored(res.url())) {
        failures.push(`${res.status()} ${res.url()}`)
      }
    })
    await page.goto(APP_CONTRACT.routes.root)
    await page.waitForLoadState('networkidle')
    expect(failures).toHaveLength(0)
  })

  test('runs API returns 200', async ({ page }) => {
    const res = await page.request.get('/api/runs')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('runs')
    expect(Array.isArray(body.runs)).toBe(true)
  })
})
