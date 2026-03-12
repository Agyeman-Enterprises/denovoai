import { test, expect } from '@playwright/test'
import { APP_CONTRACT } from '../contracts/app.contract'

test.describe('dashboard / home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_CONTRACT.routes.root)
  })

  test('home page renders with app-root', async ({ page }) => {
    await expect(page.getByTestId(APP_CONTRACT.testIds.appRoot)).toBeVisible()
  })

  test('feature cards section is visible', async ({ page }) => {
    await expect(page.getByTestId(APP_CONTRACT.testIds.featureCards)).toBeVisible()
  })

  test('AI Development card is present', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'AI Development' })).toBeVisible()
  })

  test('Smart Templates card is present', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Smart Templates' })).toBeVisible()
  })

  test('Orchestration card is present', async ({ page }) => {
    await expect(page.getByText('Orchestration')).toBeVisible()
  })

  test('Module Engine card is present', async ({ page }) => {
    await expect(page.getByText('Module Engine')).toBeVisible()
  })

  test('primary-list section renders', async ({ page }) => {
    await expect(page.getByTestId(APP_CONTRACT.testIds.primaryList)).toBeVisible()
  })

  test('create-primary button is present', async ({ page }) => {
    await expect(page.getByTestId(APP_CONTRACT.testIds.createPrimary)).toBeVisible()
  })

  test('search-primary input is present', async ({ page }) => {
    await expect(page.getByTestId(APP_CONTRACT.testIds.searchPrimary)).toBeVisible()
  })

  test('Recent Runs heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Runs' })).toBeVisible()
  })
})
