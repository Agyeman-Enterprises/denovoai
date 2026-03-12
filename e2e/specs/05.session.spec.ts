import { test, expect } from '@playwright/test'

const E2E_EMAIL = process.env.E2E_EMAIL
const E2E_PASSWORD = process.env.E2E_PASSWORD
const hasCredentials = !!(E2E_EMAIL && E2E_PASSWORD)

test.describe('session', () => {
  test.skip(!hasCredentials, 'Set E2E_EMAIL and E2E_PASSWORD in .env.e2e to run session tests')

  async function loginUser(page: import('@playwright/test').Page) {
    await page.goto('/login')
    await page.getByTestId('email-input').fill(E2E_EMAIL!)
    await page.getByTestId('password-input').fill(E2E_PASSWORD!)
    await page.getByTestId('submit-auth').click()
    await page.waitForURL('/', { timeout: 15_000 })
  }

  test('session persists across page reload', async ({ page }) => {
    await loginUser(page)
    await expect(page.getByTestId('logout')).toBeVisible()

    // Reload — session cookie keeps user logged in
    await page.reload()
    await expect(page.getByTestId('logout')).toBeVisible({ timeout: 10_000 })
  })

  test('session persists across navigation', async ({ page }) => {
    await loginUser(page)

    // Navigate away and back
    await page.goto('/billing')
    await page.goto('/')
    await expect(page.getByTestId('logout')).toBeVisible({ timeout: 10_000 })
  })

  test('logout clears session — protected pages redirect to login', async ({ page }) => {
    await loginUser(page)

    // Log out
    await page.getByTestId('logout').click()
    await expect(page.getByTestId('login-link')).toBeVisible({ timeout: 10_000 })

    // Billing page should redirect to login after logout
    await page.goto('/billing')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('unauthenticated user redirected to login from billing', async ({ page }) => {
    // Don't log in — go directly to billing
    await page.goto('/billing')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})
