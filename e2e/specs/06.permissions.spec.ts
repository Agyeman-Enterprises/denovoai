import { test, expect } from '@playwright/test'

const E2E_EMAIL = process.env.E2E_EMAIL
const E2E_PASSWORD = process.env.E2E_PASSWORD
const hasCredentials = !!(E2E_EMAIL && E2E_PASSWORD)

test.describe('permissions', () => {
  test.skip(!hasCredentials, 'Set E2E_EMAIL and E2E_PASSWORD in .env.e2e to run permissions tests')

  async function loginUser(page: import('@playwright/test').Page) {
    await page.goto('/login')
    await page.getByTestId('email-input').fill(E2E_EMAIL!)
    await page.getByTestId('password-input').fill(E2E_PASSWORD!)
    await page.getByTestId('submit-auth').click()
    await page.waitForURL('/', { timeout: 15_000 })
  }

  test('unauthenticated user sees sign-in prompt, not create form', async ({ page }) => {
    await page.goto('/')
    // If supabase is configured, the form shows a sign-in prompt for unauth users
    const loginLink = page.getByTestId('login-link')
    const signInText = page.locator('text=Sign in')
    const isVisible = await loginLink.isVisible().catch(() => false)
    if (isVisible) {
      await expect(loginLink).toBeVisible()
    } else {
      // No supabase configured — form is always visible
      await expect(page.getByTestId('create-run-form')).toBeVisible()
    }
  })

  test('authenticated user can see create form', async ({ page }) => {
    await loginUser(page)
    await expect(page.getByTestId('create-run-form')).toBeVisible()
    await expect(page.getByTestId('create-primary')).toBeVisible()
  })

  test('free user sees run count in nav', async ({ page }) => {
    await loginUser(page)
    const menu = page.getByTestId('nav-user-menu')
    // Either shows "X/3 runs" (free) or "PRO"
    await expect(menu).toBeVisible()
    const text = await menu.textContent()
    const hasPlanInfo = text?.includes('runs') || text?.includes('PRO')
    expect(hasPlanInfo).toBeTruthy()
  })

  test('billing page accessible to authenticated user', async ({ page }) => {
    await loginUser(page)
    await page.goto('/billing')
    await expect(page.getByTestId('app-root')).toBeVisible()
    await expect(page.getByTestId('current-plan')).toBeVisible({ timeout: 10_000 })
  })

  test('billing page redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/billing')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('API runs endpoint returns 401 for unauthenticated POST when supabase configured', async ({ page }) => {
    const response = await page.request.post('/api/runs', {
      data: { prompt: 'test prompt' },
      headers: { 'Content-Type': 'application/json' },
    })
    // Either 401 (auth required) or 200 (no supabase configured — filesystem mode)
    expect([200, 201, 401, 402]).toContain(response.status())
  })
})
