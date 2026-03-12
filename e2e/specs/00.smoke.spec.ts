import { test, expect } from '@playwright/test'
import { APP_CONTRACT } from '../contracts/app.contract'

test.describe('smoke', () => {
  test('app loads with 200', async ({ page }) => {
    const res = await page.goto(APP_CONTRACT.routes.root)
    expect(res?.status()).toBe(200)
  })

  test('page has title', async ({ page }) => {
    await page.goto(APP_CONTRACT.routes.root)
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })

  test('app-root is present', async ({ page }) => {
    await page.goto(APP_CONTRACT.routes.root)
    await expect(page.getByTestId(APP_CONTRACT.testIds.appRoot)).toBeVisible()
  })

  test('hero heading is visible', async ({ page }) => {
    await page.goto(APP_CONTRACT.routes.root)
    await expect(page.getByTestId(APP_CONTRACT.testIds.heroHeading)).toBeVisible()
    await expect(page.getByTestId(APP_CONTRACT.testIds.heroHeading)).toContainText('Denovo AI')
  })
})
