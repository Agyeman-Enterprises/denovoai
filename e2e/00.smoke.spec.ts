import { test, expect } from '@playwright/test'
import { routes } from './env'

test.describe('smoke', () => {
  test('home page loads with 200', async ({ page }) => {
    const res = await page.goto(routes.root)
    expect(res?.status()).toBe(200)
  })

  test('page title is set', async ({ page }) => {
    await page.goto(routes.root)
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })

  test('h1 Denovo AI is visible', async ({ page }) => {
    await page.goto(routes.root)
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('Denovo AI')
  })
})
