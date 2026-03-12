import { test, expect } from '@playwright/test'
import { routes } from './env'

test.describe('home page content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.root)
  })

  test('shows platform name in header bar', async ({ page }) => {
    await expect(page.locator('code')).toContainText('Denovo AI Platform')
  })

  test('shows AI Development card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'AI Development' })).toBeVisible()
  })

  test('shows Smart Templates card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Smart Templates' })).toBeVisible()
  })

  test('shows Orchestration card', async ({ page }) => {
    await expect(page.getByText('Orchestration')).toBeVisible()
  })

  test('shows Module Engine card', async ({ page }) => {
    await expect(page.getByText('Module Engine')).toBeVisible()
  })
})
